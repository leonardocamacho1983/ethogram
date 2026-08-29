import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { defineAgent, defineStory } from '../packages/agentbook/dist/index.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

const agent = defineAgent({
  id: 'structured-given-agent',
  name: 'Structured Given Agent',
  description: 'Validates structured GIVEN authoring.',
  icon: 'target',
})

function storyWith(given) {
  return defineStory({
    id: 'structured-given-story',
    name: 'Structured Given Story',
    agent,
    description: 'Uses typed scenario context.',
    given,
    when: 'Run the scenario.',
    then: [{ id: 'calls-tool', description: 'Calls a tool', matcher: { kind: 'tool-called', tool: 'example_tool' } }],
  })
}

test('structured GIVEN preserves authored order and is immutable without a parallel scenario property', () => {
  const authored = {
    purchaseAmount: 500,
    requesterLevel: 'employee',
    approvalThreshold: 100,
    nested: { enabled: true, labels: ['one', 'two'] },
  }
  const story = storyWith(authored)

  assert.deepEqual(Object.keys(story.given), [
    'purchaseAmount',
    'requesterLevel',
    'approvalThreshold',
    'nested',
  ])
  assert.deepEqual(story.given, authored)
  assert.notEqual(story.given, authored)
  assert.equal(Object.isFrozen(story.given), true)
  assert.equal(Object.isFrozen(story.given.nested), true)
  assert.equal(Object.prototype.hasOwnProperty.call(story, 'scenario'), false)
  assert.throws(() => { story.given.purchaseAmount = 50 }, TypeError)
})

test('legacy GIVEN remains unchanged and omitted GIVEN still defaults to an empty list', () => {
  const legacy = ['requestedRole: admin', 'requesterRole: developer']
  const story = storyWith(legacy)
  assert.deepEqual(story.given, legacy)

  const omitted = defineStory({
    id: 'omitted-given',
    name: 'Omitted Given',
    agent,
    description: 'Defaults GIVEN.',
    when: 'Run.',
    then: [],
  })
  assert.deepEqual(omitted.given, [])
})

test('structured GIVEN rejects unsupported and non-serializable values', () => {
  const cyclic = {}
  cyclic.self = cyclic
  const invalidValues = [
    { invalid: () => true },
    { invalid: Symbol('value') },
    { invalid: undefined },
    { invalid: Number.NaN },
    { invalid: Number.POSITIVE_INFINITY },
    { invalid: cyclic },
    { invalid: new Date('2026-08-29T00:00:00.000Z') },
  ]

  for (const given of invalidValues) assert.throws(() => storyWith(given), /Story given/)
})

test('developer runtime preserves authored structured GIVEN key order for display', async () => {
  const runtimeSource = await readFile(path.join(repositoryRoot, 'packages', 'cli', 'src', 'runtime', 'app.js'), 'utf8')
  assert.match(runtimeSource, /Object\.entries\(story\.given\)/)
  assert.doesNotMatch(runtimeSource, /Object\.entries\(story\.given\)\.sort|givenEntries[\s\S]{0,300}\.sort/)
})
