export type AgentIcon = 'headset' | 'target' | 'search'

export type Agent = {
  id: string
  name: string
  description: string
  icon: AgentIcon
}

export type ToolCalledMatcher = {
  kind: 'tool-called'
  tool: string
}

export type ToolNotCalledMatcher = {
  kind: 'tool-not-called'
  tool: string
}

export type ExpectationMatcher = ToolCalledMatcher | ToolNotCalledMatcher

export type StoryExpectation = {
  id: string
  description: string
  failureDescription?: string
  matcher: ExpectationMatcher
  passed?: never
  failed?: never
  status?: never
  verdict?: never
}

export type Assertion = StoryExpectation

export type ToolCall = {
  name: string
  status: string
  duration: string
  input: string
  output: string
  callId?: string
  startedAt?: string
  endedAt?: string
}

export type BehavioralVerdict = 'PASS' | 'FAIL'
export type RunStatus = BehavioralVerdict

export type StoryResult = {
  decision: string
  reason: string
}

export type TimelineStep = {
  label: string
  detail: string
  duration: string
}

export type ModelTokenUsage = {
  availability: 'available' | 'unavailable'
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  reasoningTokens?: number
}

export type ModelExecutionEvidence = {
  provider: string
  model: string
  responseProvider?: string
  responseModel?: string
  responseId?: string
  startedAt: string
  endedAt: string
  latencyMs: number
  requestCount: number
  finishReason: string
  tokenUsage: ModelTokenUsage
  warnings: string[]
  randomness: {
    temperature: number
    mode: 'lowest-practical'
    realLlmRemainsNonDeterministic: true
  }
}

export type ObservedRun = StoryResult & {
  finalResponse?: string
  toolCalls: ToolCall[]
  timeline: TimelineStep[]
  evidence?: ModelExecutionEvidence
}

export type EvaluationResult = {
  verdict: BehavioralVerdict
  expectations: Readonly<Record<string, BehavioralVerdict>>
}

export type RecordedEvaluation = {
  id: string
  version: string
  date: string
  duration: string
  score: string
  note: string
  evaluation: EvaluationResult
}

export type StoryOutcome = StoryResult & {
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
        expectations?: StoryExpectation[]
      }
    }

export type StoryComparison = {
  alternateDecision: string
  preferredSummary: string
  alternateSummary: string
  insightTitle: string
  insight: string
}

export type StoryExecutionCapability =
  | { kind: 'prototype-mock' }
  | { kind: 'real-agent'; profile: string }
  | { kind: 'external-profile'; profile: string }

export type StoryCore = {
  readonly __agentbookType: 'story'
  id: string
  name: string
  agent: Agent
  description: string
  given: string[]
  prompt: string
  expectations: StoryExpectation[]
  execution?: StoryExecutionCapability
}

export type StoryPresentation = {
  group: string
  status: 'pass' | 'fail' | 'policy'
  kind: 'DEFAULT' | 'POLICY' | 'SAFETY' | 'EDGE'
  tags: string[]
  result: StoryResult
  tools: ToolCall[]
  runs: RecordedEvaluation[]
  source: {
    file: string
    exportName?: string
    code?: string
  }
  simulation: StorySimulation
  comparison?: StoryComparison
}

export type Story = StoryCore & Partial<StoryPresentation>
export type DisplayStory = StoryCore & StoryPresentation

type StoryInputBase = {
  id: string
  name: string
  agent: Agent
  description: string
  group?: string
  status?: StoryPresentation['status']
  kind?: StoryPresentation['kind']
  tags?: string[]
  given?: string[]
  result?: StoryResult
  tools?: ToolCall[]
  runs?: RecordedEvaluation[]
  source?: Partial<StoryPresentation['source']>
  simulation?: StorySimulation
  comparison?: StoryComparison
  execution?: StoryExecutionCapability
}

type PromptInput = { prompt: string; when?: never } | { when: string; prompt?: never }
type ExpectationsInput =
  | { expectations: StoryExpectation[]; then?: never }
  | { then: StoryExpectation[]; expectations?: never }

export type StoryInput = StoryInputBase & PromptInput & ExpectationsInput
