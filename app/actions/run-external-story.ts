'use server'

import { randomUUID } from 'node:crypto'
import { evaluateStory } from '@/lib/agentbook/evaluator'
import type { RealStoryActionResult } from '@/lib/agentbook/execution-record'
import { loadAgentbookProject } from '@/lib/agentbook/external-project-loader.server'
import { ExternalProjectRunner } from '@/lib/agentbook/external-project-runner'

type RunExternalStoryInput = {
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

export async function runExternalStory(input: RunExternalStoryInput): Promise<RealStoryActionResult> {
  const projectRoot = process.env.ETHOGRAM_PROJECT_ROOT?.trim()
  if (!projectRoot) {
    return {
      status: 'execution-error',
      storyEvaluation: 'NOT EVALUATED',
      error: { code: 'REAL_AGENT_EXECUTION_FAILED', message: 'No external Ethogram project is configured.' },
    }
  }

  try {
    const project = await loadAgentbookProject(projectRoot)
    const story = project.stories.find(
      (candidate) => candidate.agent.id === input.agentId && candidate.id === input.storyId,
    )
    if (!story || story.execution?.kind !== 'external-profile') {
      return {
        status: 'execution-error',
        storyEvaluation: 'NOT EVALUATED',
        error: { code: 'STORY_NOT_FOUND', message: 'The selected external Story could not be resolved.' },
      }
    }

    const executionProfileId = story.execution.profile
    const profile = project.executionProfiles.find((candidate) => candidate.id === executionProfileId)
    if (!profile) {
      return {
        status: 'execution-error',
        storyEvaluation: 'NOT EVALUATED',
        error: { code: 'UNSUPPORTED_EXECUTION_PROFILE', message: 'The selected external execution profile is unavailable.' },
      }
    }

    const storySnapshot = canonical(story)
    deepFreeze(story)
    const runner = new ExternalProjectRunner(profile)
    const observedRun = await runner.run(story, undefined)
    const trace = runner.getTrace()
    const normalizedObservedTrace = observedRun.toolCalls.map((call, index) => ({
      order: index + 1,
      callId: call.callId,
      name: call.name,
      input: JSON.parse(call.input),
      output: JSON.parse(call.output),
      status: call.status,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      durationMs: Number(call.duration.replace('ms', '')),
    }))
    const evaluationResult = evaluateStory(story, observedRun)

    return {
      status: 'completed',
      execution: { observedRun, evaluationResult },
      boundaryEvidence: {
        executionId: randomUUID(),
        completedBehavioralRuns: 1,
        runner: 'ExternalProjectRunner',
        evaluator: 'deterministic',
        storyUnchanged: canonical(story) === storySnapshot,
        toolTraceMatchesObservedRun: canonical(normalizedObservedTrace) === canonical(trace),
        mockDataUsed: false,
      },
    }
  } catch {
    return {
      status: 'execution-error',
      storyEvaluation: 'NOT EVALUATED',
      error: {
        code: 'REAL_AGENT_EXECUTION_FAILED',
        message: 'The external Story execution could not be completed.',
      },
    }
  }
}
