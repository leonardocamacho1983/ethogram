import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { EthogramEngine } from '../packages/cli/dist/generic-engine.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

function alternateLanguageProject() {
  const agent = {
    id: 'alternate-agent',
    name: 'Alternate Language Agent',
    description: 'A canonical descriptor from a non-TypeScript test adapter.',
    icon: 'target',
  }
  return {
    projectRoot: '/virtual/alternate-project',
    name: 'alternate-language-project',
    adapter: { id: 'alternate-test', label: 'Alternate Test' },
    agents: [agent],
    stories: [{
      id: 'alternate-story',
      name: 'Alternate Adapter Story',
      agent,
      description: 'Exercises the language-neutral Runner boundary.',
      given: ['sourceLanguage: alternate'],
      prompt: 'Run the alternate behavior.',
      expectations: [
        { id: 'calls-tool', description: 'Calls the canonical tool', matcher: { kind: 'tool-called', tool: 'canonical_tool' } },
        { id: 'avoids-tool', description: 'Avoids the prohibited tool', matcher: { kind: 'tool-not-called', tool: 'prohibited_tool' } },
      ],
      source: 'stories/alternate.story',
      executable: true,
    }],
  }
}

test('generic engine evaluates canonical ObservedRun from a substitutable adapter', async () => {
  let receivedRequest
  const adapter = {
    id: 'alternate-test',
    async loadProject() {
      return alternateLanguageProject()
    },
    async run(request) {
      receivedRequest = request
      return {
        decision: 'Canonical decision',
        reason: 'Produced behind an alternate adapter boundary.',
        finalResponse: 'Produced behind an alternate adapter boundary.',
        toolCalls: [{
          callId: 'alternate-1',
          name: 'canonical_tool',
          status: 'success',
          duration: '1ms',
          input: '{}',
          output: '{"ok":true}',
          startedAt: '2026-08-29T00:00:00.000Z',
          endedAt: '2026-08-29T00:00:00.001Z',
        }],
        timeline: [{ label: 'Tool completed: canonical_tool', detail: 'Operational status: success', duration: '1ms' }],
        evidence: {
          provider: 'alternate-adapter',
          model: 'alternate-runtime',
          startedAt: '2026-08-29T00:00:00.000Z',
          endedAt: '2026-08-29T00:00:00.001Z',
          latencyMs: 1,
          finishReason: 'completed',
          tokenUsage: { availability: 'unavailable' },
        },
      }
    },
  }

  const engine = new EthogramEngine(adapter)
  const project = await engine.loadProject('/ignored-by-test-adapter')
  const result = await engine.runStory('alternate-story')

  assert.equal(project.adapter.id, 'alternate-test')
  assert.equal(receivedRequest.story.id, 'alternate-story')
  assert.equal(result.execution.evaluationResult.verdict, 'PASS')
  assert.deepEqual(result.execution.evaluationResult.expectations, {
    'calls-tool': 'PASS',
    'avoids-tool': 'PASS',
  })
  assert.equal(result.execution.observedRun.toolCalls[0].name, 'canonical_tool')
  assert.equal(result.boundaryEvidence.adapter, 'alternate-test')
})

test('generic engine, evaluator, and UI do not import or execute TypeScript-native modules', async () => {
  const genericFiles = [
    'packages/cli/src/generic-engine.ts',
    'packages/cli/src/evaluator.ts',
    'packages/cli/src/runtime/app.js',
  ]
  const nativeAssumptions = [
    /from ['"].*typescript-adapter/,
    /from ['"]esbuild['"]/,
    /\.profile\.(?:ts|js)/,
    /\.agent\.stories\.(?:ts|js)/,
    /profile\.execute/,
    /tool\.execute/,
  ]

  for (const file of genericFiles) {
    const source = await readFile(path.join(repositoryRoot, file), 'utf8')
    for (const pattern of nativeAssumptions) {
      assert.doesNotMatch(source, pattern, `${file} contains language-native execution knowledge`)
    }
  }

  const adapterSource = await readFile(path.join(repositoryRoot, 'packages/cli/src/typescript-adapter.ts'), 'utf8')
  assert.match(adapterSource, /from 'esbuild'/)
  assert.match(adapterSource, /binding\.profile\.execute/)
  assert.match(adapterSource, /tool\.execute/)
  assert.doesNotMatch(adapterSource, /evaluateStory|EvaluationResult/)

  const contractSource = await readFile(path.join(repositoryRoot, 'packages/cli/src/contracts.ts'), 'utf8')
  assert.match(contractSource, /provider\?: string/)
  assert.match(contractSource, /model\?: string/)
  assert.match(contractSource, /tokenUsage: ObservedTokenUsage/)
  assert.doesNotMatch(contractSource, /provider: 'local-typescript-adapter'|model: 'offline-deterministic-profile'/)
})
