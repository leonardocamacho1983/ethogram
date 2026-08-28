import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  controlledRefundToolNames,
} from '../lib/agentbook/controlled-refund-tools.ts'
import { evaluateStory } from '../lib/agentbook/evaluator.ts'
import {
  createRealAgentProfile,
  REAL_AGENT_MAX_STEPS as MAX_STEPS,
  REAL_AGENT_MODEL as MODEL,
  REAL_AGENT_PROVIDER as PROVIDER,
  REAL_AGENT_TEMPERATURE as TEMPERATURE,
  REAL_AGENT_TIMEOUT_MS as TIMEOUT_MS,
} from '../lib/agentbook/real-agent-profile.server.ts'
import { realAgentRefundStory } from './fixtures/real-agent-refund-story.mjs'

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nestedValue of Object.values(value)) deepFreeze(nestedValue)
  }
  return value
}

function assertObservedRunHasNoBehavioralVerdicts(value, path = 'observedRun') {
  if (!value || typeof value !== 'object') return

  for (const [key, nestedValue] of Object.entries(value)) {
    assert.equal(
      ['verdict', 'passed', 'failed', 'score', 'expectations', 'evaluationResult'].includes(key),
      false,
      `${path}.${key} must not contain a behavioral verdict`,
    )
    if (key === 'status') {
      assert.match(path, /^observedRun\.toolCalls\.\d+$/)
    }
    assertObservedRunHasNoBehavioralVerdicts(nestedValue, `${path}.${key}`)
  }
}

function normalizedObservedTrace(observedRun) {
  return observedRun.toolCalls.map((call) => ({
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

function expectedMatcherVerdict(expectation, observedRun) {
  const called = observedRun.toolCalls.some((call) => call.name === expectation.matcher.tool)
  const satisfied = expectation.matcher.kind === 'tool-called' ? called : !called
  return satisfied ? 'PASS' : 'FAIL'
}

function safeFailureType(error) {
  return error instanceof Error ? error.name : 'UnknownPipelineError'
}

test('Test 03 executes one real agent run and evaluates its observation separately', async () => {
  let testExecutionStatus = 'FAIL'
  let storyEvaluation = 'NOT EVALUATED'
  let report

  try {
    assert.equal(
      typeof process.env.AI_GATEWAY_API_KEY === 'string' && process.env.AI_GATEWAY_API_KEY.length > 0,
      true,
      'AI_GATEWAY_API_KEY is unavailable to the dedicated integration-test process',
    )

    const story = deepFreeze(realAgentRefundStory)
    const storySnapshot = JSON.stringify(story)
    assert.deepEqual(Object.keys(story).sort(), [
      '__agentbookType',
      'agent',
      'description',
      'expectations',
      'given',
      'id',
      'name',
      'prompt',
    ])
    for (const expectation of story.expectations) {
      assert.deepEqual(Object.keys(expectation).sort(), ['description', 'id', 'matcher'])
    }

    const { runner, sandbox } = createRealAgentProfile('controlled-refund')

    assert.deepEqual(runner.availableToolNames, [...controlledRefundToolNames])
    const observedRun = await runner.run(story, undefined)

    assert.strictEqual(runner.lastReceivedStory, story)
    assertObservedRunHasNoBehavioralVerdicts(observedRun)
    assert.deepEqual(normalizedObservedTrace(observedRun), sandbox.getTrace())
    assert.equal(observedRun.evidence?.provider, PROVIDER)
    assert.equal(observedRun.evidence?.model, MODEL)
    assert.equal(observedRun.evidence?.requestCount >= 1, true)
    assert.equal(typeof observedRun.evidence?.responseId, 'string')
    assert.equal(observedRun.evidence?.randomness.temperature, TEMPERATURE)
    assert.equal(observedRun.evidence?.randomness.mode, 'lowest-practical')
    assert.equal(observedRun.evidence?.randomness.realLlmRemainsNonDeterministic, true)
    assert.equal(new Date(observedRun.evidence.startedAt).getTime() <= new Date(observedRun.evidence.endedAt).getTime(), true)
    assert.equal(typeof observedRun.finalResponse, 'string')

    const evaluatorSource = await readFile(
      new URL('../lib/agentbook/evaluator.ts', import.meta.url),
      'utf8',
    )
    for (const forbiddenSpecificLogic of [
      'real-agent-refund-requires-approval',
      'looks-up-order',
      'checks-refund-policy',
      'does-not-refund',
      'escalates-refund',
      'issue_refund',
      'escalate_refund',
      'ToolLoopAgent',
      'generateText',
    ]) {
      assert.doesNotMatch(evaluatorSource, new RegExp(forbiddenSpecificLogic))
    }

    const traceLengthBeforeEvaluation = sandbox.getTrace().length
    let storyReceivedByEvaluator
    const invokeExistingEvaluator = (receivedStory, receivedRun) => {
      storyReceivedByEvaluator = receivedStory
      return evaluateStory(receivedStory, receivedRun)
    }
    const evaluation = invokeExistingEvaluator(story, observedRun)
    storyEvaluation = evaluation.verdict

    assert.strictEqual(storyReceivedByEvaluator, story)
    assert.equal(sandbox.getTrace().length, traceLengthBeforeEvaluation)
    for (const expectation of story.expectations) {
      assert.equal(
        evaluation.expectations[expectation.id],
        expectedMatcherVerdict(expectation, observedRun),
      )
    }
    const expectedOverall = Object.values(evaluation.expectations).every((verdict) => verdict === 'PASS')
      ? 'PASS'
      : 'FAIL'
    assert.equal(evaluation.verdict, expectedOverall)
    assert.equal(JSON.stringify(story), storySnapshot)
    assert.equal(Object.isFrozen(story), true)
    assert.equal(Object.isFrozen(story.expectations), true)

    testExecutionStatus = 'PASS'
    report = {
      testExecutionStatus,
      storyEvaluation,
      provider: observedRun.evidence.provider,
      model: observedRun.evidence.model,
      startedAt: observedRun.evidence.startedAt,
      endedAt: observedRun.evidence.endedAt,
      latencyMs: observedRun.evidence.latencyMs,
      requestCount: observedRun.evidence.requestCount,
      responseId: observedRun.evidence.responseId,
      responseProvider: observedRun.evidence.responseProvider,
      responseModel: observedRun.evidence.responseModel,
      finishReason: observedRun.evidence.finishReason,
      tokenUsage: observedRun.evidence.tokenUsage,
      randomness: observedRun.evidence.randomness,
      warnings: observedRun.evidence.warnings,
      perExpectation: evaluation.expectations,
      observedToolTrajectory: observedRun.toolCalls.map((call) => ({
        name: call.name,
        input: JSON.parse(call.input),
        output: JSON.parse(call.output),
        operationalStatus: call.status,
      })),
      finalModelResponse: observedRun.finalResponse,
    }
    console.log(`TEST_03_EVIDENCE ${JSON.stringify(report, null, 2)}`)
  } catch (error) {
    console.log(`TEST_03_EVIDENCE ${JSON.stringify({
      testExecutionStatus,
      storyEvaluation,
      failureType: safeFailureType(error),
    })}`)
    throw new Error(`Test 03 pipeline failed (${safeFailureType(error)})`)
  }
})
