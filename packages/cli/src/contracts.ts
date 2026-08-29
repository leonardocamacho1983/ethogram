export type AgentDescriptor = {
  id: string
  name: string
  description: string
  icon: string
}

export type ExpectationMatcher =
  | { kind: 'tool-called'; tool: string }
  | { kind: 'tool-not-called'; tool: string }

export type StoryExpectationDescriptor = {
  id: string
  description: string
  failureDescription?: string
  matcher: ExpectationMatcher
}

export type StoryDescriptor = {
  id: string
  name: string
  agent: AgentDescriptor
  description: string
  given: string[]
  prompt: string
  expectations: StoryExpectationDescriptor[]
  source: string
  executable: boolean
}

export type ProjectDescriptor = {
  projectRoot: string
  name: string
  adapter: { id: string; label: string }
  agents: AgentDescriptor[]
  stories: StoryDescriptor[]
}

export type ExecutionRequest = {
  story: StoryDescriptor
}

export type ObservedToolCall = {
  callId: string
  name: string
  status: 'success' | 'error'
  duration: string
  input: string
  output: string
  startedAt: string
  endedAt: string
}

export type ObservedTimelineStep = {
  label: string
  detail: string
  duration: string
}

export type ObservedRun = {
  decision: string
  reason: string
  finalResponse: string
  toolCalls: ObservedToolCall[]
  timeline: ObservedTimelineStep[]
  evidence: {
    provider: string
    model: string
    startedAt: string
    endedAt: string
    latencyMs: number
    finishReason: string
    tokenUsage: { availability: 'unavailable' }
  }
}

export type BehavioralVerdict = 'PASS' | 'FAIL'

export type EvaluationResult = {
  verdict: BehavioralVerdict
  expectations: Readonly<Record<string, BehavioralVerdict>>
}

export type CompletedExecutionRecord = {
  observedRun: ObservedRun
  evaluationResult: EvaluationResult
}

export interface Runner {
  run(request: ExecutionRequest): Promise<ObservedRun>
}

export interface LanguageAdapter extends Runner {
  readonly id: string
  loadProject(projectRoot: string): Promise<ProjectDescriptor>
}
