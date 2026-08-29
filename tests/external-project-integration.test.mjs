import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { evaluateStory } from '../lib/agentbook/evaluator.ts'
import {
  ExternalProjectLoadError,
  loadAgentbookProject,
} from '../lib/agentbook/external-project-loader.server.ts'
import { ExternalProjectRunner } from '../lib/agentbook/external-project-runner.ts'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const externalProjectRoot = fileURLToPath(new URL('./fixtures/external-agent-project', import.meta.url))
const fixtureFiles = [
  'agents/travel-approval.agent.ts',
  'stories/international-trip.agent.stories.ts',
  'execution/travel-approval-profile.ts',
  'tools/travel-tools.ts',
]

function canonical(value) {
  return JSON.stringify(value)
}

function assertObservedRunIsVerdictFree(value, location = 'observedRun') {
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    assert.equal(
      ['verdict', 'passed', 'failed', 'expectations', 'evaluationResult', 'score'].includes(key),
      false,
      `${location}.${key} must not contain behavioral verdict data`,
    )
    if (key === 'status') assert.match(location, /^observedRun\.toolCalls\.\d+$/)
    assertObservedRunIsVerdictFree(nested, `${location}.${key}`)
  }
}

async function createTemporaryProject(files) {
  const root = await mkdtemp(path.join(tmpdir(), 'agentbook-external-project-'))
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name: 'temporary-external-project', type: 'module' }))
  await Promise.all(Object.entries(files).map(async ([relativePath, source]) => {
    const destination = path.join(root, relativePath)
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, source)
  }))
  return root
}

async function assertLoadError(projectRoot, code) {
  await assert.rejects(
    () => loadAgentbookProject(projectRoot),
    (error) => error instanceof ExternalProjectLoadError && error.code === code,
  )
}

test('Test 05 loads an isolated consumer project through the public boundary', async () => {
  const project = await loadAgentbookProject(externalProjectRoot)

  assert.equal(project.projectRoot, externalProjectRoot)
  assert.equal(project.packageName, 'external-agent-project-fixture')
  assert.deepEqual(project.agents.map(({ id }) => id), ['travel-approval-agent'])
  assert.deepEqual(project.stories.map(({ id }) => id), ['international-trip-requires-approval'])
  assert.deepEqual(project.executionProfiles.map(({ id }) => id), ['controlled-travel-approval'])
  assert.deepEqual(project.stories[0].agent, project.agents[0])
  assert.equal(project.sources.agents['travel-approval-agent'], 'agents/travel-approval.agent.ts')
  assert.equal(project.sources.stories['international-trip-requires-approval'], 'stories/international-trip.agent.stories.ts')
  assert.equal(project.sources.executionProfiles['controlled-travel-approval'], 'execution/travel-approval-profile.ts')

  const imports = []
  for (const fixtureFile of fixtureFiles) {
    const source = await readFile(path.join(externalProjectRoot, fixtureFile), 'utf8')
    for (const match of source.matchAll(/from ['"]([^'"]+)['"]/g)) {
      imports.push({ file: fixtureFile, specifier: match[1] })
    }
  }
  assert.deepEqual(imports, [
    { file: 'agents/travel-approval.agent.ts', specifier: '@agentbook/core' },
    { file: 'stories/international-trip.agent.stories.ts', specifier: '@agentbook/core' },
    { file: 'stories/international-trip.agent.stories.ts', specifier: '../agents/travel-approval.agent.ts' },
    { file: 'execution/travel-approval-profile.ts', specifier: '@agentbook/core' },
    { file: 'execution/travel-approval-profile.ts', specifier: '../tools/travel-tools.ts' },
    { file: 'tools/travel-tools.ts', specifier: '@agentbook/core' },
  ])
  for (const { specifier } of imports) {
    assert.equal(specifier === '@agentbook/core' || specifier.startsWith('../'), true)
    assert.doesNotMatch(specifier, /app\/|generated-story-registry|demo\.agent|tests\/0[1-4]|real-agent-runner|evaluator/)
  }
})

