'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { loadConfiguredAgentbookProject } from '@/app/actions/load-agentbook-project'
import { runExternalStory } from '@/app/actions/run-external-story'
import { runRealStory } from '@/app/actions/run-real-story'
import { discoverStories, groupStoriesByAgent, type AgentWithStories } from '@/lib/agentbook/discovery'
import { evaluateStory } from '@/lib/agentbook/evaluator'
import {
  executionMetrics,
  observableTimeline,
  type CompletedExecutionRecord,
  type ExecutionBoundaryEvidence,
  type SafeExecutionError,
} from '@/lib/agentbook/execution-record'
import { localStoryRunner } from '@/lib/agentbook/runner'
import type { DisplayStory, RecordedEvaluation, StoryGivenValue } from '@/lib/agentbook/domain'
import { Activity, ArrowDown, Check, ChevronDown, ChevronRight, Clock3, Code2, Copy, FlaskConical, GitCompare, Headphones, ListChecks, Moon, Play, Search, Settings2, Sun, WrapText, Wrench, X } from 'lucide-react'

const discoveredStories = discoverStories()
const discoveredAgents = groupStoriesByAgent(discoveredStories)
const iconMap = { headset: Headphones, target: Wrench, search: Search }

type Tab = 'Canvas' | 'Story' | 'Runs' | 'Compare'
type GivenState = Record<string, string>
type ExpandedState = Record<string, boolean>
type UiRunState =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'completed'; execution: CompletedExecutionRecord; boundaryEvidence?: ExecutionBoundaryEvidence; source: 'real' | 'external' | 'prototype-mock' }
  | { kind: 'execution-error'; error: SafeExecutionError }

function displayGivenValue(value: StoryGivenValue): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function givenEntries(story: DisplayStory): Array<{ key: string; value: string }> {
  if (!Array.isArray(story.given)) {
    return Object.entries(story.given).map(([key, value]) => ({ key, value: displayGivenValue(value) }))
  }
  return story.given.map((line) => {
    const [key, ...value] = line.split(':')
    return { key: key.trim(), value: value.join(':').trim() }
  })
}

function parseGiven(story: DisplayStory): GivenState {
  return Object.fromEntries(givenEntries(story).map(({ key, value }) => [key, value]))
}

function isServerExecutable(story: DisplayStory): boolean {
  return story.execution?.kind === 'real-agent' || story.execution?.kind === 'external-profile'
}

function executePrototypeStory(story: DisplayStory, values: GivenState): CompletedExecutionRecord {
  const observedRun = localStoryRunner.run(story, values)
  return { observedRun, evaluationResult: evaluateStory(story, observedRun) }
}

function initialRunState(story: DisplayStory, values: GivenState): UiRunState {
  if (isServerExecutable(story)) return { kind: 'idle' }
  return { kind: 'completed', execution: executePrototypeStory(story, values), source: 'prototype-mock' }
}

function Badge({ children, tone = 'muted' }: { children: React.ReactNode; tone?: 'muted' | 'green' | 'yellow' | 'red' }) {
  return <span className={`ab-badge ab-${tone}`}>{children}</span>
}

function Panel({ title, icon: Icon, children, right }: { title: string; icon?: React.ElementType; children: React.ReactNode; right?: React.ReactNode }) {
  return <section className="ab-panel"><div className="ab-panel-head"><div className="ab-panel-title">{Icon ? <Icon size={14} /> : null}<span>{title}</span></div>{right}</div>{children}</section>
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return <button className="ab-text-button" onClick={copy} type="button"><Copy size={13} /> {copied ? 'Copied' : label}</button>
}

type SidebarProps = {
  selectedAgent: string
  selectedStory: string
  setSelectedAgent: (id: string) => void
  setSelectedStory: (id: string) => void
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
  agentList: AgentWithStories[]
  projectName: string
  query: string
  setQuery: (query: string) => void
}

