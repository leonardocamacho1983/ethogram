'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
import type { DisplayStory, RecordedEvaluation } from '@/lib/agentbook/domain'
import { Activity, ArrowDown, Check, ChevronDown, ChevronRight, Clock3, Code2, Copy, Ellipsis, FlaskConical, GitCompare, Headphones, History, ListChecks, Moon, Play, Plus, Search, Settings2, Sun, Wrench, X } from 'lucide-react'

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

function parseGiven(story: DisplayStory): GivenState {
  return Object.fromEntries(story.given.map((line) => {
    const [key, ...value] = line.split(':')
    return [key.trim(), value.join(':').trim()]
  }))
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

type SidebarProps = {
  selectedAgent: string
  selectedStory: string
  setSelectedAgent: (id: string) => void
  setSelectedStory: (id: string) => void
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
  agentList: AgentWithStories[]
  projectName: string
}

function Sidebar({ selectedAgent, selectedStory, setSelectedAgent, setSelectedStory, expanded, setExpanded, agentList, projectName }: SidebarProps) {
  return <aside className="ab-sidebar"><div className="ab-sidebar-top"><div className="ab-logo-mark">A</div><span>Agentbook</span><button className="ab-icon-button" aria-label="Configurações"><Settings2 size={15} /></button></div><div className="ab-project"><span className="ab-dot" /> {projectName} <ChevronDown size={14} /></div><div className="ab-search"><Search size={14} /><span>Filter stories</span><kbd>⌘ K</kbd></div><div className="ab-nav-label">AGENTS <button className="ab-plus" aria-label="Adicionar agente"><Plus size={13} /></button></div><div className="ab-agents">{agentList.map((agent) => { const Icon = iconMap[agent.icon]; const open = expanded[agent.id]; return <div key={agent.id}><button className={`ab-agent ${selectedAgent === agent.id ? 'selected' : ''}`} onClick={() => { setSelectedAgent(agent.id); setSelectedStory(agent.stories[0].id); setExpanded((current) => ({ ...current, [agent.id]: !open })) }}><span className="ab-chevron">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span><Icon size={15} /><span>{agent.name}</span><span className="ab-count">{agent.stories.length}</span></button>{open ? <div className="ab-story-list">{agent.stories.map((story) => <button key={story.id} className={`ab-story-link ${selectedStory === story.id ? 'selected' : ''}`} onClick={() => { setSelectedAgent(agent.id); setSelectedStory(story.id) }}><span className={`ab-status-dot ${story.status}`} /><span>{story.name}</span><em>{story.kind}</em></button>)}</div> : null}</div> })}</div><div className="ab-sidebar-bottom"><button className="ab-bottom-link"><FlaskConical size={15} /> Environments <Badge>3</Badge></button><button className="ab-bottom-link"><ListChecks size={15} /> All assertions <Badge>24</Badge></button><button className="ab-bottom-link"><History size={15} /> Activity</button><div className="ab-user"><div className="ab-avatar">SC</div><div><strong>Sarah Chen</strong><small>Admin</small></div><Ellipsis size={16} /></div></div></aside>
}

type StoryHeaderProps = { story: DisplayStory; tab: Tab; setTab: (tab: Tab) => void; onRun: () => void; running: boolean; theme: string; setTheme: (theme: string) => void }

function StoryHeader({ story, tab, setTab, onRun, running, theme, setTheme }: StoryHeaderProps) {
  return <><header className="ab-header"><div className="ab-breadcrumb"><span>{story.agent.name}</span><ChevronRight size={14} /><strong>{story.name}</strong></div><div className="ab-header-actions"><button className="ab-icon-button" aria-label="Alternar tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button><button className="ab-icon-button" aria-label="Mais opções"><Ellipsis size={16} /></button><button className="ab-run-button" onClick={onRun} disabled={running}>{running ? <Activity className="ab-spin" size={14} /> : <Play size={13} fill="currentColor" />} {running ? 'Running...' : 'Run Story'}</button></div></header><div className="ab-story-meta"><div className={`ab-story-symbol ${story.status}`}><Code2 size={18} /></div><div><h1>{story.name}</h1><p>{story.description}</p><small className="ab-source">{story.source.file}{story.source.exportName ? ` › ${story.source.exportName}` : ''}</small></div><div className="ab-meta-spacer" /><Badge tone={story.status === 'policy' ? 'yellow' : story.status === 'fail' ? 'red' : 'green'}>{story.status === 'policy' ? 'POLICY' : story.status === 'fail' ? 'FAILING' : 'PASSING'}</Badge><span className="ab-updated"><Clock3 size={13} /> Updated 2h ago</span></div><nav className="ab-tabs" aria-label="Story views">{(['Canvas', 'Story', 'Runs', 'Compare'] as Tab[]).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}{item === 'Runs' ? <span className="ab-tab-count">{story.runs.length}</span> : null}</button>)}</nav></>
}

function GivenPanel({ story, values, setValue, executable }: { story: DisplayStory; values: GivenState; setValue: (key: string, value: string) => void; executable: boolean }) {
  return <Panel title="Given" icon={FlaskConical} right={<span className="ab-muted-small">{executable ? 'Controlled execution' : 'Local mock'}</span>}><div className="ab-given-grid">{story.given.map((line) => { const [rawKey, ...rest] = line.split(':'); const key = rawKey.trim(); return <label className="ab-given-row" key={line}><span className="ab-key">{key}</span><input aria-label={key} value={values[key] ?? rest.join(':').trim()} readOnly={executable} onChange={(event) => setValue(key, event.target.value)} /></label> })}</div></Panel>
}

function ResultPanel({ state }: { state: UiRunState }) {
  const record = state.kind === 'completed' ? state.execution : undefined
  const verdict = record?.evaluationResult.verdict
  const badge = state.kind === 'running' ? 'RUNNING' : state.kind === 'execution-error' ? 'ERROR' : verdict ?? 'READY'
  const tone = state.kind === 'execution-error' || verdict === 'FAIL' ? 'red' : verdict === 'PASS' ? 'green' : 'muted'

  if (state.kind === 'execution-error') {
    return <Panel title="Result" icon={X} right={<Badge tone="red">ERROR</Badge>}><div className="ab-result ab-result-error" data-testid="execution-error"><div><small>EXECUTION FAILED</small><strong>{state.error.code}</strong></div><div><small>DETAIL</small><p>{state.error.message}</p></div><div><small>STORY EVALUATION</small><strong>NOT EVALUATED</strong></div></div></Panel>
  }

  return <Panel title="Result" icon={Check} right={<Badge tone={tone}>{badge}</Badge>}><div className="ab-result"><div><small>STORY RESULT</small><strong data-testid="story-result">{verdict ?? 'Not evaluated'}</strong></div><div><small>FINAL MODEL RESPONSE</small><p data-testid="final-model-response">{record?.observedRun.finalResponse ?? (state.kind === 'running' ? 'Execution in progress…' : record?.observedRun.reason ?? 'Run this Story to produce real evidence.')}</p></div><div><small>EXECUTION</small><strong>{state.kind === 'running' ? 'Running' : record ? 'Completed' : 'Not run'}</strong></div></div></Panel>
}

function ExecutionTimeline({ state }: { state: UiRunState }) {
  const run = state.kind === 'completed' ? state.execution.observedRun : undefined
  const steps = run ? observableTimeline(run) : []
  const status = state.kind === 'running' ? 'Running…' : state.kind === 'execution-error' ? 'Execution failed' : run ? `${run.toolCalls.length} tool calls` : 'Not run yet'
  return <Panel title="Execution timeline" icon={Activity} right={<span className="ab-muted-small" data-testid="timeline-tool-count">{status}</span>}><div className="ab-timeline">{steps.length === 0 ? <p className="ab-empty">{state.kind === 'running' ? 'Waiting for observable execution events…' : 'No execution events recorded.'}</p> : steps.map((step, index) => <div className="ab-timeline-row" data-kind={step.kind} data-tool-name={step.toolCall?.name} key={`${step.kind}-${step.toolCall?.callId ?? index}`}><div className="ab-timeline-icon done"><Check size={12} /></div><div><strong>{step.label}</strong><small>{step.detail}</small></div><span className="ab-time">{step.duration}</span></div>)}</div></Panel>
}

function ToolInspector({ state }: { state: UiRunState }) {
  const [open, setOpen] = useState<string | null>(null)
  const calls = state.kind === 'completed' ? state.execution.observedRun.toolCalls : []
  return <Panel title="Tool calls" icon={Wrench} right={<span className="ab-muted-small" data-testid="tool-call-count">{calls.length} calls</span>}><div className="ab-tools">{calls.length === 0 ? <p className="ab-empty">No tool calls recorded.</p> : calls.map((tool, index) => { const key = tool.callId ?? `${tool.name}-${index}`; return <div key={key} className="ab-tool" data-testid="tool-call" data-tool-name={tool.name}><button className="ab-tool-row" onClick={() => setOpen(open === key ? null : key)}><ChevronRight className={open === key ? 'rotate-90' : ''} size={14} /><strong>{tool.name}</strong><Badge tone={tool.status === 'success' ? 'green' : 'red'}>{tool.status}</Badge><span>{tool.duration || 'Unavailable'}</span></button>{open === key ? <div className="ab-json"><div><small>INPUT</small><code>{tool.input}</code></div><div><small>OUTPUT</small><code>{tool.output}</code></div><button className="ab-copy"><Copy size={12} /> Copy JSON</button></div> : null}</div> })}</div></Panel>
}

function AssertionsPanel({ story, state }: { story: DisplayStory; state: UiRunState }) {
  const evaluation = state.kind === 'completed' ? state.execution.evaluationResult : undefined
  const passedCount = evaluation ? Object.values(evaluation.expectations).filter((verdict) => verdict === 'PASS').length : 0
  return <Panel title="Assertions" icon={ListChecks} right={<span className="ab-muted-small">{evaluation ? `${passedCount} / ${story.expectations.length} passed` : 'Not evaluated'}</span>}><div className="ab-assertions">{story.expectations.map((expectation) => { const verdict = evaluation?.expectations[expectation.id]; const passed = verdict === 'PASS'; return <div className="ab-assertion" key={expectation.id} data-testid="assertion" data-expectation-id={expectation.id} data-verdict={verdict ?? 'NOT EVALUATED'}><span className={verdict === undefined ? 'ab-assert-pending' : passed ? '' : 'ab-assert-fail'}>{verdict === undefined ? <Clock3 size={14} /> : passed ? <Check size={14} /> : <X size={14} />}</span><div><strong>{expectation.description}</strong><small>{verdict === undefined ? 'Not evaluated' : passed ? `${expectation.matcher.kind}: ${expectation.matcher.tool}` : expectation.failureDescription ?? 'The observed Run did not satisfy this Story expectation.'}</small></div></div> })}</div></Panel>
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
  return <div className="ab-canvas"><div className="ab-canvas-main"><GivenPanel story={story} values={values} setValue={setValue} executable={executable} /><Panel title="Configuration" icon={Settings2}><div className="ab-config-grid"><div><small>MODEL</small><strong>{run?.evidence?.model ?? (real ? 'Available after Run' : external ? 'External deterministic profile' : 'Prototype mock')}</strong></div><div><small>RANDOMNESS</small><strong>{run?.evidence ? `${run.evidence.randomness.temperature} · lowest practical` : real ? 'Available after Run' : 'N/A'}</strong></div><div><small>MAX STEPS</small><strong>{executable ? 'Server controlled' : 'N/A'}</strong></div><div><small>ENVIRONMENT</small><strong><span className="ab-dot" /> {real ? 'Development · server' : external ? 'External project · server' : 'local mock'}</strong></div></div></Panel><Panel title="Input"><div className="ab-input-box">{story.prompt}</div></Panel><ResultPanel state={state} /></div><div className="ab-canvas-side"><ExecutionTimeline state={state} /><ToolInspector state={state} /><AssertionsPanel story={story} state={state} /><MetricsPanel state={state} /></div></div>
}

function fallbackStoryCode(story: DisplayStory): string {
  return `export default defineStory({\n  id: "${story.id}",\n  name: "${story.name}",\n  agent: ${story.agent.id}Agent,\n  description: "${story.description}",\n  when: "${story.prompt}",\n  then: [\n${story.expectations.map((item) => `    { id: "${item.id}", description: "${item.description}", matcher: ${JSON.stringify(item.matcher)} },`).join('\n')}\n  ],\n})`
}

function StoryView({ story }: { story: DisplayStory }) {
  const code = story.source.code ?? fallbackStoryCode(story)
  return <div className="ab-code-wrap"><div className="ab-code-toolbar"><span><Code2 size={14} /> {story.source.file}</span><button className="ab-text-button"><Copy size={13} /> Copy</button></div><pre>{code.split('\n').map((line, index) => <span key={index}><i>{String(index + 1).padStart(2, ' ')}</i>{line}{'\n'}</span>)}</pre></div>
}

function RunsView({ story, selectedRun, setSelectedRun }: { story: DisplayStory; selectedRun: string; setSelectedRun: (id: string) => void }) {
  return <div className="ab-runs-view"><div className="ab-view-intro"><div><h2>Run history</h2><p>Every execution of this story, across all versions and environments.</p></div><button className="ab-secondary-button"><ArrowDown size={14} /> Export CSV</button></div>{story.runs.length === 0 ? <div className="ab-empty-state">No persisted run history is available.</div> : <div className="ab-table"><div className="ab-table-row ab-table-head"><span>STATUS</span><span>VERSION</span><span>RUN AT</span><span>DURATION</span><span>SCORE</span><span>NOTE</span></div>{story.runs.concat(story.runs, story.runs).map((run, index) => { const verdict = run.evaluation.verdict; const passedCount = Object.values(run.evaluation.expectations).filter((result) => result === 'PASS').length; return <button className={`ab-table-row ${selectedRun === run.id + index ? 'selected' : ''}`} key={run.id + index} onClick={() => setSelectedRun(run.id + index)}><span><Badge tone={verdict === 'PASS' ? 'green' : 'red'}>{verdict}</Badge></span><span className="ab-mono">{run.version}</span><span>{run.date}</span><span>{run.duration}</span><span className="ab-score">{passedCount} / {story.expectations.length} passed</span><span>{run.note}</span></button> })}</div>}</div>
}

function comparisonRuns(story: DisplayStory): [RecordedEvaluation, RecordedEvaluation] | undefined {
  const first = story.runs[0]
  if (!first) return undefined
  const second = story.runs.find((run) => run.evaluation.verdict !== first.evaluation.verdict) ?? story.runs[1] ?? first
  return [first, second]
}

function CompareView({ story }: { story: DisplayStory }) {
  const runs = comparisonRuns(story)
  if (!runs) return <div className="ab-compare"><div className="ab-view-intro"><div><h2>Compare runs</h2><p>Understand how agent behavior changed between two executions.</p></div></div><div className="ab-empty-state">No completed run history is available to compare.</div></div>
  const comparison = story.comparison
  return <div className="ab-compare"><div className="ab-view-intro"><div><h2>Compare runs</h2><p>Understand how agent behavior changed between two executions.</p></div><button className="ab-secondary-button"><GitCompare size={14} /> Select runs</button></div><div className="ab-compare-grid">{runs.map((run, index) => { const verdict = run.evaluation.verdict; const passedCount = Object.values(run.evaluation.expectations).filter((result) => result === 'PASS').length; return <div className="ab-compare-col" key={`${run.id}-${index}`}><div className="ab-compare-label">RUN {index === 0 ? 'A' : 'B'} <Badge tone={verdict === 'PASS' ? 'green' : 'red'}>{verdict}</Badge></div><div className="ab-compare-card"><small>VERSION</small><strong>{run.version}</strong><div className="ab-compare-score"><span>{passedCount} / {story.expectations.length}</span><small>assertions passed</small></div><div className="ab-compare-note">{run.note}</div></div><div className="ab-compare-card"><small>DECISION</small><strong>{index === 0 ? story.result.decision : comparison?.alternateDecision ?? story.result.decision}</strong><div className="ab-diff"><span className={index === 0 ? 'good' : 'bad'}>{index === 0 ? <Check size={13} /> : <X size={13} />}</span>{index === 0 ? comparison?.preferredSummary ?? 'Expected behavior' : comparison?.alternateSummary ?? 'Alternate behavior'}</div></div></div> })}</div><div className="ab-insight"><GitCompare size={16} /><div><strong>{comparison?.insightTitle ?? 'Run comparison'}</strong><p>{comparison?.insight ?? 'Compare the recorded decisions and assertion results for this Story.'}</p></div></div></div>
}

function createSessionVariant(story: DisplayStory, values: GivenState, execution: CompletedExecutionRecord): DisplayStory {
  const variant = story.simulation.kind === 'numeric-threshold' ? story.simulation.savedVariant : undefined
  const given = story.given.map((line) => { const [key] = line.split(':'); return `${key}: ${values[key.trim()] ?? ''}` })
  return { ...story, id: `${story.id}-local-variant`, name: variant?.name ?? `${story.name} Variant`, description: variant?.description ?? story.description, status: execution.evaluationResult.verdict === 'PASS' ? 'pass' : 'fail', given, result: { decision: execution.observedRun.decision, reason: execution.observedRun.reason }, tools: execution.observedRun.toolCalls, expectations: variant?.expectations ?? story.expectations, runs: [], source: { file: 'Unsaved local variant' }, simulation: { kind: 'static' }, execution: { kind: 'prototype-mock' } }
}

export default function Page() {
  if (discoveredAgents.length === 0) throw new Error('No Agentbook Stories were discovered.')
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
    setValues(initial)
    setRunState(initialRunState(story, initial))
    executingRef.current = false
  }, [initial, story])

  const setValue = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }))
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

  return <div className={`agentbook ${theme}`}><Sidebar {...{ selectedAgent, selectedStory, setSelectedAgent, setSelectedStory, expanded, setExpanded, agentList, projectName }} /><main className="ab-main" data-execution-kind={story.execution?.kind ?? 'prototype-mock'} data-project-source={projectSource}><StoryHeader story={story} tab={tab} setTab={setTab} onRun={runStory} running={running} theme={theme} setTheme={setTheme} />{projectLoadError ? <div className="ab-variant-banner" data-testid="project-load-error"><span><Badge tone="red">PROJECT ERROR</Badge> {projectLoadError}</span></div> : null}{completedEvidence ? <output hidden className="ab-sr-only" data-testid="execution-evidence">{JSON.stringify(completedEvidence)}</output> : null}{tab === 'Canvas' ? <>{modified ? <div className="ab-variant-banner"><span><Badge tone="yellow">MODIFIED</Badge> Running a modified variant of this Story</span><button className="ab-secondary-button" onClick={saveVariant}>Save as new Story</button></div> : null}<Canvas story={story} values={values} setValue={setValue} state={runState} /></> : null}{tab === 'Story' ? <StoryView story={story} /> : null}{tab === 'Runs' ? <RunsView story={story} selectedRun={selectedRun} setSelectedRun={setSelectedRun} /> : null}{tab === 'Compare' ? <CompareView story={story} /> : null}</main></div>
}
