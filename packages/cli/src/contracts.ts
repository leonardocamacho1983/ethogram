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

export type StoryGivenValue =
  | string
  | number
  | boolean
  | null
  | readonly StoryGivenValue[]
  | { readonly [key: string]: StoryGivenValue }

export type StoryGiven = string[] | Readonly<Record<string, StoryGivenValue>>

export type StoryDescriptor = {
  id: string
  name: string
  agent: AgentDescriptor
  description: string
  given: StoryGiven
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

type ObservedToolCallBase = {
  callId: string
  name: string
  input: string
  duration?: string
  startedAt?: string
  endedAt?: string
}

export type ObservedToolCall =
  | (ObservedToolCallBase & {
      status: 'success'
      output?: string
      error?: never
    })
  | (ObservedToolCallBase & {
      status: 'error'
      output?: never
      error?: {
        name?: string
        message: string
      }
    })

export type ObservedTimelineStep = {
  label: string
  detail: string
  duration?: string
}

export type ObservedTokenUsage =
  | { availability: 'unavailable' }
  | {
      availability: 'available'
      inputTokens?: number
      outputTokens?: number
      totalTokens?: number
      reasoningTokens?: number
    }

export type ObservedRun = {
  decision: string
  reason: string
  finalResponse: string
  toolCalls: ObservedToolCall[]
  timeline: ObservedTimelineStep[]
  evidence: {
    provider?: string
    model?: string
    startedAt?: string
    endedAt?: string
    latencyMs?: number
    finishReason?: string
    tokenUsage: ObservedTokenUsage
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
