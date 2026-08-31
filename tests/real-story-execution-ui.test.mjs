import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { executionMetrics, observableTimeline } from '../lib/agentbook/execution-record.ts'

const actionSourceUrl = new URL('../app/actions/run-real-story.ts', import.meta.url)
const pageSourceUrl = new URL('../app/app/app-client.tsx', import.meta.url)
const profileSourceUrl = new URL('../lib/agentbook/real-agent-profile.server.ts', import.meta.url)

function fixtureRun() {
  return {
    decision: 'Model response completed',
    reason: 'Completed',
    finalResponse: 'Escalated for approval.',
    timeline: [],
    toolCalls: [
      { name: 'lookup_order', status: 'success', duration: '2ms', input: '{"order_id":"#10482"}', output: '{"found":true}' },
      { name: 'escalate_refund', status: 'success', duration: '1ms', input: '{"order_id":"#10482"}', output: '{"status":"pending"}' },
    ],
    evidence: {
      provider: 'vercel-ai-gateway',
      model: 'openai/gpt-5.4-mini',
      startedAt: '2026-08-28T10:00:00.000Z',
      endedAt: '2026-08-28T10:00:01.234Z',
      latencyMs: 1234,
      requestCount: 3,
      finishReason: 'stop',
      tokenUsage: { availability: 'available', inputTokens: 100, outputTokens: 20, totalTokens: 120 },
      warnings: [],
      randomness: { temperature: 0, mode: 'lowest-practical', realLlmRemainsNonDeterministic: true },
    },
  }
}

test('Test 04 declares the real UI capability without mock execution data in the Story', async () => {
  const [storySource, discoverySource] = await Promise.all([
    readFile(new URL('../stories/demo.agent.stories.ts', import.meta.url), 'utf8'),
    readFile(new URL('../lib/agentbook/discovery.ts', import.meta.url), 'utf8'),
  ])
  const realStoryBlock = storySource.match(/const refundRequiresApproval = defineStory\(\{([\s\S]*?)\n\}\)\n\nconst shippingDelay/)?.[1]
  assert.ok(realStoryBlock)
  assert.match(realStoryBlock, /execution: \{ kind: 'real-agent', profile: 'controlled-refund' \}/)
  for (const forbidden of ['result', 'tools', 'runs', 'simulation', 'comparison']) {
    assert.doesNotMatch(realStoryBlock, new RegExp(`\\b${forbidden}:`))
  }
  assert.doesNotMatch(realStoryBlock, /\b(passed|failed|verdict):/)
  assert.match(discoverySource, /function toDisplayStory/)
  assert.match(discoverySource, /story\.execution\?\.kind === 'real-agent'/)
  assert.match(discoverySource, /storyModuleFiles\[index\]/)
})

test('Test 04 keeps provider execution server-side and evaluation separate', async () => {
  const [actionSource, pageSource, profileSource] = await Promise.all([
    readFile(actionSourceUrl, 'utf8'),
    readFile(pageSourceUrl, 'utf8'),
    readFile(profileSourceUrl, 'utf8'),
  ])

  assert.match(actionSource, /^'use server'/)
  assert.match(actionSource, /discoverStoryDefinitions/)
  assert.match(actionSource, /runner\.run\(story, undefined\)/)
  assert.match(actionSource, /evaluateStory\(story, observedRun\)/)
  assert.equal(actionSource.indexOf('runner.run(story, undefined)') < actionSource.indexOf('evaluateStory(story, observedRun)'), true)
  assert.doesNotMatch(actionSource, /story\.id\s*===|candidate\.id\s*===\s*['"]refund/)
  assert.match(profileSource, /new RealAgentRunner/)
  assert.match(profileSource, /openai\/gpt-5\.4-mini/)

  assert.doesNotMatch(pageSource, /AI_GATEWAY_API_KEY|authorization|process\.env/)
  assert.doesNotMatch(pageSource, /new RealAgentRunner|ToolLoopAgent|evaluateMatcher/)
  assert.doesNotMatch(pageSource, /story\.id\s*===/)
  assert.match(pageSource, /runRealStory\(\{ agentId: story\.agent\.id, storyId: story\.id \}\)/)
  assert.match(pageSource, /if \(executingRef\.current\) return/)
  const selectionEffect = pageSource.match(/useEffect\(\(\) => \{([\s\S]*?)\}, \[initial, story\]\)/)?.[1] ?? ''
  assert.doesNotMatch(selectionEffect, /runRealStory/)
})

test('Test 04 UI selectors preserve one evidence source and explicit unavailable metrics', () => {
  const run = fixtureRun()
  const metrics = executionMetrics(run)
  assert.deepEqual(metrics, {
    latency: '1234ms',
    provider: 'vercel-ai-gateway',
    model: 'openai/gpt-5.4-mini',
    inputTokens: '100',
    outputTokens: '20',
    totalTokens: '120',
    toolCallCount: '2',
  })

  const timeline = observableTimeline(run)
  assert.deepEqual(
    timeline.filter((item) => item.kind === 'tool-completed').map((item) => item.toolCall.name),
    run.toolCalls.map((call) => call.name),
  )
  assert.equal(timeline.filter((item) => item.kind === 'tool-completed').length, run.toolCalls.length)
  assert.deepEqual(executionMetrics(), {
    latency: 'Unavailable',
    provider: 'Unavailable',
    model: 'Unavailable',
    inputTokens: 'Unavailable',
    outputTokens: 'Unavailable',
    totalTokens: 'Unavailable',
    toolCallCount: 'Unavailable',
  })
})

test('Test 04 UI renders verdicts from EvaluationResult and infrastructure errors separately', async () => {
  const pageSource = await readFile(pageSourceUrl, 'utf8')
  assert.match(pageSource, /record\?\.evaluationResult\.verdict/)
  assert.match(pageSource, /evaluation\?\.expectations\[expectation\.id\]/)
  assert.match(pageSource, /state\.execution\.observedRun\.toolCalls/)
  assert.match(pageSource, /STORY EVALUATION[\s\S]*NOT EVALUATED/)
  assert.match(pageSource, /execution-error/)
  assert.match(pageSource, /catch \{[\s\S]*REAL_AGENT_EXECUTION_FAILED/)
  assert.match(pageSource, /source: 'real'/)
  assert.match(pageSource, /source: 'prototype-mock'/)
  assert.match(pageSource, /data-testid="execution-evidence"/)
})