function Sidebar({ selectedAgent, selectedStory, setSelectedAgent, setSelectedStory, expanded, setExpanded, agentList, projectName, query, setQuery }: SidebarProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim().toLowerCase()
  const visibleAgents = agentList.flatMap((agent) => {
    const stories = agent.stories.filter((story) => `${agent.name} ${story.name} ${story.kind}`.toLowerCase().includes(normalizedQuery))
    return stories.length > 0 ? [{ ...agent, stories }] : []
  })

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const selectStory = (storyId: string) => {
    const agent = agentList.find((candidate) => candidate.stories.some((item) => item.id === storyId))
    if (!agent) return
    setSelectedAgent(agent.id)
    setSelectedStory(storyId)
  }

  return <aside className="ab-sidebar">
    <div className="ab-sidebar-top"><span className="ab-logo-mark" aria-hidden="true" /><span>Ethogram</span><span className="ab-alpha">alpha</span></div>
    <label className="ab-mobile-story-select"><span>Active story</span><select value={selectedStory} onChange={(event) => selectStory(event.target.value)}>{agentList.flatMap((agent) => agent.stories.map((story) => <option key={story.id} value={story.id}>{agent.name} · {story.name}</option>))}</select></label>
    <div className="ab-project"><span className="ab-dot" /> <strong>{projectName}</strong><span className="ab-local">local</span></div>
    <label className="ab-search" htmlFor="story-filter"><Search size={14} /><input ref={searchRef} id="story-filter" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter stories" /><kbd>⌘ K</kbd></label>
    <div className="ab-nav-label">AGENTS</div>
    <div className="ab-agents">{visibleAgents.length === 0 ? <p className="ab-sidebar-empty">No matching Stories</p> : visibleAgents.map((agent) => { const Icon = iconMap[agent.icon]; const open = normalizedQuery ? true : expanded[agent.id]; return <div key={agent.id}><button className={`ab-agent ${selectedAgent === agent.id ? 'selected' : ''}`} onClick={() => { setSelectedAgent(agent.id); setSelectedStory(agent.stories[0].id); setExpanded((current) => ({ ...current, [agent.id]: !open })) }}><span className="ab-chevron">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span><Icon size={15} /><span>{agent.name}</span><span className="ab-count">{agent.stories.length}</span></button>{open ? <div className="ab-story-list">{agent.stories.map((story) => <button key={story.id} className={`ab-story-link ${selectedStory === story.id ? 'selected' : ''}`} onClick={() => { setSelectedAgent(agent.id); setSelectedStory(story.id) }}><span className={`ab-status-dot ${story.status}`} /><span>{story.name}</span><em>{story.kind}</em></button>)}</div> : null}</div> })}</div>
    <div className="ab-sidebar-bottom"><Link className="ab-bottom-link" href="/lab/interface"><FlaskConical size={15} /> Interface Lab <Badge>04</Badge></Link><div className="ab-scope-note"><strong>Internal laboratory</strong><span>Code-first · local execution</span></div></div>
  </aside>
}

type StoryHeaderProps = { story: DisplayStory; tab: Tab; setTab: (tab: Tab) => void; onRun: () => void; running: boolean; theme: string; setTheme: (theme: string) => void }

function StoryHeader({ story, tab, setTab, onRun, running, theme, setTheme }: StoryHeaderProps) {
  return <><header className="ab-header"><div className="ab-breadcrumb"><span>{story.agent.name}</span><ChevronRight size={14} /><strong>{story.name}</strong></div><div className="ab-header-actions"><button className="ab-icon-button" aria-label="Toggle color theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button><button className="ab-run-button" onClick={onRun} disabled={running}>{running ? <Activity className="ab-spin" size={15} /> : <Play size={14} fill="currentColor" />} {running ? 'Running…' : 'Run Story'}</button></div></header><div className="ab-story-meta"><div className={`ab-story-symbol ${story.status}`}><Code2 size={19} /></div><div><h1>{story.name}</h1><p>{story.description}</p><small className="ab-source">{story.source.file}{story.source.exportName ? ` › ${story.source.exportName}` : ''}</small></div><div className="ab-meta-spacer" /><Badge>{isServerExecutable(story) ? 'controlled run' : 'local mock'}</Badge></div><nav className="ab-tabs" aria-label="Story views">{(['Canvas', 'Story', 'Runs', 'Compare'] as Tab[]).map((item) => <button key={item} aria-current={tab === item ? 'page' : undefined} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}{item === 'Runs' ? <span className="ab-tab-count">{story.runs.length}</span> : null}</button>)}</nav></>
}