test('Test 05 invokes fixture-owned handlers and constructs ObservedRun from the trace', async () => {
  const project = await loadAgentbookProject(externalProjectRoot)
  const story = project.stories[0]
  const storySnapshot = canonical(story)
  const profile = project.executionProfiles[0]
  const runner = new ExternalProjectRunner(profile)

  assert.deepEqual(runner.availableToolNames, [
    'lookup_trip_policy',
    'estimate_trip_cost',
    'request_trip_approval',
    'book_trip',
  ])

  const observedRun = await runner.run(story, undefined)
  const trace = runner.getTrace()
  assert.strictEqual(runner.lastReceivedStory, story)
  assert.deepEqual(trace.map(({ order, name }) => ({ order, name })), [
    { order: 1, name: 'lookup_trip_policy' },
    { order: 2, name: 'estimate_trip_cost' },
    { order: 3, name: 'request_trip_approval' },
  ])
  assert.equal(trace.some(({ name }) => name === 'book_trip'), false)
  assert.deepEqual(trace[0].input, { internationalTravel: true, automaticApprovalLimit: 2500 })
  assert.deepEqual(trace[0].output, {
    internationalTravel: true,
    automaticApprovalLimit: 2500,
    approvalRequiredForInternationalTravel: true,
  })
  assert.deepEqual(trace[1].input, { destination: 'Paris', estimatedCost: 4200 })
  assert.deepEqual(trace[1].output, { destination: 'Paris', estimatedCost: 4200, currency: 'USD' })
  assert.deepEqual(trace[2].input, { destination: 'Paris', estimatedCost: 4200 })
  assert.deepEqual(trace[2].output, {
    approvalRequestId: 'LOCAL-TRIP-APPROVAL-001',
    destination: 'Paris',
    estimatedCost: 4200,
    status: 'pending-local-approval',
    externalSideEffect: false,
  })

  assert.deepEqual(
    observedRun.toolCalls.map((call, index) => ({
      order: index + 1,
      callId: call.callId,
      name: call.name,
      input: JSON.parse(call.input),
      output: JSON.parse(call.output),
      status: call.status,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      durationMs: Number(call.duration.replace('ms', '')),
    })),
    trace,
  )
  assertObservedRunIsVerdictFree(observedRun)
  assert.equal(canonical(story), storySnapshot)

  const evaluationResult = evaluateStory(story, observedRun)
  assert.deepEqual(evaluationResult, {
    verdict: 'PASS',
    expectations: {
      'checks-trip-policy': 'PASS',
      'estimates-trip-cost': 'PASS',
      'does-not-book-directly': 'PASS',
      'requests-approval': 'PASS',
    },
  })
})

test('Test 05 loader reports missing, invalid, invalid-export, and duplicate identities explicitly', async () => {
  await assertLoadError('', 'MISSING_PROJECT_ROOT')
  await assertLoadError(path.join(tmpdir(), 'agentbook-project-that-does-not-exist'), 'INVALID_PROJECT_ROOT')

  const invalidStoryRoot = await createTemporaryProject({
    'agents/valid.agent.mjs': `export const agent = { id: 'valid-agent', name: 'Valid Agent', description: 'Valid', icon: 'target' }`,
    'stories/invalid.agent.stories.mjs': `export const invalid = { id: 'not-a-story' }`,
  })
  await assertLoadError(invalidStoryRoot, 'INVALID_STORY_EXPORT')

  const duplicateAgentRoot = await createTemporaryProject({
    'agents/first.agent.mjs': `export const agent = { id: 'duplicate-agent', name: 'First', description: 'First', icon: 'target' }`,
    'agents/second.agent.mjs': `export const agent = { id: 'duplicate-agent', name: 'Second', description: 'Second', icon: 'target' }`,
  })
  await assertLoadError(duplicateAgentRoot, 'DUPLICATE_AGENT_ID')

  const duplicateStoryRoot = await createTemporaryProject({
    'agents/valid.agent.mjs': `export const agent = { id: 'valid-agent', name: 'Valid Agent', description: 'Valid', icon: 'target' }`,
    'stories/first.agent.stories.mjs': `export const story = { __agentbookType: 'story', id: 'duplicate-story', name: 'First', agent: { id: 'valid-agent', name: 'Valid Agent', description: 'Valid', icon: 'target' }, description: 'First', given: [], prompt: 'Run', expectations: [] }`,
    'stories/second.agent.stories.mjs': `export const story = { __agentbookType: 'story', id: 'duplicate-story', name: 'Second', agent: { id: 'valid-agent', name: 'Valid Agent', description: 'Valid', icon: 'target' }, description: 'Second', given: [], prompt: 'Run', expectations: [] }`,
  })
  await assertLoadError(duplicateStoryRoot, 'DUPLICATE_STORY_ID')
})

