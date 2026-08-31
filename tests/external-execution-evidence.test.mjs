import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { defineExecutionProfile } from '../packages/agentbook/dist/index.js'
import {
  ExternalEvidenceValidationError,
  normalizeExternalExecutionEvidence,
} from '../packages/cli/dist/external-evidence.js'
import { TypeScriptAdapter } from '../packages/cli/dist/typescript-adapter.js'
import {
  describeNormalizedPromptShape,
  extractNormalizedUserText,
  translateAiSdkExecutionEvidence,
} from './fixtures/github-tools-agent/ai-sdk-evidence.mjs'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

const completeEvidence = () => ({
  source: 'test-framework',
  toolCalls: [{
    callId: 'call-1',
    name: 'read_resource',
    input: { resource: 'alpha' },
    status: 'success',
    output: { value: 42 },
    sequence: 0,
    step: 0,
    startedAt: '2026-08-29T00:00:00.000Z',
    endedAt: '2026-08-29T00:00:00.012Z',
    durationMs: 12,
  }],
  provider: 'test-provider',
  model: 'test-model',
  startedAt: '2026-08-29T00:00:00.000Z',
  endedAt: '2026-08-29T00:00:00.020Z',
  latencyMs: 20,
  finishReason: 'stop',
  tokenUsage: { inputTokens: 7, totalTokens: 9 },
})

test('extracts Story WHEN exactly from the normalized AI SDK V4 user text part', () => {
  const storyPrompt = 'Read the configured source exactly.'
  const normalizedPrompt = [
    { role: 'system', content: 'Framework-owned system instructions.' },
    { role: 'user', content: [{ type: 'text', text: storyPrompt }] },
  ]
  assert.equal(extractNormalizedUserText(normalizedPrompt), storyPrompt)
  assert.deepEqual(describeNormalizedPromptShape(normalizedPrompt), {
    kind: 'messages',
    messageCount: 2,
    messages: [
      { messageIndex: 0, role: 'system', content: { kind: 'text', length: 36 } },
      {
        messageIndex: 1,
        role: 'user',
        content: { kind: 'parts', partCount: 1, parts: [{ partIndex: 0, type: 'text', textLength: 35 }] },
      },
    ],
  })
  assert.throws(
    () => extractNormalizedUserText([{ role: 'system', content: storyPrompt }]),
    /exactly one user message/,
  )
  assert.throws(
    () => extractNormalizedUserText([{ role: 'user', content: [{ type: 'text', text: storyPrompt }, { type: 'text', text: '' }] }]),
    /exactly one text part/,
  )
})

test('normalizes complete framework-neutral evidence without changing observed facts', () => {
  const normalized = normalizeExternalExecutionEvidence(completeEvidence())
  assert.deepEqual(normalized.toolCalls, [{
    callId: 'call-1',
    name: 'read_resource',
    input: '{"resource":"alpha"}',
    status: 'success',
    output: '{"value":42}',
    duration: '12ms',
    startedAt: '2026-08-29T00:00:00.000Z',
    endedAt: '2026-08-29T00:00:00.012Z',
  }])
  assert.deepEqual(normalized.timeline, [{
    label: 'Tool completed: read_resource',
    detail: 'Operational status: success',
    duration: '12ms',
  }])
  assert.deepEqual(normalized.evidence, {
    provider: 'test-provider',
    model: 'test-model',
    startedAt: '2026-08-29T00:00:00.000Z',
    endedAt: '2026-08-29T00:00:00.020Z',
    latencyMs: 20,
    finishReason: 'stop',
    tokenUsage: { availability: 'available', inputTokens: 7, totalTokens: 9 },
  })
})

test('preserves honest unavailability and an empty external trace', () => {
  const empty = normalizeExternalExecutionEvidence({ source: 'test-framework', toolCalls: [] })
  assert.deepEqual(empty, {
    toolCalls: [],
    timeline: [],
    evidence: { tokenUsage: { availability: 'unavailable' } },
  })

  const missing = normalizeExternalExecutionEvidence({
    source: 'test-framework',
    toolCalls: [{ callId: 'call-1', name: 'read_resource', input: {}, status: 'success', sequence: 0 }],
    tokenUsage: {},
  })
  assert.deepEqual(missing.toolCalls[0], {
    callId: 'call-1',
    name: 'read_resource',
    input: '{}',
    status: 'success',
  })
  assert.equal('duration' in missing.toolCalls[0], false)
  assert.equal('output' in missing.toolCalls[0], false)
  assert.deepEqual(missing.timeline[0], {
    label: 'Tool completed: read_resource',
    detail: 'Operational status: success',
  })
  assert.deepEqual(missing.evidence, { tokenUsage: { availability: 'unavailable' } })
})

