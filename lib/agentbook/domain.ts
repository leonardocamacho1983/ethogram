export type AgentIcon = 'headset' | 'target' | 'search'

export type Agent = {
  id: string
  name: string
  description: string
  icon: AgentIcon
}

export type Assertion = {
  label: string
  detail: string
  failureDetail?: string
  passed: boolean
}

export type StoryExpectation = Assertion

export type ToolCall = {
  name: string
  status: string
  duration: string
  input: string
  output: string
}

export type RunStatus = 'PASS' | 'FAIL'

export type Run = {
  id: string
  version: string
  status: RunStatus
  date: string
  duration: string
  score: string
  note: string
}

export type StoryResult = {
  decision: string
  reason: string
}

export type TimelineStep = {
  label: string
  detail: string
  duration: string
}

export type StoryOutcome = StoryResult & {
  assertionResults?: boolean[]
  toolCalls?: ToolCall[]
  timeline?: TimelineStep[]
}

export type StorySimulation =
  | { kind: 'static' }
  | {
      kind: 'numeric-threshold'
      actualField: string
      thresholdField: string
      above: StoryOutcome
      atOrBelow: StoryOutcome
      savedVariant?: {
        name: string
        description: string
        expectations?: Assertion[]
      }
    }

export type StoryComparison = {
  alternateDecision: string
  preferredSummary: string
  alternateSummary: string
  insightTitle: string
  insight: string
}

export type Story = {
  readonly __agentbookType: 'story'
  id: string
  name: string
  agent: Agent
  group: string
  description: string
  status: 'pass' | 'fail' | 'policy'
  kind: 'DEFAULT' | 'POLICY' | 'SAFETY' | 'EDGE'
  tags: string[]
  given: string[]
  prompt: string
  result: StoryResult
  tools: ToolCall[]
  expectations: Assertion[]
  runs: Run[]
  source: {
    file: string
    exportName?: string
    code?: string
  }
  simulation: StorySimulation
  comparison?: StoryComparison
}

type StoryInputBase = {
  id: string
  name: string
  agent: Agent
  description: string
  group?: string
  status?: Story['status']
  kind?: Story['kind']
  tags?: string[]
  given?: string[]
  result?: StoryResult
  tools?: ToolCall[]
  runs?: Run[]
  source?: Partial<Story['source']>
  simulation?: StorySimulation
  comparison?: StoryComparison
}

type PromptInput = { prompt: string; when?: never } | { when: string; prompt?: never }
type ExpectationsInput =
  | { expectations: Assertion[]; then?: never }
  | { then: Assertion[]; expectations?: never }

export type StoryInput = StoryInputBase & PromptInput & ExpectationsInput

export type ScenarioRun = StoryResult & {
  assertionResults: boolean[]
  status: RunStatus
  toolCalls: ToolCall[]
  timeline: TimelineStep[]
}