function GivenPanel({ story, values, setValue, executable }: { story: DisplayStory; values: GivenState; setValue: (key: string, value: string) => void; executable: boolean }) {
  return <Panel title="Given" icon={FlaskConical} right={<span className="ab-muted-small">{executable ? 'Controlled execution' : 'Local mock'}</span>}><div className="ab-given-grid">{givenEntries(story).map(({ key, value }) => <label className="ab-given-row" key={key}><span className="ab-key">{key}</span><input aria-label={key} value={values[key] ?? value} readOnly={executable} onChange={(event) => setValue(key, event.target.value)} /></label>)}</div></Panel>
}

function ResultPanel({ state }: { state: UiRunState }) {
  const record = state.kind === 'completed' ? state.execution : undefined
  const verdict = record?.evaluationResult.verdict
  const badge = state.kind === 'running' ? 'RUNNING' : state.kind === 'execution-error' ? 'ERROR' : verdict ?? 'READY'
  const tone = state.kind === 'execution-error' || verdict === 'FAIL' ? 'red' : verdict === 'PASS' ? 'green' : 'muted'
  const expectations = record ? Object.values(record.evaluationResult.expectations) : []
  const passed = expectations.filter((result) => result === 'PASS').length

  if (state.kind === 'execution-error') {
    return <Panel title="Decision" icon={X} right={<Badge tone="red">ERROR</Badge>}><div className="ab-result ab-result-error" data-testid="execution-error"><div className="ab-result-status"><small>EXECUTION FAILED</small><strong className="ab-result-verdict">Error</strong></div><div className="ab-result-explanation"><small>{state.error.code}</small><p>{state.error.message}</p></div><div><small>STORY EVALUATION</small><strong>NOT EVALUATED</strong></div></div></Panel>
  }

  const explanation = record?.observedRun.finalResponse ?? record?.observedRun.reason ?? (state.kind === 'running' ? 'Collecting observable execution evidence…' : 'Run this Story to evaluate its expectations against observable evidence.')
  return <Panel title="Decision" icon={verdict === 'FAIL' ? X : verdict === 'PASS' ? Check : Activity} right={<Badge tone={tone}>{badge}</Badge>}><div className={`ab-result ${verdict ? `is-${verdict.toLowerCase()}` : ''}`}><div className="ab-result-status"><small>VERDICT</small><strong className="ab-result-verdict" data-testid="story-result">{verdict ?? (state.kind === 'running' ? 'Running' : 'Ready')}</strong></div><div className="ab-result-explanation"><small>{record ? 'WHY' : 'NEXT STEP'}</small><p data-testid="final-model-response">{explanation}</p></div><div><small>EXPECTATIONS</small><strong>{record ? `${passed} of ${expectations.length} passed` : 'Awaiting evidence'}</strong></div></div></Panel>
}