test('normalizes available partial usage and never invents zero counts', () => {
  const normalized = normalizeExternalExecutionEvidence({
    source: 'test-framework',
    toolCalls: [],
    tokenUsage: { reasoningTokens: 3 },
  })
  assert.deepEqual(normalized.evidence.tokenUsage, { availability: 'available', reasoningTokens: 3 })
  assert.equal('inputTokens' in normalized.evidence.tokenUsage, false)
})

test('preserves error calls separately from successful output', () => {
  const withDetail = normalizeExternalExecutionEvidence({
    source: 'test-framework',
    toolCalls: [{
      callId: 'error-1',
      name: 'read_resource',
      input: {},
      status: 'error',
      error: { name: 'ReadError', message: 'The resource was unavailable.' },
      sequence: 0,
    }],
  })
  assert.deepEqual(withDetail.toolCalls[0], {
    callId: 'error-1',
    name: 'read_resource',
    input: '{}',
    status: 'error',
    error: { name: 'ReadError', message: 'The resource was unavailable.' },
  })
  assert.equal('output' in withDetail.toolCalls[0], false)

  const withoutDetail = normalizeExternalExecutionEvidence({
    source: 'test-framework',
    toolCalls: [{ callId: 'error-2', name: 'read_resource', input: {}, status: 'error', sequence: 0 }],
  })
  assert.equal('error' in withoutDetail.toolCalls[0], false)
  assert.equal('output' in withoutDetail.toolCalls[0], false)
})

test('accepts multi-step and parallel evidence while preserving observed sequence', () => {
  const normalized = normalizeExternalExecutionEvidence({
    source: 'test-framework',
    toolCalls: [
      { callId: 'parallel-a', name: 'read_a', input: {}, status: 'success', sequence: 0, step: 0 },
      { callId: 'parallel-b', name: 'read_b', input: {}, status: 'success', sequence: 1, step: 0 },
      { callId: 'later', name: 'read_later', input: {}, status: 'success', sequence: 2, step: 1 },
    ],
  })
  assert.deepEqual(normalized.toolCalls.map((call) => call.callId), ['parallel-a', 'parallel-b', 'later'])
})

test('rejects duplicate call IDs, invalid sequences, evaluation fields, and invalid values', () => {
  const invalidCases = [
    {
      label: 'duplicate call id',
      evidence: {
        source: 'test',
        toolCalls: [
          { callId: 'same', name: 'a', input: {}, status: 'success', sequence: 0 },
          { callId: 'same', name: 'b', input: {}, status: 'success', sequence: 1 },
        ],
      },
    },
    {
      label: 'duplicate sequence',
      evidence: {
        source: 'test',
        toolCalls: [
          { callId: 'a', name: 'a', input: {}, status: 'success', sequence: 0 },
          { callId: 'b', name: 'b', input: {}, status: 'success', sequence: 0 },
        ],
      },
    },
    { label: 'evaluation field', evidence: { source: 'test', toolCalls: [], verdict: 'PASS' } },
    {
      label: 'non-finite value',
      evidence: { source: 'test', toolCalls: [{ callId: 'a', name: 'a', input: { value: Number.NaN }, status: 'success', sequence: 0 }] },
    },
    {
      label: 'undefined value',
      evidence: { source: 'test', toolCalls: [{ callId: 'a', name: 'a', input: { value: undefined }, status: 'success', sequence: 0 }] },
    },
    {
      label: 'error represented as output',
      evidence: { source: 'test', toolCalls: [{ callId: 'a', name: 'a', input: {}, status: 'error', output: { error: true }, sequence: 0 }] },
    },
  ]
  const cyclic = {}
  cyclic.self = cyclic
  invalidCases.push({
    label: 'cyclic value',
    evidence: { source: 'test', toolCalls: [{ callId: 'a', name: 'a', input: cyclic, status: 'success', sequence: 0 }] },
  })

  for (const { label, evidence } of invalidCases) {
    assert.throws(
      () => normalizeExternalExecutionEvidence(evidence),
      ExternalEvidenceValidationError,
      label,
    )
  }
})

test('AI SDK translator rejects unmatched results and correlates by toolCallId', () => {
  const nativeCall = { type: 'tool-call', toolCallId: 'native-1', toolName: 'read_resource', input: { id: 1 } }
  const nativeResult = { type: 'tool-result', toolCallId: 'native-1', toolName: 'read_resource', input: { id: 1 }, output: { ok: true } }
  const translated = translateAiSdkExecutionEvidence({
    result: {
      steps: [{ toolCalls: [nativeCall], toolResults: [nativeResult] }],
      finishReason: 'stop',
      usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 },
    },
    starts: [{ toolCall: nativeCall }],
    ends: [{ toolCall: nativeCall, toolOutput: nativeResult, toolExecutionMs: 4 }],
    provider: 'mock-provider',
    model: 'mock-model',
  })
  assert.deepEqual(translated.toolCalls, [{
    callId: 'native-1',
    name: 'read_resource',
    input: { id: 1 },
    sequence: 0,
    step: 0,
    durationMs: 4,
    status: 'success',
    output: { ok: true },
  }])

  assert.throws(() => translateAiSdkExecutionEvidence({
    result: { steps: [{ toolCalls: [], toolResults: [nativeResult] }] },
    starts: [],
    ends: [],
  }), /unmatched tool result native-1/)
})

