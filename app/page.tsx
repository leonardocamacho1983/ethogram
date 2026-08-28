'use client'

import { useEffect, useMemo, useState } from 'react'
import { discoverStories, groupStoriesByAgent, type AgentWithStories } from '@/lib/agentbook/discovery'
import type { Run, ScenarioRun, Story, StoryOutcome, TimelineStep } from '@/lib/agentbook/domain'
import { Activity, ArrowDown, Check, ChevronDown, ChevronRight, Clock3, Code2, Copy, Ellipsis, FlaskConical, GitCompare, Headphones, History, ListChecks, Moon, Play, Plus, Search, Settings2, Sun, Wrench, X } from 'lucide-react'

const discoveredStories = discoverStories()
const discoveredAgents = groupStoriesByAgent(discoveredStories)
const iconMap = { headset: Headphones, target: Wrench, search: Search }

type Tab = 'Canvas' | 'Story' | 'Runs' | 'Compare'
type GivenState = Record<string, string>
type ExpandedState = Record<string, boolean>

function parseGiven(story: Story): GivenState {
  return Object.fromEntries(story.given.map((line) => {
    const [key, ...value] = line.split(':')
    return [key.trim(), value.join(':').trim()]
  }))
}

function numericValue(value: string | undefined): number {
  return Number((value ?? '').replace(/[^0-9.]/g, '')) || 0
}

function defaultTimeline(run: Pick<ScenarioRun, 'decision' | 'toolCalls'>): TimelineStep[] {
  return [
    { label: 'Input', detail: 'Scenario received', duration: '0.1s' },
    { label: 'Tool Call', detail: `${run.toolCalls.length} observable tool calls`, duration: '0.4s' },
    { label: 'Decision', detail: run.decision, duration: '0.6s' },
    { label: 'Action', detail: 'Configured outcome selected', duration: '0.3s' },
    { label: 'Output', detail: 'Response returned to customer', duration: '0.4s' },
  ]
}

function evaluateRun(story: Story, values: GivenState): ScenarioRun {
  let outcome: StoryOutcome = story.result

  if (story.simulation.kind === 'numeric-threshold') {
    const actual = numericValue(values[story.simulation.actualField])
    const threshold = numericValue(values[story.simulation.thresholdField])
    outcome = actual > threshold ? story.simulation.above : story.simulation.atOrBelow
    outcome = { ...outcome, reason: outcome.reason.replaceAll('${threshold}', `$${threshold}`) }
  }

  const assertionResults = outcome.assertionResults ?? story.expectations.map((expectation) => expectation.passed)
  const toolCalls = outcome.toolCalls ?? story.tools

  return {
    decision: outcome.decision,
    reason: outcome.reason,
    assertionResults,
    status: assertionResults.every(Boolean) ? 'PASS' : 'FAIL',
    toolCalls,
    timeline: outcome.timeline ?? defaultTimeline({ decision: outcome.decision, toolCalls }),
  }
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
}