function ExecutionTimeline({ state }: { state: UiRunState }) {
  const run = state.kind === 'completed' ? state.execution.observedRun : undefined
  const steps = run ? observableTimeline(run) : []
  const callCount = run?.toolCalls.length ?? 0
  const status = state.kind === 'running' ? 'Running…' : state.kind === 'execution-error' ? 'Execution failed' : run ? `${callCount} ${callCount === 1 ? 'tool call' : 'tool calls'}` : 'Not run yet'
  return <Panel title="Execution timeline" icon={Activity} right={<span className="ab-muted-small" data-testid="timeline-tool-count">{status}</span>}><div className="ab-timeline">{steps.length === 0 ? <p className="ab-empty">{state.kind === 'running' ? 'Waiting for observable execution events…' : 'No execution events recorded.'}</p> : steps.map((step, index) => <div className="ab-timeline-row" data-kind={step.kind} data-tool-name={step.toolCall?.name} key={`${step.kind}-${step.toolCall?.callId ?? index}`}><div className="ab-timeline-icon done"><Check size={12} /></div><div><strong>{step.label}</strong><small>{step.detail}</small></div><span className="ab-time">{step.duration === 'Unavailable' ? '—' : step.duration}</span></div>)}</div></Panel>
}

function ToolInspector({ state }: { state: UiRunState }) {
  const [open, setOpen] = useState<string | null>(null)
  const calls = state.kind === 'completed' ? state.execution.observedRun.toolCalls : []
  const countLabel = `${calls.length} ${calls.length === 1 ? 'call' : 'calls'}`
  return <Panel title="Tool calls" icon={Wrench} right={<span className="ab-muted-small" data-testid="tool-call-count">{countLabel}</span>}><div className="ab-tools">{calls.length === 0 ? <p className="ab-empty">No tool calls recorded.</p> : calls.map((tool, index) => { const key = tool.callId ?? `${tool.name}-${index}`; const json = JSON.stringify({ input: tool.input, output: tool.output }, null, 2); return <div key={key} className="ab-tool" data-testid="tool-call" data-tool-name={tool.name}><button className="ab-tool-row" aria-expanded={open === key} onClick={() => setOpen(open === key ? null : key)}><ChevronRight className={open === key ? 'rotate-90' : ''} size={14} /><strong>{tool.name}</strong><Badge tone={tool.status === 'success' ? 'green' : 'red'}>{tool.status}</Badge><span>{tool.duration || '—'}</span></button>{open === key ? <div className="ab-json"><div><small>INPUT</small><code>{tool.input}</code></div><div><small>OUTPUT</small><code>{tool.output}</code></div><CopyButton text={json} label="Copy JSON" /></div> : null}</div> })}</div></Panel>
}

function AssertionsPanel({ story, state }: { story: DisplayStory; state: UiRunState }) {
  const evaluation = state.kind === 'completed' ? state.execution.evaluationResult : undefined
  const passedCount = evaluation ? Object.values(evaluation.expectations).filter((verdict) => verdict === 'PASS').length : 0
  return <Panel title="Expectations" icon={ListChecks} right={<span className="ab-muted-small">{evaluation ? `${passedCount} / ${story.expectations.length} passed` : 'Not evaluated'}</span>}><div className="ab-assertions">{story.expectations.map((expectation) => { const verdict = evaluation?.expectations[expectation.id]; const passed = verdict === 'PASS'; return <div className="ab-assertion" key={expectation.id} data-testid="assertion" data-expectation-id={expectation.id} data-verdict={verdict ?? 'NOT EVALUATED'}><span className={verdict === undefined ? 'ab-assert-pending' : passed ? '' : 'ab-assert-fail'}>{verdict === undefined ? <Clock3 size={14} /> : passed ? <Check size={14} /> : <X size={14} />}</span><div><strong>{expectation.description}</strong><small>{verdict === undefined ? 'Not evaluated' : passed ? `${expectation.matcher.kind}: ${expectation.matcher.tool}` : expectation.failureDescription ?? 'The observed Run did not satisfy this Story expectation.'}</small></div></div> })}</div></Panel>
}