async function writeConflictProject(root) {
  await Promise.all(['agents', 'stories', 'execution'].map((directory) => mkdir(path.join(root, directory))))
  await writeFile(path.join(root, 'package.json'), '{"name":"test09-conflict","private":true,"type":"module"}\n')
  await writeFile(path.join(root, 'ethogram.config.mjs'), 'export default {}\n')
  await writeFile(path.join(root, 'agents/conflict.agent.ts'), `import { defineAgent } from '@ethogram/core'
export const agent = defineAgent({ id: 'conflict-agent', name: 'Conflict Agent', description: 'Conflict test.', icon: 'target' })
`)
  await writeFile(path.join(root, 'stories/conflict.agent.stories.ts'), `import { defineStory } from '@ethogram/core'
import { agent } from '../agents/conflict.agent.ts'
export const story = defineStory({ id: 'conflict-story', name: 'Conflict Story', agent, description: 'Conflict test.', given: [], when: 'Run.', expectations: [{ id: 'calls-local-tool', description: 'Calls the local tool', matcher: { kind: 'tool-called', tool: 'local_tool' } }], execution: { kind: 'external-profile', profile: 'conflict-profile' } })
`)
  await writeFile(path.join(root, 'execution/conflict.profile.ts'), `import { defineExecutionProfile } from '@ethogram/core'
export const profile = defineExecutionProfile({
  id: 'conflict-profile',
  tools: { local_tool: { description: 'Local tool.', async execute() { return { ok: true } } } },
  async execute({ callTool }) {
    await callTool('local_tool', {})
    return { decision: 'Conflict', finalResponse: 'Conflict', evidence: { source: 'external', toolCalls: [] } }
  },
})
`)
}

test('allows tools: {} and rejects mixed intercepted/external observation explicitly', async () => {
  const emptyProfile = defineExecutionProfile({
    id: 'framework-owned',
    tools: {},
    async execute() {
      return { decision: 'Done', finalResponse: 'Done', evidence: { source: 'framework', toolCalls: [] } }
    },
  })
  assert.deepEqual(emptyProfile.tools, {})

  const root = await mkdtemp(path.join(repositoryRoot, '.test09-conflict-'))
  try {
    await writeConflictProject(root)
    const adapter = new TypeScriptAdapter()
    const project = await adapter.loadProject(root)
    await assert.rejects(
      () => adapter.run({ story: project.stories[0] }),
      (error) => error?.code === 'CONFLICTING_OBSERVATION_SOURCES'
        && error.message.includes('CONFLICTING_OBSERVATION_SOURCES'),
    )
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('existing intercepted records remain complete and UI handles unavailable facts generically', async () => {
  const adapterSource = await readFile(path.join(repositoryRoot, 'packages/cli/src/typescript-adapter.ts'), 'utf8')
  assert.match(adapterSource, /provider: 'local-typescript-adapter'/)
  assert.match(adapterSource, /model: 'offline-deterministic-profile'/)
  assert.match(adapterSource, /duration: `\$\{invocation\.durationMs\}ms`/)

  const uiSource = await readFile(path.join(repositoryRoot, 'packages/cli/src/runtime/app.js'), 'utf8')
  assert.match(uiSource, /availableText/)
  assert.match(uiSource, /'Unavailable'/)
  assert.match(uiSource, /call\.status === 'error' \? 'ERROR' : 'OUTPUT'/)
  assert.doesNotMatch(uiSource, /INTERCEPTED|EXTERNAL|vercel-ai-sdk|ToolLoopAgent|GenerateTextResult/)

  const coreDeclaration = await readFile(path.join(repositoryRoot, 'packages/agentbook/dist/index.d.ts'), 'utf8')
  assert.match(coreDeclaration, /ExternalExecutionEvidenceValue/)
  assert.match(coreDeclaration, /ExternalToolCallEvidence/)
  assert.match(coreDeclaration, /ExternalExecutionEvidence/)
  assert.doesNotMatch(coreDeclaration, /export type ObservedRun|export type EvaluationResult|ToolLoopAgent|GenerateTextResult|StepResult/)

  const canonicalContract = await readFile(path.join(repositoryRoot, 'packages/cli/src/contracts.ts'), 'utf8')
  assert.doesNotMatch(canonicalContract, /ToolLoopAgent|GenerateTextResult|StepResult|Vercel|AI SDK/)
})