function Sidebar({ selectedAgent, selectedStory, setSelectedAgent, setSelectedStory, expanded, setExpanded, agentList }: SidebarProps) {
  return <aside className="ab-sidebar"><div className="ab-sidebar-top"><div className="ab-logo-mark">A</div><span>Agentbook</span><button className="ab-icon-button" aria-label="Configurações"><Settings2 size={15} /></button></div><div className="ab-project"><span className="ab-dot" /> acme-agents <ChevronDown size={14} /></div><div className="ab-search"><Search size={14} /><span>Filter stories</span><kbd>⌘ K</kbd></div><div className="ab-nav-label">AGENTS <button className="ab-plus" aria-label="Adicionar agente"><Plus size={13} /></button></div><div className="ab-agents">{agentList.map((agent) => { const Icon = iconMap[agent.icon]; const open = expanded[agent.id]; return <div key={agent.id}><button className={`ab-agent ${selectedAgent === agent.id ? 'selected' : ''}`} onClick={() => { setSelectedAgent(agent.id); setSelectedStory(agent.stories[0].id); setExpanded((current) => ({ ...current, [agent.id]: !open })) }}><span className="ab-chevron">{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span><Icon size={15} /><span>{agent.name}</span><span className="ab-count">{agent.stories.length}</span></button>{open ? <div className="ab-story-list">{agent.stories.map((story) => <button key={story.id} className={`ab-story-link ${selectedStory === story.id ? 'selected' : ''}`} onClick={() => setSelectedStory(story.id)}><span className={`ab-status-dot ${story.status}`} /><span>{story.name}</span><em>{story.kind}</em></button>)}</div> : null}</div> })}</div><div className="ab-sidebar-bottom"><button className="ab-bottom-link"><FlaskConical size={15} /> Environments <Badge>3</Badge></button><button className="ab-bottom-link"><ListChecks size={15} /> All assertions <Badge>24</Badge></button><button className="ab-bottom-link"><History size={15} /> Activity</button><div className="ab-user"><div className="ab-avatar">SC</div><div><strong>Sarah Chen</strong><small>Admin</small></div><Ellipsis size={16} /></div></div></aside>
}

type StoryHeaderProps = { story: Story; tab: Tab; setTab: (tab: Tab) => void; onRun: () => void; running: boolean; theme: string; setTheme: (theme: string) => void }

function StoryHeader({ story, tab, setTab, onRun, running, theme, setTheme }: StoryHeaderProps) {
  return <><header className="ab-header"><div className="ab-breadcrumb"><span>{story.agent.name}</span><ChevronRight size={14} /><strong>{story.name}</strong></div><div className="ab-header-actions"><button className="ab-icon-button" aria-label="Alternar tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button><button className="ab-icon-button" aria-label="Mais opções"><Ellipsis size={16} /></button><button className="ab-run-button" onClick={onRun} disabled={running}>{running ? <Activity className="ab-spin" size={14} /> : <Play size={13} fill="currentColor" />} {running ? 'Running...' : 'Run Story'}</button></div></header><div className="ab-story-meta"><div className={`ab-story-symbol ${story.status}`}><Code2 size={18} /></div><div><h1>{story.name}</h1><p>{story.description}</p><small className="ab-source">{story.source.file}{story.source.exportName ? ` › ${story.source.exportName}` : ''}</small></div><div className="ab-meta-spacer" /><Badge tone={story.status === 'policy' ? 'yellow' : story.status === 'fail' ? 'red' : 'green'}>{story.status === 'policy' ? 'POLICY' : story.status === 'fail' ? 'FAILING' : 'PASSING'}</Badge><span className="ab-updated"><Clock3 size={13} /> Updated 2h ago</span></div><nav className="ab-tabs" aria-label="Story views">{(['Canvas', 'Story', 'Runs', 'Compare'] as Tab[]).map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}{item === 'Runs' ? <span className="ab-tab-count">12</span> : null}</button>)}</nav></>
}

function GivenPanel({ story, values, setValue }: { story: Story; values: GivenState; setValue: (key: string, value: string) => void }) {
  return <Panel title="Given" icon={FlaskConical} right={<span className="ab-muted-small">Local mock</span>}><div className="ab-given-grid">{story.given.map((line) => { const [rawKey, ...rest] = line.split(':'); const key = rawKey.trim(); return <label className="ab-given-row" key={line}><span className="ab-key">{key}</span><input aria-label={key} value={values[key] ?? rest.join(':').trim()} onChange={(event) => setValue(key, event.target.value)} /></label> })}</div></Panel>
}

function Canvas({ story, ran, values, setValue, run }: { story: Story; ran: boolean; values: GivenState; setValue: (key: string, value: string) => void; run: ScenarioRun }) {
  const { assertionResults } = run
  return <div className="ab-canvas"><div className="ab-canvas-main"><GivenPanel story={story} values={values} setValue={setValue} /><Panel title="Configuration" icon={Settings2}><div className="ab-config-grid"><div><small>MODEL</small><strong>claude-3-5-sonnet</strong></div><div><small>TEMPERATURE</small><strong>0.2</strong></div><div><small>MAX STEPS</small><strong>8</strong></div><div><small>ENVIRONMENT</small><strong><span className="ab-dot" /> local</strong></div></div></Panel><Panel title="Input"><div className="ab-input-box">{story.prompt}</div></Panel><Panel title="Result" icon={Check} right={<Badge tone={!ran ? 'muted' : run.status === 'PASS' ? 'green' : 'red'}>{!ran ? 'READY' : run.status}</Badge>}><div className="ab-result"><div><small>DECISION</small><strong>{run.decision}</strong></div><div><small>REASON</small><p>{run.reason}</p></div></div></Panel></div><div className="ab-canvas-side"><Timeline ran={ran} steps={run.timeline} /><ToolInspector run={run} /><Panel title="Assertions" icon={ListChecks} right={<span className="ab-muted-small">{assertionResults.filter(Boolean).length} / {assertionResults.length} passed</span>}><div className="ab-assertions">{story.expectations.map((expectation, index) => { const passed = assertionResults[index] ?? expectation.passed; return <div className="ab-assertion" key={expectation.label}><span className={passed ? '' : 'ab-assert-fail'}>{passed ? <Check size={14} /> : <X size={14} />}</span><div><strong>{expectation.label}</strong><small>{passed ? expectation.detail : expectation.failureDetail ?? 'The response did not satisfy this Story\'s expected behavior.'}</small></div></div> })}</div></Panel><Panel title="Metrics" icon={Activity}><div className="ab-metrics"><div><small>LATENCY</small><strong>1.8s</strong></div><div><small>INPUT TOKENS</small><strong>842</strong></div><div><small>TOOLS CALLED</small><strong>{run.toolCalls.length}</strong></div></div></Panel></div></div>
}

function Timeline({ ran, steps }: { ran: boolean; steps: TimelineStep[] }) {
  return <Panel title="Execution timeline" icon={Activity} right={<span className="ab-muted-small">{ran ? 'Completed in 1.8s' : 'Not run yet'}</span>}><div className="ab-timeline">{steps.map((step, index) => <div className="ab-timeline-row" key={`${step.label}-${index}`}><div className={`ab-timeline-icon ${ran || index < 3 ? 'done' : ''}`}>{ran || index < 3 ? <Check size={12} /> : <span>{index + 1}</span>}</div><div><strong>{step.label}</strong><small>{step.detail}</small></div><span className="ab-time">{step.duration}</span></div>)}</div></Panel>
}

function ToolInspector({ run }: { run: ScenarioRun }) {
  const [open, setOpen] = useState<string | null>(null)
  return <Panel title="Tool calls" icon={Wrench} right={<span className="ab-muted-small">{run.toolCalls.length} calls</span>}><div className="ab-tools">{run.toolCalls.map((tool) => <div key={tool.name} className="ab-tool"><button className="ab-tool-row" onClick={() => setOpen(open === tool.name ? null : tool.name)}><ChevronRight className={open === tool.name ? 'rotate-90' : ''} size={14} /><strong>{tool.name}</strong><Badge tone="green">{tool.status}</Badge><span>{tool.duration}</span></button>{open === tool.name ? <div className="ab-json"><div><small>INPUT</small><code>{tool.input}</code></div><div><small>OUTPUT</small><code>{tool.output}</code></div><button className="ab-copy"><Copy size={12} /> Copy JSON</button></div> : null}</div>)}</div></Panel>
}

function fallbackStoryCode(story: Story): string {
  return `export default defineStory({\n  id: "${story.id}",\n  name: "${story.name}",\n  agent: ${story.agent.id}Agent,\n  description: "${story.description}",\n  when: "${story.prompt}",\n  then: [\n${story.expectations.map((item) => `    { label: "${item.label}", detail: "${item.detail}", passed: true },`).join('\n')}\n  ],\n})`
}

function StoryView({ story }: { story: Story }) {
  const code = story.source.code ?? fallbackStoryCode(story)
  return <div className="ab-code-wrap"><div className="ab-code-toolbar"><span><Code2 size={14} /> {story.source.file}</span><button className="ab-text-button"><Copy size={13} /> Copy</button></div><pre>{code.split('\n').map((line, index) => <span key={index}><i>{String(index + 1).padStart(2, ' ')}</i>{line}{'\n'}</span>)}</pre></div>
}

function RunsView({ story, selectedRun, setSelectedRun }: { story: Story; selectedRun: string; setSelectedRun: (id: string) => void }) {
  return <div className="ab-runs-view"><div className="ab-view-intro"><div><h2>Run history</h2><p>Every execution of this story, across all versions and environments.</p></div><button className="ab-secondary-button"><ArrowDown size={14} /> Export CSV</button></div><div className="ab-table"><div className="ab-table-row ab-table-head"><span>STATUS</span><span>VERSION</span><span>RUN AT</span><span>DURATION</span><span>SCORE</span><span>NOTE</span></div>{story.runs.concat(story.runs, story.runs).map((run, index) => <button className={`ab-table-row ${selectedRun === run.id + index ? 'selected' : ''}`} key={run.id + index} onClick={() => setSelectedRun(run.id + index)}><span><Badge tone={run.status === 'PASS' ? 'green' : 'red'}>{run.status}</Badge></span><span className="ab-mono">{run.version}</span><span>{run.date}</span><span>{run.duration}</span><span className="ab-score">{run.status === 'PASS' ? `${story.expectations.length} / ${story.expectations.length}` : `${Math.max(0, story.expectations.length - 1)} / ${story.expectations.length}`} passed</span><span>{run.note}</span></button>)}</div></div>
}

function comparisonRuns(story: Story): [Run, Run] {
  const placeholder: Run = { id: 'not-run', version: '—', status: 'PASS', date: 'Not run', duration: '—', score: '—', note: 'No run recorded' }
  const first = story.runs[0] ?? placeholder
  const second = story.runs.find((run) => run.status !== first.status) ?? story.runs[1] ?? first
  return [first, second]
}

function CompareView({ story }: { story: Story }) {
  const runs = comparisonRuns(story)
  const comparison = story.comparison
  return <div className="ab-compare"><div className="ab-view-intro"><div><h2>Compare runs</h2><p>Understand how agent behavior changed between two executions.</p></div><button className="ab-secondary-button"><GitCompare size={14} /> Select runs</button></div><div className="ab-compare-grid">{runs.map((run, index) => <div className="ab-compare-col" key={`${run.id}-${index}`}><div className="ab-compare-label">RUN {index === 0 ? 'A' : 'B'} <Badge tone={run.status === 'PASS' ? 'green' : 'red'}>{run.status}</Badge></div><div className="ab-compare-card"><small>VERSION</small><strong>{run.version}</strong><div className="ab-compare-score"><span>{run.status === 'PASS' ? `${story.expectations.length} / ${story.expectations.length}` : `${Math.max(0, story.expectations.length - 1)} / ${story.expectations.length}`}</span><small>assertions passed</small></div><div className="ab-compare-note">{run.note}</div></div><div className="ab-compare-card"><small>DECISION</small><strong>{index === 0 ? story.result.decision : comparison?.alternateDecision ?? story.result.decision}</strong><div className="ab-diff"><span className={index === 0 ? 'good' : 'bad'}>{index === 0 ? <Check size={13} /> : <X size={13} />}</span>{index === 0 ? comparison?.preferredSummary ?? 'Expected behavior' : comparison?.alternateSummary ?? 'Alternate behavior'}</div></div></div>)}</div><div className="ab-insight"><GitCompare size={16} /><div><strong>{comparison?.insightTitle ?? 'Run comparison'}</strong><p>{comparison?.insight ?? 'Compare the recorded decisions and assertion results for this Story.'}</p></div></div></div>
}

function createSessionVariant(story: Story, values: GivenState, run: ScenarioRun): Story {
  const variant = story.simulation.kind === 'numeric-threshold' ? story.simulation.savedVariant : undefined
  const given = story.given.map((line) => { const [key] = line.split(':'); return `${key}: ${values[key.trim()] ?? ''}` })
  return { ...story, id: `${story.id}-local-variant`, name: variant?.name ?? `${story.name} Variant`, description: variant?.description ?? story.description, status: run.status === 'PASS' ? 'pass' : 'fail', given, result: { decision: run.decision, reason: run.reason }, tools: run.toolCalls, expectations: variant?.expectations ?? story.expectations, runs: [], source: { file: 'Unsaved local variant' }, simulation: { kind: 'static' } }
}

export default function Page() {
  if (discoveredAgents.length === 0) throw new Error('No Agentbook Stories were discovered.')
  const firstAgent = discoveredAgents[0]
  const firstStory = firstAgent.stories[0]
  const [sessionStories, setSessionStories] = useState<Story[]>([])
  const agentList = useMemo(() => groupStoriesByAgent([...discoveredStories, ...sessionStories]), [sessionStories])
  const [selectedAgent, setSelectedAgent] = useState(firstAgent.id)
  const [selectedStory, setSelectedStory] = useState(firstStory.id)
  const [expanded, setExpanded] = useState<ExpandedState>(() => Object.fromEntries(discoveredAgents.map((agent, index) => [agent.id, index === 0])))
  const [tab, setTab] = useState<Tab>('Canvas')
  const [running, setRunning] = useState(false)
  const [ran, setRan] = useState(true)
  const [run, setRun] = useState<ScenarioRun>(() => evaluateRun(firstStory, parseGiven(firstStory)))
  const [theme, setTheme] = useState('dark')
  const [selectedRun, setSelectedRun] = useState(firstStory.runs[0]?.id ?? '')
  const story = useMemo(() => agentList.find((agent) => agent.id === selectedAgent)?.stories.find((candidate) => candidate.id === selectedStory) ?? firstStory, [agentList, firstStory, selectedAgent, selectedStory])
  const initial = useMemo(() => parseGiven(story), [story])
  const [values, setValues] = useState<GivenState>(() => parseGiven(firstStory))

  useEffect(() => { setValues(initial); setRun(evaluateRun(story, initial)); setRan(true) }, [initial, story])

  const setValue = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }))
  const modified = JSON.stringify(values) !== JSON.stringify(initial)
  const runStory = () => { setRunning(true); setRan(false); setRun(evaluateRun(story, values)); window.setTimeout(() => { setRunning(false); setRan(true) }, 1200) }
  const saveVariant = () => { const newStory = createSessionVariant(story, values, run); setSessionStories((current) => [...current.filter((item) => item.id !== newStory.id), newStory]); setSelectedStory(newStory.id); setTab('Canvas') }

  return <div className={`agentbook ${theme}`}><Sidebar {...{ selectedAgent, selectedStory, setSelectedAgent, setSelectedStory, expanded, setExpanded, agentList }} /><main className="ab-main"><StoryHeader story={story} tab={tab} setTab={setTab} onRun={runStory} running={running} theme={theme} setTheme={setTheme} />{tab === 'Canvas' ? <>{modified ? <div className="ab-variant-banner"><span><Badge tone="yellow">MODIFIED</Badge> Running a modified variant of this Story</span><button className="ab-secondary-button" onClick={saveVariant}>Save as new Story</button></div> : null}<Canvas story={story} ran={ran} values={values} setValue={setValue} run={run} /></> : null}{tab === 'Story' ? <StoryView story={story} /> : null}{tab === 'Runs' ? <RunsView story={story} selectedRun={selectedRun} setSelectedRun={setSelectedRun} /> : null}{tab === 'Compare' ? <CompareView story={story} /> : null}</main></div>
}
