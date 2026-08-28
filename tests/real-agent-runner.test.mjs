import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  controlledRefundToolNames,
  createControlledRefundToolSandbox,
} from '../lib/agentbook/controlled-refund-tools.ts'
import { realAgentRefundStory } from './fixtures/real-agent-refund-story.mjs'

test('Test 03 fixture and controlled boundary remain offline and verdict-free', async () => {
  assert.deepEqual(Object.keys(realAgentRefundStory).sort(), [
    '__agentbookType',
    'agent',
    'description',
    'expectations',
    'given',
    'id',
    'name',
    'prompt',
  ])

  for (const expectation of realAgentRefundStory.expectations) {
    assert.deepEqual(Object.keys(expectation).sort(), ['description', 'id', 'matcher'])
  }

  const sandbox = createControlledRefundToolSandbox()
  assert.deepEqual(Object.keys(sandbox.tools), [...controlledRefundToolNames])
  assert.deepEqual(sandbox.getTrace(), [])

  const runnerSource = await readFile(
    new URL('../lib/agentbook/real-agent-runner.ts', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(runnerSource, /evaluateStory|EvaluationResult/)
})
