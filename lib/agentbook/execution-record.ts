import type {
  EvaluationResult,
  ModelExecutionEvidence,
  ObservedRun,
  ToolCall,
} from './domain'

export type CompletedExecutionRecord = {
  observedRun: ObservedRun
  evaluationResult: EvaluationResult
}

export type ExecutionErrorCode =
  | 'MISSING_PROVIDER_CREDENTIAL'
  | 'STORY_NOT_FOUND'
  | 'STORY_NOT_REAL_EXECUTABLE'
  | 'UNSUPPORTED_EXECUTION_PROFILE'
  | 'EXECUTION_TIMEOUT'
  | 'EXECUTION_LIMIT_REACHED'
  | 'TOOL_EXECUTION_FAILED'
  | 'PROVIDER_REQUEST_FAILED'
  | 'REAL_AGENT_EXECUTION_FAILED'

export type SafeExecutionError = {
  code: ExecutionErrorCode
  message: string
}

export type ExecutionBoundaryEvidence = {
  executionId: string
  completedBehavioralRuns: 1
  runner: 'RealAgentRunner' | 'ExternalProjectRunner'
  evaluator: 'deterministic'
  storyUnchanged: boolean
  toolTraceMatchesObservedRun: boolean
  mockDataUsed: false
}

export type RealStoryActionResult =
  | {
      status: 'completed'
      execution: CompletedExecutionRecord
      boundaryEvidence: ExecutionBoundaryEvidence
    }
  | {
      status: 'execution-error'
      error: SafeExecutionError
      storyEvaluation: 'NOT EVALUATED'
    }

export type ObservableTimelineItem = {
  kind: 'execution-started' | 'tool-completed' | 'final-response' | 'execution-completed'
  label: string
  detail: string
  duration: string
  toolCall?: ToolCall
}

export function observableTimeline(run: ObservedRun): ObservableTimelineItem[] {
  const evidence = run.evidence
  const items: ObservableTimelineItem[] = [
    {
      kind: 'execution-started',
      label: 'Model execution started',
      detail: evidence?.startedAt ?? 'Start time unavailable',
      duration: '—',
    },
  ]

  for (const call of run.toolCalls) {
    items.push({
      kind: 'tool-completed',
      label: `Tool completed: ${call.name}`,
      detail: `Operational status: ${call.status}`,
      duration: call.duration || 'Unavailable',
      toolCall: call,
    })
  }

  if (run.finalResponse) {
    items.push({
      kind: 'final-response',
      label: 'Final response produced',
      detail: 'Observable model output recorded',
      duration: '—',
    })
  }

  items.push({
    kind: 'execution-completed',
    label: 'Model execution completed',
    detail: evidence?.finishReason
      ? `Finish reason: ${evidence.finishReason}`
      : 'Completion metadata unavailable',
    duration: evidence ? `${evidence.latencyMs}ms` : 'Unavailable',
  })

  return items
}

export function metricValue(value: string | number | undefined): string {
  return value === undefined || value === '' ? 'Unavailable' : String(value)
}

export function executionMetrics(run?: ObservedRun): {
  latency: string
  provider: string
  model: string
  inputTokens: string
  outputTokens: string
  totalTokens: string
  toolCallCount: string
} {
  if (!run) {
    return {
      latency: 'Unavailable',
      provider: 'Unavailable',
      model: 'Unavailable',
      inputTokens: 'Unavailable',
      outputTokens: 'Unavailable',
      totalTokens: 'Unavailable',
      toolCallCount: 'Unavailable',
    }
  }

  const evidence: ModelExecutionEvidence | undefined = run.evidence
  const usage = evidence?.tokenUsage
  return {
    latency: evidence ? `${evidence.latencyMs}ms` : 'Unavailable',
    provider: metricValue(evidence?.provider),
    model: metricValue(evidence?.model),
    inputTokens: usage?.availability === 'available'
      ? metricValue(usage.inputTokens)
      : 'Unavailable',
    outputTokens: usage?.availability === 'available'
      ? metricValue(usage.outputTokens)
      : 'Unavailable',
    totalTokens: usage?.availability === 'available'
      ? metricValue(usage.totalTokens)
      : 'Unavailable',
    toolCallCount: String(run.toolCalls.length),
  }
}
