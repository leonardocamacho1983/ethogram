'use server'

import { randomUUID } from 'node:crypto'
import { discoverStoryDefinitions } from '@/lib/agentbook/discovery'
import { evaluateStory } from '@/lib/agentbook/evaluator'
import type {
  ExecutionErrorCode,
  RealStoryActionResult,
  SafeExecutionError,
} from '@/lib/agentbook/execution-record'
import { createRealAgentProfile } from '@/lib/agentbook/real-agent-profile.server'

type RunRealStoryInput = {
  agentId: string
  storyId: string
}

function canonical(value: unknown): string {
  return JSON.stringify(value)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}

function normalizedObservedTrace(toolCalls: Array<{
  callId?: string
  name: string
  input: string
  output: string
  status: string
  startedAt?: string
  endedAt?: string
  duration: string
}>) {
  return toolCalls.map((call) => ({
    callId: call.callId,
    name: call.name,
    input: JSON.parse(call.input),
    output: JSON.parse(call.output),
    status: call.status,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    durationMs: Number(call.duration.replace('ms', '')),
  }))
}

function safeExecutionError(error: unknown): SafeExecutionError {
  const name = error instanceof Error ? error.name : 'UnknownExecutionError'
  const message = error instanceof Error ? error.message : ''
  let code: ExecutionErrorCode = 'REAL_AGENT_EXECUTION_FAILED'

  if (/timeout/i.test(name) || /timeout/i.test(message)) code = 'EXECUTION_TIMEOUT'
  else if (/step|limit/i.test(name)) code = 'EXECUTION_LIMIT_REACHED'
  else if (/tool/i.test(name)) code = 'TOOL_EXECUTION_FAILED'
  else if (/api|provider|gateway|request/i.test(name)) code = 'PROVIDER_REQUEST_FAILED'
  else if (message === 'UnsupportedExecutionProfile') code = 'UNSUPPORTED_EXECUTION_PROFILE'

  const messages: Record<ExecutionErrorCode, string> = {
    MISSING_PROVIDER_CREDENTIAL: 'The Development AI Gateway credential is unavailable to the server.',
    STORY_NOT_FOUND: 'The selected Story could not be resolved on the server.',
    STORY_NOT_REAL_EXECUTABLE: 'The selected Story is not configured for real-agent execution.',
    UNSUPPORTED_EXECUTION_PROFILE: 'The selected Story uses an unsupported execution profile.',
    EXECUTION_TIMEOUT: 'The real-agent execution timed out before completion.',
    EXECUTION_LIMIT_REACHED: 'The real-agent execution reached its configured step limit.',
    TOOL_EXECUTION_FAILED: 'A controlled local tool failed during execution.',
    PROVIDER_REQUEST_FAILED: 'The model provider request could not be completed.',
    REAL_AGENT_EXECUTION_FAILED: 'The real-agent execution could not be completed.',
  }

  return { code, message: messages[code] }
}

function failure(error: SafeExecutionError): RealStoryActionResult {
  return { status: 'execution-error', error, storyEvaluation: 'NOT EVALUATED' }
}

export async function runRealStory(input: RunRealStoryInput): Promise<RealStoryActionResult> {
  if (!(typeof process.env.AI_GATEWAY_API_KEY === 'string' && process.env.AI_GATEWAY_API_KEY.length > 0)) {
    return failure({
      code: 'MISSING_PROVIDER_CREDENTIAL',
      message: 'The Development AI Gateway credential is unavailable to the server.',
    })
  }

  const story = discoverStoryDefinitions().find(
    (candidate) => candidate.agent.id === input.agentId && candidate.id === input.storyId,
  )
  if (!story) {
    return failure({ code: 'STORY_NOT_FOUND', message: 'The selected Story could not be resolved on the server.' })
  }
  if (story.execution?.kind !== 'real-agent') {
    return failure({
      code: 'STORY_NOT_REAL_EXECUTABLE',
      message: 'The selected Story is not configured for real-agent execution.',
    })
  }

  const storySnapshot = canonical(story)
  deepFreeze(story)

  try {
    const { runner, sandbox } = createRealAgentProfile(story.execution.profile)
    const observedRun = await runner.run(story, undefined)
    const toolTraceMatchesObservedRun = canonical(normalizedObservedTrace(observedRun.toolCalls)) === canonical(sandbox.getTrace())
    const evaluationResult = evaluateStory(story, observedRun)

    return {
      status: 'completed',
      execution: { observedRun, evaluationResult },
      boundaryEvidence: {
        executionId: randomUUID(),
        completedBehavioralRuns: 1,
        runner: 'RealAgentRunner',
        evaluator: 'deterministic',
        storyUnchanged: canonical(story) === storySnapshot,
        toolTraceMatchesObservedRun,
        mockDataUsed: false,
      },
    }
  } catch (error) {
    return failure(safeExecutionError(error))
  }
}