test('Test 05 generic boundaries load and execute a replacement domain unchanged', async () => {
  const replacementRoot = await createTemporaryProject({
    'agents/warehouse.agent.mjs': `export const agent = { id: 'warehouse-agent', name: 'Warehouse Agent', description: 'Records inventory', icon: 'search' }`,
    'stories/inventory.agent.stories.mjs': `export const story = { __agentbookType: 'story', id: 'record-inventory', name: 'Record Inventory', agent: { id: 'warehouse-agent', name: 'Warehouse Agent', description: 'Records inventory', icon: 'search' }, description: 'Records a received item', given: ['sku: W-1'], prompt: 'Record this item.', expectations: [{ id: 'records-item', description: 'Records inventory', matcher: { kind: 'tool-called', tool: 'record_inventory' } }], execution: { kind: 'external-profile', profile: 'warehouse-profile' } }`,
    'execution/warehouse.profile.mjs': `export const profile = { __agentbookType: 'execution-profile', id: 'warehouse-profile', tools: { record_inventory: { description: 'Record inventory', execute: async (input) => ({ ...input, recorded: true }) } }, execute: async ({ callTool }) => { await callTool('record_inventory', { sku: 'W-1' }); return { decision: 'Record inventory', finalResponse: 'Inventory recorded.' } } }`,
  })

  const project = await loadAgentbookProject(replacementRoot)
  const runner = new ExternalProjectRunner(project.executionProfiles[0])
  const observedRun = await runner.run(project.stories[0], undefined)
  const evaluationResult = evaluateStory(project.stories[0], observedRun)

  assert.deepEqual(project.agents.map(({ id }) => id), ['warehouse-agent'])
  assert.deepEqual(observedRun.toolCalls.map(({ name }) => name), ['record_inventory'])
  assert.equal(evaluationResult.verdict, 'PASS')
})

test('Test 05 application plumbing is generic and contains no fixture-specific knowledge', async () => {
  const genericFiles = [
    'app/page.tsx',
    'app/actions/load-agentbook-project.ts',
    'app/actions/run-external-story.ts',
    'lib/agentbook/external-execution.ts',
    'lib/agentbook/external-project-loader.server.ts',
    'lib/agentbook/external-project-runner.ts',
    'lib/agentbook/evaluator.ts',
    'lib/agentbook/generated-story-registry.ts',
  ]
  const forbiddenFixtureKnowledge = /Travel Approval|International Trip|travel-approval-agent|international-trip-requires-approval|external-agent-project|lookup_trip_policy|estimate_trip_cost|request_trip_approval|book_trip/

  for (const file of genericFiles) {
    const source = await readFile(path.join(repositoryRoot, file), 'utf8')
    assert.doesNotMatch(source, forbiddenFixtureKnowledge, `${file} contains fixture-specific logic`)
  }

  const pageSource = await readFile(path.join(repositoryRoot, 'app/page.tsx'), 'utf8')
  assert.match(pageSource, /loadConfiguredAgentbookProject/)
  assert.match(pageSource, /story\.execution\?\.kind === 'external-profile'/)
  assert.match(pageSource, /runExternalStory\(\{ agentId: story\.agent\.id, storyId: story\.id \}\)/)
  assert.doesNotMatch(pageSource, /tests\/fixtures/)

  const runnerSource = await readFile(path.join(repositoryRoot, 'lib/agentbook/external-project-runner.ts'), 'utf8')
  assert.doesNotMatch(runnerSource, /evaluateStory|EvaluationResult/)
})