function MetricsPanel({ state }: { state: UiRunState }) {
  const run = state.kind === 'completed' ? state.execution.observedRun : undefined
  const metrics = executionMetrics(run)
  const entries = [
    ['LATENCY', metrics.latency, 'latency'], ['PROVIDER', metrics.provider, 'provider'], ['MODEL', metrics.model, 'model'],
    ['INPUT TOKENS', metrics.inputTokens, 'input-tokens'], ['OUTPUT TOKENS', metrics.outputTokens, 'output-tokens'], ['TOTAL TOKENS', metrics.totalTokens, 'total-tokens'],
    ['TOOLS CALLED', metrics.toolCallCount, 'metrics-tool-count'],
  ]
  return <Panel title="Metrics" icon={Activity}><div className="ab-metrics">{entries.map(([label, value, testId]) => <div key={label}><small>{label}</small><strong data-testid={testId}>{value}</strong></div>)}</div></Panel>
}

function Canvas({ story, values, setValue, state }: { story: DisplayStory; values: GivenState; setValue: (key: string, value: string) => void; state: UiRunState }) {
  const executable = isServerExecutable(story)
  const real = story.execution?.kind === 'real-agent'
  const external = story.execution?.kind === 'external-profile'
  const run = state.kind === 'completed' ? state.execution.observedRun : undefined
  return <div className="ab-canvas">
    <div className="ab-canvas-result"><ResultPanel state={state} /></div>
    <div className="ab-canvas-main"><GivenPanel story={story} values={values} setValue={setValue} executable={executable} /><Panel title="Configuration" icon={Settings2}><div className="ab-config-grid"><div><small>MODEL</small><strong>{run?.evidence?.model ?? (real ? 'After execution' : external ? 'Deterministic profile' : 'Prototype mock')}</strong></div><div><small>RANDOMNESS</small><strong>{run?.evidence ? `${run.evidence.randomness.temperature} · lowest practical` : real ? 'After execution' : 'N/A'}</strong></div><div><small>MAX STEPS</small><strong>{executable ? 'Server controlled' : 'N/A'}</strong></div><div><small>ENVIRONMENT</small><strong><span className="ab-dot" /> {real ? 'Development server' : external ? 'External project' : 'Local mock'}</strong></div></div></Panel><Panel title="Input"><div className="ab-input-box">{story.prompt}</div></Panel></div>
    <div className="ab-canvas-side">{state.kind === 'idle' ? <section className="ab-observation-empty"><Activity size={18} /><div><small>OBSERVATION</small><strong>No evidence yet</strong><p>Run this Story to collect its timeline, tool calls, expectation results, and execution metrics.</p></div></section> : <><AssertionsPanel story={story} state={state} /><ExecutionTimeline state={state} /><ToolInspector state={state} />{run?.evidence ? <MetricsPanel state={state} /> : null}</>}</div>
  </div>
}

function fallbackStoryCode(story: DisplayStory): string {
  return `export default defineStory({\n  id: "${story.id}",\n  name: "${story.name}",\n  agent: ${story.agent.id}Agent,\n  description: "${story.description}",\n  when: "${story.prompt}",\n  expectations: [\n${story.expectations.map((item) => `    { id: "${item.id}", description: "${item.description}", matcher: ${JSON.stringify(item.matcher)} },`).join('\n')}\n  ],\n})`
}

function StoryView({ story }: { story: DisplayStory }) {
  const code = story.source.code ?? fallbackStoryCode(story)
  const [wrap, setWrap] = useState(false)
  return <div className="ab-code-wrap"><div className="ab-code-toolbar"><span><Code2 size={14} /> {story.source.file}</span><div className="ab-code-actions"><button className={`ab-text-button ${wrap ? 'active' : ''}`} aria-pressed={wrap} onClick={() => setWrap((current) => !current)}><WrapText size={13} /> Wrap</button><CopyButton text={code} /></div></div><pre className={wrap ? 'is-wrapped' : ''}>{code.split('\n').map((line, index) => <span key={index}><i>{String(index + 1).padStart(2, ' ')}</i>{line}{'\n'}</span>)}</pre></div>
}

