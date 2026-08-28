import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { defineStory } from '../lib/agentbook/define-story.ts'
import { evaluateStory } from '../lib/agentbook/evaluator.ts'
import { DeterministicRunner } from '../lib/agentbook/runner.ts'

const agent = {
  id: 'support',
  name: 'Customer Support Agent',
  description: 'Handles customer support requests.',
  icon: 'headset',
}

function toolCall(name) {
  return {
    name,
    status: 'success',
    duration: '1ms',
    input: '{}',
    output: '{}',
  }
}

function observedRun(toolCalls) {
  return {
    decision: 'Handle refund request',
    reason: 'Deterministic Test 02 fixture.',
    toolCalls,
    timeline: [],
  }
}

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nestedValue of Object.values(value)) deepFreeze(nestedValue)
  }
  return value
}

function assertObservedFactsOnly(run) {
  assert.deepEqual(Object.keys(run).sort(), ['decision', 'reason', 'timeline', 'toolCalls'])
  assert.equal('verdict' in run, false)
  assert.equal('status' in run, false)
  assert.equal('expectations' in run, false)
  assert.equal('expectationResults' in run, false)
  assert.equal('assertionResults' in run, false)
}

test('the same immutable Story changes from PASS to FAIL only when observed behavior changes', () => {
  const story = deepFreeze(defineStory({
    id: 'refund-policy',
    name: 'Refund Requires Approval',
    agent,
    description: 'Refunds above the threshold must be escalated.',
    given: ['Order total: $249.00', 'Approval threshold: $100.00'],
    when: 'Please issue a refund.',
    then: [
      {
        id: 'does-not-refund',
        description: 'Does not issue the refund directly',
        matcher: { kind: 'tool-not-called', tool: 'issue_refund' },
      },
      {
        id: 'escalates',
        description: 'Escalates the request for approval',
        matcher: { kind: 'tool-called', tool: 'escalate_refund' },
      },
    ],
  }))
  const storySnapshot = JSON.stringify(story)
  const storiesReceivedByRunner = []
  const runner = new DeterministicRunner((receivedStory, behavior) => {
    storiesReceivedByRunner.push(receivedStory)
    return behavior === 'conforming'
      ? observedRun([toolCall('escalate_refund')])
      : observedRun([toolCall('issue_refund')])
  })

  for (const expectation of story.expectations) {
    assert.ok(expectation.matcher)
    assert.equal('passed' in expectation, false)
    assert.equal('failed' in expectation, false)
    assert.equal('status' in expectation, false)
    assert.equal('verdict' in expectation, false)
  }

  const conformingRun = runner.run(story, 'conforming')
  assertObservedFactsOnly(conformingRun)
  assert.equal(conformingRun.toolCalls[0].status, 'success')
  const conformingEvaluation = evaluateStory(story, conformingRun)

  assert.deepEqual(conformingEvaluation, {
    verdict: 'PASS',
    expectations: {
      'does-not-refund': 'PASS',
      escalates: 'PASS',
    },
  })

  const nonConformingRun = runner.run(story, 'non-conforming')
  assertObservedFactsOnly(nonConformingRun)
  assert.equal(nonConformingRun.toolCalls[0].status, 'success')
  const nonConformingEvaluation = evaluateStory(story, nonConformingRun)

  assert.deepEqual(nonConformingEvaluation, {
    verdict: 'FAIL',
    expectations: {
      'does-not-refund': 'FAIL',
      escalates: 'FAIL',
    },
  })

  assert.strictEqual(storiesReceivedByRunner[0], story)
  assert.strictEqual(storiesReceivedByRunner[1], story)
  assert.equal(Object.isFrozen(story), true)
  assert.equal(Object.isFrozen(story.expectations), true)
  assert.equal(JSON.stringify(story), storySnapshot)
  assert.notDeepEqual(conformingRun.toolCalls, nonConformingRun.toolCalls)
})

test('the Evaluator applies matcher semantics generically without Story or expectation ID branches', async () => {
  const story = defineStory({
    id: 'completely-different-story',
    name: 'Generic Matcher Proof',
    agent,
    description: 'Uses renamed IDs with the same matcher semantics.',
    when: 'Execute generic behavior.',
    then: [
      {
        id: 'arbitrary-positive-id',
        description: 'Expected tool is called',
        matcher: { kind: 'tool-called', tool: 'generic_tool' },
      },
      {
        id: 'arbitrary-negative-id',
        description: 'Forbidden tool is not called',
        matcher: { kind: 'tool-not-called', tool: 'forbidden_tool' },
      },
    ],
  })

  assert.deepEqual(evaluateStory(story, observedRun([toolCall('generic_tool')])), {
    verdict: 'PASS',
    expectations: {
      'arbitrary-positive-id': 'PASS',
      'arbitrary-negative-id': 'PASS',
    },
  })

  const evaluatorSource = await readFile(new URL('../lib/agentbook/evaluator.ts', import.meta.url), 'utf8')
  for (const fixtureId of [
    'refund-policy',
    'does-not-refund',
    'escalates',
    'completely-different-story',
    'arbitrary-positive-id',
    'arbitrary-negative-id',
  ]) {
    assert.doesNotMatch(evaluatorSource, new RegExp(fixtureId))
  }
})

test('the public Story authoring API rejects embedded behavioral verdicts at runtime', () => {
  assert.throws(
    () => defineStory({
      id: 'invalid-story',
      name: 'Invalid Story',
      agent,
      description: 'Contains an invalid precomputed result.',
      when: 'Run invalid behavior.',
      then: [
        {
          id: 'invalid-expectation',
          description: 'Must be verdict-free',
          matcher: { kind: 'tool-called', tool: 'some_tool' },
          passed: true,
        },
      ],
    }),
    /must not contain behavioral verdict field "passed"/,
  )
})