function RunsView({ story, selectedRun, setSelectedRun }: { story: DisplayStory; selectedRun: string; setSelectedRun: (id: string) => void }) {
  const displayDate = (date: string) => date.replace(/^Hoje\b/, 'Today')
  const exportRuns = () => {
    const quote = (value: string) => `"${value.replaceAll('"', '""')}"`
    const rows = story.runs.map((run) => [run.evaluation.verdict, run.version, displayDate(run.date), run.duration, run.score, run.note].map(quote).join(','))
    const csv = ['status,version,run_at,duration,score,note', ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${story.id}-runs.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <div className="ab-runs-view"><div className="ab-view-intro"><div><h2>Run history</h2><p>Persisted executions for this Story.</p></div><button className="ab-secondary-button" disabled={story.runs.length === 0} onClick={exportRuns}><ArrowDown size={14} /> Export CSV</button></div>{story.runs.length === 0 ? <div className="ab-empty-state"><strong>No persisted runs</strong><span>Execute the Story with persistence enabled before comparing or exporting results.</span></div> : <div className="ab-table"><div className="ab-table-row ab-table-head"><span>STATUS</span><span>VERSION</span><span>RUN AT</span><span>DURATION</span><span>SCORE</span><span>NOTE</span></div>{story.runs.map((run) => { const verdict = run.evaluation.verdict; const passedCount = Object.values(run.evaluation.expectations).filter((result) => result === 'PASS').length; return <button className={`ab-table-row ${selectedRun === run.id ? 'selected' : ''}`} key={run.id} onClick={() => setSelectedRun(run.id)}><span><Badge tone={verdict === 'PASS' ? 'green' : 'red'}>{verdict}</Badge></span><span className="ab-mono">{run.version}</span><span>{displayDate(run.date)}</span><span>{run.duration}</span><span className="ab-score">{passedCount} / {story.expectations.length} passed</span><span>{run.note}</span></button> })}</div>}</div>
}

function comparisonRuns(story: DisplayStory): [RecordedEvaluation, RecordedEvaluation] | undefined {
  const [first, ...remaining] = story.runs
  if (!first) return undefined
  const second = remaining.find((run) => run.id !== first.id)
  if (!second) return undefined
  return [first, second]
}

function CompareView({ story }: { story: DisplayStory }) {
  const runs = comparisonRuns(story)
  if (!runs) return <div className="ab-compare"><div className="ab-view-intro"><div><h2>Compare runs</h2><p>See exactly which expectations changed between two persisted executions.</p></div></div><div className="ab-empty-state"><GitCompare size={18} /><strong>Two distinct runs required</strong><span>This Story does not have enough persisted evidence for an honest comparison yet.</span></div></div>
  const hasChanges = story.expectations.some((expectation) => runs[0].evaluation.expectations[expectation.id] !== runs[1].evaluation.expectations[expectation.id])
  return <div className="ab-compare"><div className="ab-view-intro"><div><h2>Compare runs</h2><p>Expectation-level differences between two persisted executions.</p></div><Badge tone={hasChanges ? 'yellow' : 'green'}>{hasChanges ? 'CHANGES FOUND' : 'NO CHANGES'}</Badge></div><div className="ab-compare-grid">{runs.map((run, index) => { const verdict = run.evaluation.verdict; const passedCount = Object.values(run.evaluation.expectations).filter((result) => result === 'PASS').length; return <div className="ab-compare-col" key={run.id}><div className="ab-compare-label">RUN {index === 0 ? 'A' : 'B'} <Badge tone={verdict === 'PASS' ? 'green' : 'red'}>{verdict}</Badge></div><div className="ab-compare-card"><small>VERSION</small><strong>{run.version}</strong><div className="ab-compare-score"><span>{passedCount} / {story.expectations.length}</span><small>expectations passed</small></div><div className="ab-compare-note">{run.date} · {run.duration}<br />{run.note}</div></div></div> })}</div><section className="ab-expectation-diff"><div className="ab-diff-head"><span>EXPECTATION</span><span>RUN A</span><span>RUN B</span></div>{story.expectations.map((expectation) => { const firstVerdict = runs[0].evaluation.expectations[expectation.id]; const secondVerdict = runs[1].evaluation.expectations[expectation.id]; const changed = firstVerdict !== secondVerdict; return <div className={`ab-diff-row ${changed ? 'changed' : ''}`} key={expectation.id}><strong>{expectation.description}</strong><Badge tone={firstVerdict === 'PASS' ? 'green' : 'red'}>{firstVerdict}</Badge><Badge tone={secondVerdict === 'PASS' ? 'green' : 'red'}>{secondVerdict}</Badge></div> })}</section></div>
}

function createSessionVariant(story: DisplayStory, values: GivenState, execution: CompletedExecutionRecord): DisplayStory {
  const variant = story.simulation.kind === 'numeric-threshold' ? story.simulation.savedVariant : undefined
  const given = givenEntries(story).map(({ key }) => `${key}: ${values[key] ?? ''}`)
  return { ...story, id: `${story.id}-local-variant`, name: variant?.name ?? `${story.name} Variant`, description: variant?.description ?? story.description, status: execution.evaluationResult.verdict === 'PASS' ? 'pass' : 'fail', given, result: { decision: execution.observedRun.decision, reason: execution.observedRun.reason }, tools: execution.observedRun.toolCalls, expectations: variant?.expectations ?? story.expectations, runs: [], source: { file: 'Unsaved local variant' }, simulation: { kind: 'static' }, execution: { kind: 'prototype-mock' } }
}

export default function Page() {
  if (discoveredAgents.length === 0) throw new Error('No Ethogram Stories were discovered.')
  const firstAgent = discoveredAgents[0]
  const firstStory = firstAgent.stories[0]
  const [sessionStories, setSessionStories] = useState<DisplayStory[]>([])
  const [projectStories, setProjectStories] = useState<DisplayStory[]>(discoveredStories)
  const [projectName, setProjectName] = useState('acme-agents')
  const [projectSource, setProjectSource] = useState<'internal' | 'external'>('internal')
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null)
  const agentList = useMemo(() => groupStoriesByAgent([...projectStories, ...sessionStories]), [projectStories, sessionStories])
  const [selectedAgent, setSelectedAgent] = useState(firstAgent.id)
  const [selectedStory, setSelectedStory] = useState(firstStory.id)
  const [expanded, setExpanded] = useState<ExpandedState>(() => Object.fromEntries(discoveredAgents.map((agent, index) => [agent.id, index === 0])))
  const [tab, setTab] = useState<Tab>('Canvas')
  const [theme, setTheme] = useState('dark')
  const [query, setQuery] = useState('')
  const [selectedRun, setSelectedRun] = useState(firstStory.runs[0]?.id ?? '')
  const story = useMemo(() => agentList.find((agent) => agent.id === selectedAgent)?.stories.find((candidate) => candidate.id === selectedStory) ?? firstStory, [agentList, firstStory, selectedAgent, selectedStory])
  const initial = useMemo(() => parseGiven(story), [story])
  const [values, setValues] = useState<GivenState>(() => parseGiven(firstStory))
  const [runState, setRunState] = useState<UiRunState>(() => initialRunState(firstStory, parseGiven(firstStory)))
  const executingRef = useRef(false)

  useEffect(() => {
    let active = true
    void loadConfiguredAgentbookProject().then((result) => {
      if (!active || result.status === 'not-configured') return
      if (result.status === 'project-error') {
        setProjectLoadError(`${result.code}: ${result.message}`)
        return
      }
      if (result.stories.length === 0) {
        setProjectLoadError('EXTERNAL_PROJECT_EMPTY: No external Stories were discovered.')
        return
      }
      const loadedAgents = groupStoriesByAgent(result.stories)
      setProjectStories(result.stories)
      setProjectName(result.packageName)
      setProjectSource('external')
      setSelectedAgent(loadedAgents[0].id)
      setSelectedStory(loadedAgents[0].stories[0].id)
      setExpanded(Object.fromEntries(loadedAgents.map((agent, index) => [agent.id, index === 0])))
      setProjectLoadError(null)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('ethogram-theme')
    const preferredTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    setTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : preferredTheme)
  }, [])

  useEffect(() => {
    setValues(initial)
    setRunState(initialRunState(story, initial))
    executingRef.current = false
  }, [initial, story])

  const setValue = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }))
  const changeTheme = (nextTheme: string) => {
    setTheme(nextTheme)
    window.localStorage.setItem('ethogram-theme', nextTheme)
  }
  const modified = !isServerExecutable(story) && JSON.stringify(values) !== JSON.stringify(initial)
  const running = runState.kind === 'running'

  const runStory = async () => {
    if (executingRef.current) return
    executingRef.current = true
    setRunState({ kind: 'running' })
    try {
      if (story.execution?.kind === 'real-agent') {
        const result = await runRealStory({ agentId: story.agent.id, storyId: story.id })
        if (result.status === 'completed') {
          setRunState({ kind: 'completed', execution: result.execution, boundaryEvidence: result.boundaryEvidence, source: 'real' })
        } else {
          setRunState({ kind: 'execution-error', error: result.error })
        }
      } else if (story.execution?.kind === 'external-profile') {
        const result = await runExternalStory({ agentId: story.agent.id, storyId: story.id })
        if (result.status === 'completed') {
          setRunState({ kind: 'completed', execution: result.execution, boundaryEvidence: result.boundaryEvidence, source: 'external' })
        } else {
          setRunState({ kind: 'execution-error', error: result.error })
        }
      } else {
        setRunState({ kind: 'completed', execution: executePrototypeStory(story, values), source: 'prototype-mock' })
      }
    } catch {
      setRunState({
        kind: 'execution-error',
        error: {
          code: 'REAL_AGENT_EXECUTION_FAILED',
          message: 'The real-agent execution could not be completed.',
        },
      })
    } finally {
      executingRef.current = false
    }
  }

  const saveVariant = () => {
    if (runState.kind !== 'completed' || runState.source !== 'prototype-mock') return
    const newStory = createSessionVariant(story, values, runState.execution)
    setSessionStories((current) => [...current.filter((item) => item.id !== newStory.id), newStory])
    setSelectedStory(newStory.id)
    setTab('Canvas')
  }

  const completedEvidence = runState.kind === 'completed' && runState.source !== 'prototype-mock'
    ? { execution: runState.execution, boundaryEvidence: runState.boundaryEvidence }
    : undefined

  return <div className={`agentbook ${theme}`}><Sidebar {...{ selectedAgent, selectedStory, setSelectedAgent, setSelectedStory, expanded, setExpanded, agentList, projectName, query, setQuery }} /><main className="ab-main" data-execution-kind={story.execution?.kind ?? 'prototype-mock'} data-project-source={projectSource}><StoryHeader story={story} tab={tab} setTab={setTab} onRun={runStory} running={running} theme={theme} setTheme={changeTheme} />{projectLoadError ? <div className="ab-variant-banner" data-testid="project-load-error"><span><Badge tone="red">PROJECT ERROR</Badge> {projectLoadError}</span></div> : null}{completedEvidence ? <output hidden className="ab-sr-only" data-testid="execution-evidence">{JSON.stringify(completedEvidence)}</output> : null}{tab === 'Canvas' ? <>{modified ? <div className="ab-variant-banner"><span><Badge tone="yellow">MODIFIED</Badge> Running a modified variant of this Story</span><button className="ab-secondary-button" onClick={saveVariant}>Save as new Story</button></div> : null}<Canvas story={story} values={values} setValue={setValue} state={runState} /></> : null}{tab === 'Story' ? <StoryView story={story} /> : null}{tab === 'Runs' ? <RunsView story={story} selectedRun={selectedRun} setSelectedRun={setSelectedRun} /> : null}{tab === 'Compare' ? <CompareView story={story} /> : null}</main></div>
}
