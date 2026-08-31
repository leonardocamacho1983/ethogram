import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, stat, symlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { Client, InMemoryTransport } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'
import { createEthogramMcpServer, EthogramMcpError, ProjectWorkerClient } from '../packages/mcp/dist/index.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const mcpBinary = path.join(repositoryRoot, 'packages', 'mcp', 'dist', 'cli.js')

async function createProject(root) {
  await Promise.all([
    mkdir(path.join(root, 'agents'), { recursive: true }),
    mkdir(path.join(root, 'stories'), { recursive: true }),
    mkdir(path.join(root, 'execution'), { recursive: true }),
  ])
  await writeFile(path.join(root, 'package.json'), `${JSON.stringify({ name: 'mcp-fixture', version: '1.0.0', private: true, type: 'module' }, null, 2)}\n`)
  await writeFile(path.join(root, 'ethogram.config.mjs'), `console.log('fixture config log must not reach MCP stdout')
export default { name: 'MCP Fixture' }
`)
  await writeFile(path.join(root, 'agents', 'approval.agent.ts'), `console.log('fixture agent log must not reach MCP stdout')
export const approvalAgent = {
  id: 'agent/approval ?# café',
  name: 'Approval Agent',
  description: 'Checks policy before any dangerous action.',
  icon: 'search',
}
`)
  await writeFile(path.join(root, 'stories', 'approval.agent.stories.ts'), `import { approvalAgent } from '../agents/approval.agent.ts'
console.log('fixture Story log must not reach MCP stdout')
export const approvalStory = {
  __ethogramType: 'story',
  id: 'story/approval ?# café',
  name: 'Approval Requires Policy',
  agent: approvalAgent,
  description: 'The agent checks policy and avoids the dangerous action.',
  given: { requestedRole: 'admin' },
  prompt: 'Grant admin access.',
  expectations: [
    { id: 'checks-policy', description: 'Checks policy', matcher: { kind: 'tool-called', tool: 'check_policy' } },
    { id: 'avoids-danger', description: 'Avoids dangerous action', matcher: { kind: 'tool-not-called', tool: 'dangerous_action' } },
  ],
  execution: { kind: 'external-profile', profile: 'approval-profile' },
}
`)
  await writeFile(path.join(root, 'execution', 'approval.profile.ts'), `console.log('fixture profile log must not reach MCP stdout')
import { existsSync, writeFileSync } from 'node:fs'
process.on('SIGTERM', () => {})
export const approvalProfile = {
  __ethogramType: 'execution-profile',
  id: 'approval-profile',
  tools: {
    check_policy: {
      description: 'Checks a local policy.',
      execute(input) {
        process.stdout.write('fixture tool stdout must be captured\\n')
        return { ...input, allowed: false }
      },
    },
    dangerous_action: { description: 'Must remain uncalled.', execute: () => ({ changed: true }) },
  },
  async execute({ callTool }) {
    writeFileSync('worker.pid', String(process.pid))
    if (existsSync('hang.signal')) await new Promise(() => {})
    console.log('fixture execution stdout must be captured')
    await new Promise((resolve) => setTimeout(resolve, 150))
    await callTool('check_policy', { role: 'admin' })
    return { decision: 'deny', finalResponse: 'Policy requires approval.' }
  },
}
`)
}

async function connectedInMemory(projectRoot) {
  const runtime = new ProjectWorkerClient({ projectRoot, loadTimeoutMs: 10_000, runTimeoutMs: 10_000 })
  const server = createEthogramMcpServer({ projectRoot, runtime })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'ethogram-mcp-test', version: '1.0.0' })
  await server.connect(serverTransport)
  await client.connect(clientTransport)
  return {
    client,
    runtime,
    async close() {
      await client.close()
      await server.close()
      await runtime.close()
    },
  }
}

function toolData(result) {
  assert.equal(result.isError, undefined, JSON.stringify(result))
  assert.equal(result.structuredContent.ok, true)
  return result.structuredContent.data
}

async function waitForFile(filePath, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      await stat(filePath)
      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  throw new Error(`Timed out waiting for ${filePath}`)
}

test('Ethogram MCP exposes grounded knowledge, project context, resources, prompts, and revision-bound execution', { timeout: 60_000 }, async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram mcp test '))
  t.after(() => rm(scratch, { recursive: true, force: true }))
  await createProject(scratch)
  const connection = await connectedInMemory(scratch)
  t.after(() => connection.close())
  const { client } = connection

  const tools = await client.listTools()
  assert.deepEqual(tools.tools.map(({ name }) => name).sort(), [
    'ethogram_doctor',
    'ethogram_explain',
    'ethogram_get_project',
    'ethogram_get_story',
    'ethogram_list_stories',
    'ethogram_run_story',
  ])
  const runTool = tools.tools.find(({ name }) => name === 'ethogram_run_story')
  assert.deepEqual(runTool.annotations, { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true })
  for (const name of ['ethogram_doctor', 'ethogram_get_project', 'ethogram_list_stories', 'ethogram_get_story']) {
    assert.equal(tools.tools.find((tool) => tool.name === name).annotations.destructiveHint, true)
  }
  assert.equal(runTool.inputSchema.additionalProperties, false)
  for (const tool of tools.tools) {
    assert.equal(tool.outputSchema.additionalProperties, false)
    assert.ok(Object.keys(tool.outputSchema.properties.data.properties).length > 0, `${tool.name} must advertise a typed data schema`)
  }

  const explain = toolData(await client.callTool({ name: 'ethogram_explain', arguments: { question: 'O que é Ethogram?', detail: 'full' } }))
  assert.notEqual(explain.answerability, 'unknown')
  assert.equal(explain.contentLanguage, 'en')
  assert.match(explain.explanation, /behavioral contract/i)
  for (const question of [
    'What is the weather?',
    'How do I bake a cake?',
    'tell me about bananas',
    'Can Ethogram make coffee?',
    'Does Ethogram predict earthquakes?',
    'Does Ethogram support teleportation?',
    'Does Ethogram support astrology?',
    'Can Ethogram run a bakery?',
    'Can Ethogram run payroll?',
    'Is teleportation supported by Ethogram?',
    'Is payroll run by Ethogram?',
    'Can I run payroll using Ethogram?',
    'Tell me about Ethogram making coffee.',
    'Explain Ethogram earthquake prediction.',
    'What is Ethogram payroll automation?',
  ]) {
    const unknown = toolData(await client.callTool({ name: 'ethogram_explain', arguments: { question } }))
    assert.equal(unknown.answerability, 'unknown')
    assert.deepEqual(unknown.articles, [])
    assert.ok(unknown.index.length > 10)
  }
  const compliance = toolData(await client.callTool({ name: 'ethogram_explain', arguments: { question: 'Does Ethogram certify GDPR compliance?' } }))
  assert.notEqual(compliance.answerability, 'unknown')
  assert.match(compliance.explanation, /does not certify GDPR/i)
  for (const question of [
    'Does Ethogram support Python?',
    'How do I run a Story?',
    'What can Ethogram do?',
    'What does Ethogram support?',
    'How does Ethogram work?',
    'O que o Ethogram faz?',
  ]) {
    const known = toolData(await client.callTool({ name: 'ethogram_explain', arguments: { question } }))
    assert.notEqual(known.answerability, 'unknown')
  }
  const architecture = toolData(await client.callTool({ name: 'ethogram_explain', arguments: { question: 'Explain Ethogram architecture.' } }))
  assert.equal(architecture.articles.some(({ id }) => id === 'architecture'), true)
  const manager = toolData(await client.callTool({ name: 'ethogram_explain', arguments: { topic: 'stakeholders', audience: 'engineering-manager' } }))
  assert.match(manager.explanation, /rollout, adoption, ownership/i)

  const doctorStatic = toolData(await client.callTool({ name: 'ethogram_doctor', arguments: {} }))
  assert.equal(doctorStatic.status, 'static-ready')
  const doctorLoad = toolData(await client.callTool({ name: 'ethogram_doctor', arguments: { mode: 'load' } }))
  assert.equal(doctorLoad.status, 'ready')
  assert.equal(JSON.stringify(doctorLoad).includes(scratch), false)

  const project = toolData(await client.callTool({ name: 'ethogram_get_project', arguments: {} }))
  assert.equal(project.name, 'MCP Fixture')
  assert.match(project.revision, /^[a-f0-9]{64}$/)
  assert.equal(JSON.stringify(project).includes(scratch), false)

  const stories = toolData(await client.callTool({ name: 'ethogram_list_stories', arguments: { limit: 1 } }))
  assert.equal(stories.items.length, 1)
  assert.equal(stories.items[0].id, 'story/approval ?# café')
  assert.equal('storyDigest' in stories.items[0], false)
  assert.equal(stories.nextCursor, null)

  const story = toolData(await client.callTool({ name: 'ethogram_get_story', arguments: { storyId: 'story/approval ?# café' } }))
  assert.equal(story.when, 'Grant admin access.')
  assert.equal(story.revision, project.revision)
  assert.match(story.storyDigest, /^[a-f0-9]{64}$/)

  const resources = await client.listResources()
  assert.equal(resources.resources.some(({ uri }) => uri === 'ethogram://docs'), true)
  assert.equal(resources.resources.some(({ uri }) => uri === story.resourceUri), false)
  const storyResource = await client.readResource({ uri: story.resourceUri })
  assert.equal(JSON.parse(storyResource.contents[0].text).id, story.id)
  const docs = await client.readResource({ uri: 'ethogram://docs/overview' })
  assert.match(docs.contents[0].text, /What Ethogram is/)
  await assert.rejects(client.readResource({ uri: 'ethogram://docs/%' }))
  await assert.rejects(client.readResource({ uri: 'ethogram://docs/%2foverview' }))
  await assert.rejects(client.readResource({ uri: 'ethogram://docs/not-a-topic' }))

  const templates = await client.listResourceTemplates()
  assert.equal(templates.resourceTemplates.some(({ uriTemplate }) => uriTemplate === 'ethogram://stories/{storyId}'), true)
  const prompts = await client.listPrompts()
  assert.deepEqual(prompts.prompts.map(({ name }) => name).sort(), ['diagnose-ethogram-story', 'learn-ethogram'])
  const audienceEssentials = {
    'agent-developer': 'Agents and Stories',
    'application-developer': 'Integrating an existing agent',
    'technical-leader': 'Architecture and source-of-truth boundary',
    'engineering-manager': 'Who should care and who should review Stories',
    qa: 'Matcher and verdict semantics',
    'platform-sre': 'Architecture and source-of-truth boundary',
    security: 'Trust, safety, privacy, and data movement',
    'privacy-compliance': 'Trust, safety, privacy, and data movement',
    'product-domain-owner': 'Who should care and who should review Stories',
    support: 'Troubleshooting and support',
    maintainer: 'Architecture and source-of-truth boundary',
    'mcp-host-integrator': 'Using the Ethogram MCP server',
  }
  for (const [audience, essentialTitle] of Object.entries(audienceEssentials)) {
    const learned = await client.getPrompt({ name: 'learn-ethogram', arguments: { audience, detail: 'brief' } })
    assert.match(learned.messages[0].content.text, new RegExp(essentialTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  await assert.rejects(client.getPrompt({ name: 'unknown-prompt', arguments: {} }))
  const invalidToolInput = await client.callTool({ name: 'ethogram_explain', arguments: { topic: 'overview', extra: true } })
  assert.equal(invalidToolInput.isError, true)
  const diagnose = await client.getPrompt({ name: 'diagnose-ethogram-story', arguments: { storyId: story.id } })
  assert.match(diagnose.messages[0].content.text, /untrusted consumer-authored data/)
  assert.match(diagnose.messages[0].content.text, new RegExp(story.storyDigest))

  const noAck = await client.callTool({ name: 'ethogram_run_story', arguments: {
    storyId: story.id,
    expectedRevision: story.revision,
    expectedStoryDigest: story.storyDigest,
    acknowledgeExternalEffects: false,
  } })
  assert.equal(noAck.isError, true)
  assert.equal(noAck.structuredContent.error.code, 'EXECUTION_ACKNOWLEDGEMENT_REQUIRED')

  const firstRunPromise = client.callTool({ name: 'ethogram_run_story', arguments: {
    storyId: story.id,
    expectedRevision: story.revision,
    expectedStoryDigest: story.storyDigest,
    acknowledgeExternalEffects: true,
  } })
  await new Promise((resolve) => setTimeout(resolve, 30))
  const concurrent = await client.callTool({ name: 'ethogram_run_story', arguments: {
    storyId: story.id,
    expectedRevision: story.revision,
    expectedStoryDigest: story.storyDigest,
    acknowledgeExternalEffects: true,
  } })
  assert.equal(concurrent.isError, true)
  assert.equal(concurrent.structuredContent.error.code, 'RUN_IN_PROGRESS')
  const run = toolData(await firstRunPromise)
  assert.equal(run.execution.evaluationResult.verdict, 'PASS')
  assert.deepEqual(run.execution.evaluationResult.expectationResults.map(({ id, observedCallCount }) => [id, observedCallCount]), [
    ['checks-policy', 1],
    ['avoids-danger', 0],
  ])
  assert.equal(run.boundaryEvidence.mockDataUsed, 'unknown')
})

test('Agent resources remain addressable beyond the bounded project list', { timeout: 30_000 }, async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-many-agents-'))
  t.after(() => rm(scratch, { recursive: true, force: true }))
  await createProject(scratch)
  const agentExports = Array.from({ length: 105 }, (_, index) => {
    const suffix = String(index).padStart(3, '0')
    return `export const agent${suffix} = { id: 'bulk-${suffix}', name: 'Bulk ${suffix}', description: 'Bounded Agent ${suffix}', icon: 'search' }`
  }).join('\n')
  await writeFile(path.join(scratch, 'agents', 'many.agent.ts'), `${agentExports}\n`)

  const connection = await connectedInMemory(scratch)
  t.after(() => connection.close())
  const project = toolData(await connection.client.callTool({ name: 'ethogram_get_project', arguments: {} }))
  assert.equal(project.truncated, true)
  assert.equal(project.agents.some(({ id }) => id === 'bulk-104'), false)

  const resource = await connection.client.readResource({ uri: 'ethogram://agents/bulk-104' })
  const agent = JSON.parse(resource.contents[0].text)
  assert.equal(agent.id, 'bulk-104')
  assert.equal(agent.name, 'Bulk 104')
  assert.equal(agent.storyCount, 0)
})

test('truncated Story contracts disclose no execution token and cannot run through MCP', { timeout: 30_000 }, async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-large-story-'))
  t.after(() => rm(scratch, { recursive: true, force: true }))
  await createProject(scratch)
  const storyPath = path.join(scratch, 'stories', 'approval.agent.stories.ts')
  const original = await readFile(storyPath, 'utf8')
  const wideGiven = Object.fromEntries(Array.from({ length: 12_050 }, (_, index) => [`field-${index}`, index]))
  const oversized = original.replace(
    "given: { requestedRole: 'admin' },",
    `given: ${JSON.stringify(wideGiven)},`,
  )
  await writeFile(storyPath, oversized)

  const connection = await connectedInMemory(scratch)
  t.after(() => connection.close())
  const storyId = 'story/approval ?# café'
  const raw = await connection.runtime.inspect()
  const story = toolData(await connection.client.callTool({ name: 'ethogram_get_story', arguments: { storyId } }))
  assert.equal(story.truncated, true)
  assert.equal(story.storyDigest, null)
  assert.equal(story.executionAllowed, false)

  const listed = toolData(await connection.client.callTool({ name: 'ethogram_list_stories', arguments: { limit: 10 } }))
  assert.equal('storyDigest' in listed.items[0], false)
  assert.equal(listed.items[0].executable, true)
  await assert.rejects(connection.client.getPrompt({ name: 'diagnose-ethogram-story', arguments: { storyId } }))

  await rm(path.join(scratch, 'worker.pid'), { force: true })
  const attempted = await connection.client.callTool({ name: 'ethogram_run_story', arguments: {
    storyId,
    expectedRevision: raw.snapshot.revision,
    expectedStoryDigest: raw.snapshot.storyDigests[storyId],
    acknowledgeExternalEffects: true,
  } })
  assert.equal(attempted.isError, true)
  assert.equal(attempted.structuredContent.error.code, 'STORY_CONTEXT_TRUNCATED')
  await assert.rejects(stat(path.join(scratch, 'worker.pid')), (error) => error.code === 'ENOENT')
})

test('Ethogram MCP keeps documentation available for invalid projects and fails closed on path escape', { timeout: 30_000 }, async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-invalid-'))
  t.after(() => rm(scratch, { recursive: true, force: true }))
  await writeFile(path.join(scratch, 'package.json'), JSON.stringify({ name: 'invalid-project' }))
  const connection = await connectedInMemory(scratch)
  t.after(() => connection.close())
  const docs = await connection.client.readResource({ uri: 'ethogram://docs' })
  assert.match(docs.contents[0].text, /Ethogram documentation/)
  const invalidResources = await connection.client.listResources()
  assert.equal(invalidResources.resources.some(({ uri }) => uri === 'ethogram://docs'), true)
  const doctor = toolData(await connection.client.callTool({ name: 'ethogram_doctor', arguments: {} }))
  assert.equal(doctor.status, 'not-ready')
  const project = await connection.client.callTool({ name: 'ethogram_get_project', arguments: {} })
  assert.equal(project.isError, true)
  assert.equal(project.structuredContent.error.code, 'MISSING_ETHOGRAM_CONFIG')
  await connection.close()

  const outside = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-outside-'))
  t.after(() => rm(outside, { recursive: true, force: true }))
  await mkdir(path.join(outside, 'stories'))
  await createProject(scratch)
  await rm(path.join(scratch, 'stories'), { recursive: true, force: true })
  await symlink(path.join(outside, 'stories'), path.join(scratch, 'stories'))
  await writeFile(path.join(scratch, 'ethogram.config.mjs'), `export default { storyDirectories: ['stories'] }\n`)
  const escaped = await connectedInMemory(scratch)
  t.after(() => escaped.close())
  const escapedDoctor = toolData(await escaped.client.callTool({ name: 'ethogram_doctor', arguments: { mode: 'load' } }))
  assert.equal(escapedDoctor.status, 'not-ready')
  assert.equal(escapedDoctor.checks.some(({ code }) => code === 'PROJECT_PATH_ESCAPE'), true)

  const fileEscapeRoot = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-file-escape-'))
  const outsideFileRoot = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-outside-file-'))
  t.after(() => rm(fileEscapeRoot, { recursive: true, force: true }))
  t.after(() => rm(outsideFileRoot, { recursive: true, force: true }))
  await createProject(fileEscapeRoot)
  const profilePath = path.join(fileEscapeRoot, 'execution', 'approval.profile.ts')
  const externalProfile = path.join(outsideFileRoot, 'approval.profile.ts')
  await writeFile(externalProfile, await readFile(profilePath, 'utf8'))
  await rm(profilePath)
  await symlink(externalProfile, profilePath)
  const fileEscaped = await connectedInMemory(fileEscapeRoot)
  t.after(() => fileEscaped.close())
  const fileEscapedDoctor = toolData(await fileEscaped.client.callTool({ name: 'ethogram_doctor', arguments: { mode: 'load' } }))
  assert.equal(fileEscapedDoctor.status, 'not-ready')
  assert.equal(fileEscapedDoctor.checks.some(({ code }) => code === 'PROJECT_PATH_ESCAPE'), true)

  const importEscapeRoot = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-import-escape-'))
  const importOutsideRoot = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-import-outside-'))
  t.after(() => rm(importEscapeRoot, { recursive: true, force: true }))
  t.after(() => rm(importOutsideRoot, { recursive: true, force: true }))
  await createProject(importEscapeRoot)
  const outsideModule = path.join(importOutsideRoot, 'outside.ts')
  await writeFile(outsideModule, 'export const outside = true\n')
  const importStoryPath = path.join(importEscapeRoot, 'stories', 'approval.agent.stories.ts')
  const importStory = await readFile(importStoryPath, 'utf8')
  const escapedSpecifier = path.relative(path.dirname(importStoryPath), outsideModule).split(path.sep).join('/')
  await writeFile(importStoryPath, `import ${JSON.stringify(escapedSpecifier)}\n${importStory}`)
  const importEscaped = await connectedInMemory(importEscapeRoot)
  t.after(() => importEscaped.close())
  const importDoctor = toolData(await importEscaped.client.callTool({ name: 'ethogram_doctor', arguments: { mode: 'load' } }))
  assert.equal(importDoctor.status, 'not-ready')
  assert.equal(importDoctor.checks.some(({ code }) => code === 'PROJECT_PATH_ESCAPE'), true)

  const fixedRootParent = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-fixed-root-'))
  t.after(() => rm(fixedRootParent, { recursive: true, force: true }))
  const rootA = path.join(fixedRootParent, 'a')
  const rootB = path.join(fixedRootParent, 'b')
  const rootLink = path.join(fixedRootParent, 'current')
  await createProject(rootA)
  await createProject(rootB)
  await writeFile(path.join(rootB, 'ethogram.config.mjs'), `export default { name: 'Retargeted Project' }\n`)
  await symlink(rootA, rootLink)
  const fixedRootRuntime = new ProjectWorkerClient({ projectRoot: rootLink, loadTimeoutMs: 10_000 })
  await rm(rootLink)
  await symlink(rootB, rootLink)
  const fixedRootSnapshot = await fixedRootRuntime.inspect()
  assert.equal(fixedRootSnapshot.snapshot.project.name, 'MCP Fixture')
  await fixedRootRuntime.close()

  const missingThenLinked = path.join(fixedRootParent, 'missing-at-startup')
  const missingRootRuntime = new ProjectWorkerClient({ projectRoot: missingThenLinked, loadTimeoutMs: 10_000 })
  await symlink(rootB, missingThenLinked)
  await assert.rejects(missingRootRuntime.inspect(), (error) => error.code === 'PROJECT_PATH_ESCAPE')
  await missingRootRuntime.close()

  const crashRoot = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-worker-crash-'))
  t.after(() => rm(crashRoot, { recursive: true, force: true }))
  await createProject(crashRoot)
  await writeFile(path.join(crashRoot, 'ethogram.config.mjs'), `process.exit(7)\nexport default { name: 'Never loaded' }\n`)
  const crashed = await connectedInMemory(crashRoot)
  t.after(() => crashed.close())
  const crashedDoctor = toolData(await crashed.client.callTool({ name: 'ethogram_doctor', arguments: { mode: 'load' } }))
  assert.equal(crashedDoctor.status, 'not-ready')
  assert.equal(crashedDoctor.checks.some(({ code }) => code === 'PROJECT_WORKER_EXITED'), true)
  const docsAfterCrash = await crashed.client.readResource({ uri: 'ethogram://docs' })
  assert.match(docsAfterCrash.contents[0].text, /Ethogram documentation/)
})

async function stdioRoundTrip(projectRoot, legacy) {
  const client = new Client(
    { name: legacy ? 'ethogram-legacy-test' : 'ethogram-modern-test', version: '1.0.0' },
    { versionNegotiation: { mode: legacy ? 'legacy' : 'auto' } },
  )
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [mcpBinary, '--project', projectRoot, '--load-timeout-ms', '10000', '--run-timeout-ms', '10000'],
    stderr: 'pipe',
  })
  await client.connect(transport)
  try {
    assert.equal(client.getProtocolEra(), legacy ? 'legacy' : 'modern')
    if (!legacy) {
      assert.equal(client.getNegotiatedProtocolVersion(), '2026-07-28')
      assert.ok(client.getDiscoverResult())
    }
    const tools = await client.listTools()
    assert.equal(tools.tools.some(({ name }) => name === 'ethogram_get_story'), true)
    const story = toolData(await client.callTool({ name: 'ethogram_get_story', arguments: { storyId: 'story/approval ?# café' } }))
    const run = toolData(await client.callTool({ name: 'ethogram_run_story', arguments: {
      storyId: story.id,
      expectedRevision: story.revision,
      expectedStoryDigest: story.storyDigest,
      acknowledgeExternalEffects: true,
    } }))
    assert.equal(run.execution.evaluationResult.verdict, 'PASS')
  } finally {
    await client.close()
  }
}

test('packed-style stdio entry negotiates modern and legacy clients without consumer stdout corruption', { timeout: 60_000 }, async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram mcp stdio '))
  t.after(() => rm(scratch, { recursive: true, force: true }))
  await createProject(scratch)
  await stdioRoundTrip(scratch, false)
  await stdioRoundTrip(scratch, true)
})

test('runtime Story validation rejects duplicate ids, empty expectations, and unknown matchers', async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-contract-'))
  t.after(() => rm(scratch, { recursive: true, force: true }))
  await createProject(scratch)
  const storyPath = path.join(scratch, 'stories', 'approval.agent.stories.ts')
  const valid = await readFile(storyPath, 'utf8')
  for (const expectations of [
    '[]',
    `[{ id: 'same', description: 'One', matcher: { kind: 'tool-called', tool: 'check_policy' } }, { id: 'same', description: 'Two', matcher: { kind: 'tool-not-called', tool: 'dangerous_action' } }]`,
    `[{ id: 'invalid', description: 'Invalid', matcher: { kind: 'tool-sometimes-called', tool: 'check_policy' } }]`,
    `[{ id: 'invalid-failure', description: 'Invalid failure description', failureDescription: 42, matcher: { kind: 'tool-called', tool: 'check_policy' } }]`,
  ]) {
    const source = valid.replace(/expectations: \[[\s\S]*?\n  \],\n  execution:/, `expectations: ${expectations},\n  execution:`)
    await writeFile(storyPath, source)
    const runtime = new ProjectWorkerClient({ projectRoot: scratch, loadTimeoutMs: 10_000 })
    await assert.rejects(runtime.inspect(), (error) => error.code === 'INVALID_STORY_EXPORT')
    await runtime.close()
  }
})

test('MCP distinguishes behavioral FAIL, operational error, and oversized post-execution evidence', { timeout: 30_000 }, async (t) => {
  const normalizedUnknown = new EthogramMcpError('EVIL_CODE_WITH_SECRET', 'operation', false, true)
  assert.equal(normalizedUnknown.code, 'ETHOGRAM_RUNTIME_ERROR')
  assert.equal(normalizedUnknown.message.includes('EVIL_CODE_WITH_SECRET'), false)
  const failRoot = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-fail-'))
  t.after(() => rm(failRoot, { recursive: true, force: true }))
  await createProject(failRoot)
  const failStoryPath = path.join(failRoot, 'stories', 'approval.agent.stories.ts')
  const failStorySource = (await readFile(failStoryPath, 'utf8'))
    .replace("matcher: { kind: 'tool-not-called', tool: 'dangerous_action' }", "matcher: { kind: 'tool-called', tool: 'dangerous_action' }")
  await writeFile(failStoryPath, failStorySource)
  const failing = await connectedInMemory(failRoot)
  t.after(() => failing.close())
  const failedStory = toolData(await failing.client.callTool({ name: 'ethogram_get_story', arguments: { storyId: 'story/approval ?# café' } }))
  const failedRun = toolData(await failing.client.callTool({ name: 'ethogram_run_story', arguments: {
    storyId: failedStory.id,
    expectedRevision: failedStory.revision,
    expectedStoryDigest: failedStory.storyDigest,
    acknowledgeExternalEffects: true,
  } }))
  assert.equal(failedRun.execution.evaluationResult.verdict, 'FAIL')
  assert.equal(failedRun.execution.evaluationResult.expectationResults[1].verdict, 'FAIL')

  const errorRoot = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-error-'))
  t.after(() => rm(errorRoot, { recursive: true, force: true }))
  await createProject(errorRoot)
  const errorProfilePath = path.join(errorRoot, 'execution', 'approval.profile.ts')
  const errorProfile = (await readFile(errorProfilePath, 'utf8'))
    .replace("writeFileSync('worker.pid', String(process.pid))", "writeFileSync('worker.pid', String(process.pid)); throw new Error('private sentinel /Users/secret')")
  await writeFile(errorProfilePath, errorProfile)
  const errored = await connectedInMemory(errorRoot)
  t.after(() => errored.close())
  const errorStory = toolData(await errored.client.callTool({ name: 'ethogram_get_story', arguments: { storyId: 'story/approval ?# café' } }))
  const operational = await errored.client.callTool({ name: 'ethogram_run_story', arguments: {
    storyId: errorStory.id,
    expectedRevision: errorStory.revision,
    expectedStoryDigest: errorStory.storyDigest,
    acknowledgeExternalEffects: true,
  } })
  assert.equal(operational.isError, true)
  assert.equal(operational.structuredContent.error.code, 'PROFILE_EXECUTION_FAILED')
  assert.equal(operational.structuredContent.error.effectsMayHaveOccurred, true)
  assert.equal(operational.structuredContent.error.retrySafe, false)
  assert.equal(JSON.stringify(operational).includes('private sentinel'), false)
  assert.equal('verdict' in operational.structuredContent.error, false)

  for (const [name, mutateProfile] of [
    ['invalid-outcome', (source) => source.replace(
      "return { decision: 'deny', finalResponse: 'Policy requires approval.' }",
      'return { decision: 42, finalResponse: 7 }',
    )],
    ['bigint-tool-output', (source) => source.replace(
      "return { ...input, allowed: false }",
      'return { value: 1n }',
    )],
    ['undefined-tool-input', (source) => source
      .replace("execute(input) {", "execute(input) { writeFileSync('tool.marker', 'called')")
      .replace("await callTool('check_policy', { role: 'admin' })", "await callTool('check_policy', undefined)")],
    ['nan-tool-input', (source) => source
      .replace("execute(input) {", "execute(input) { writeFileSync('tool.marker', 'called')")
      .replace("await callTool('check_policy', { role: 'admin' })", "await callTool('check_policy', { role: NaN })")],
  ]) {
    const invalidRoot = await mkdtemp(path.join(tmpdir(), `ethogram-mcp-${name}-`))
    t.after(() => rm(invalidRoot, { recursive: true, force: true }))
    await createProject(invalidRoot)
    const invalidProfilePath = path.join(invalidRoot, 'execution', 'approval.profile.ts')
    await writeFile(invalidProfilePath, mutateProfile(await readFile(invalidProfilePath, 'utf8')))
    const invalidConnection = await connectedInMemory(invalidRoot)
    t.after(() => invalidConnection.close())
    const invalidStory = toolData(await invalidConnection.client.callTool({ name: 'ethogram_get_story', arguments: { storyId: 'story/approval ?# café' } }))
    const invalidRun = await invalidConnection.client.callTool({ name: 'ethogram_run_story', arguments: {
      storyId: invalidStory.id,
      expectedRevision: invalidStory.revision,
      expectedStoryDigest: invalidStory.storyDigest,
      acknowledgeExternalEffects: true,
    } })
    assert.equal(invalidRun.isError, true)
    assert.equal(invalidRun.structuredContent.error.code, 'PROFILE_EXECUTION_FAILED')
    assert.equal(invalidRun.structuredContent.error.effectsMayHaveOccurred, true)
    assert.equal(invalidRun.structuredContent.error.retrySafe, false)
    assert.equal('verdict' in invalidRun.structuredContent.error, false)
    if (name.endsWith('tool-input')) {
      await assert.rejects(stat(path.join(invalidRoot, 'tool.marker')), (error) => error.code === 'ENOENT')
    }
  }

  const payloadRoot = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-payload-'))
  t.after(() => rm(payloadRoot, { recursive: true, force: true }))
  await createProject(payloadRoot)
  const payloadProfilePath = path.join(payloadRoot, 'execution', 'approval.profile.ts')
  const payloadProfile = (await readFile(payloadProfilePath, 'utf8'))
    .replace("finalResponse: 'Policy requires approval.'", "finalResponse: 'x'.repeat(5 * 1024 * 1024)")
  await writeFile(payloadProfilePath, payloadProfile)
  const oversized = await connectedInMemory(payloadRoot)
  t.after(() => oversized.close())
  const payloadStory = toolData(await oversized.client.callTool({ name: 'ethogram_get_story', arguments: { storyId: 'story/approval ?# café' } }))
  const payloadRun = await oversized.client.callTool({ name: 'ethogram_run_story', arguments: {
    storyId: payloadStory.id,
    expectedRevision: payloadStory.revision,
    expectedStoryDigest: payloadStory.storyDigest,
    acknowledgeExternalEffects: true,
  } })
  assert.equal(payloadRun.isError, true)
  assert.equal(payloadRun.structuredContent.error.code, 'PROJECT_PAYLOAD_TOO_LARGE')
  assert.equal(payloadRun.structuredContent.error.effectsMayHaveOccurred, true)
  assert.equal(payloadRun.structuredContent.error.retrySafe, false)
})

test('Story pagination is revision-bound and output schemas reject malformed handler data', { timeout: 20_000 }, async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-pagination-'))
  t.after(() => rm(scratch, { recursive: true, force: true }))
  await createProject(scratch)
  const firstStoryPath = path.join(scratch, 'stories', 'approval.agent.stories.ts')
  const secondStoryPath = path.join(scratch, 'stories', 'second.agent.stories.ts')
  const secondStory = (await readFile(firstStoryPath, 'utf8'))
    .replace('approvalStory =', 'approvalStoryTwo =')
    .replace("id: 'story/approval ?# café'", "id: 'story/two'")
    .replace("name: 'Approval Requires Policy'", "name: 'Second Story'")
  await writeFile(secondStoryPath, secondStory)
  const connection = await connectedInMemory(scratch)
  t.after(() => connection.close())
  const firstPage = toolData(await connection.client.callTool({ name: 'ethogram_list_stories', arguments: { limit: 1 } }))
  assert.equal(firstPage.items.length, 1)
  assert.equal(typeof firstPage.nextCursor, 'string')
  const secondPage = toolData(await connection.client.callTool({ name: 'ethogram_list_stories', arguments: { limit: 1, cursor: firstPage.nextCursor } }))
  assert.equal(secondPage.items.length, 1)
  assert.notEqual(secondPage.items[0].id, firstPage.items[0].id)
  await writeFile(secondStoryPath, `${secondStory}\n// revision changed\n`)
  const stalePage = await connection.client.callTool({ name: 'ethogram_list_stories', arguments: { limit: 1, cursor: firstPage.nextCursor } })
  assert.equal(stalePage.isError, true)
  assert.equal(stalePage.structuredContent.error.code, 'STALE_PROJECT')

  const invalidRuntime = {
    projectRoot: scratch,
    async inspect() {
      return {
        kind: 'inspect',
        snapshot: {
          revision: 'a'.repeat(64),
          storyDigests: {},
          project: { projectRoot: '', name: 42, adapter: { id: 'typescript', label: 'TypeScript' }, agents: [], stories: [] },
        },
      }
    },
    async close() {},
  }
  const malformedServer = createEthogramMcpServer({ projectRoot: scratch, runtime: invalidRuntime })
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const malformedClient = new Client({ name: 'malformed-output-test', version: '1.0.0' })
  await malformedServer.connect(serverTransport)
  await malformedClient.connect(clientTransport)
  t.after(async () => {
    await malformedClient.close()
    await malformedServer.close()
  })
  const malformedOutput = await malformedClient.callTool({ name: 'ethogram_get_project', arguments: {} })
  assert.equal(malformedOutput.isError, true)
  assert.match(malformedOutput.content[0].text, /output validation/i)
})

test('content revisions, stale preconditions, timeout, cancellation, and stale execution fail safely', { timeout: 30_000 }, async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-freshness-'))
  t.after(() => rm(scratch, { recursive: true, force: true }))
  await createProject(scratch)
  const storyPath = path.join(scratch, 'stories', 'approval.agent.stories.ts')
  const originalSource = await readFile(storyPath, 'utf8')
  const metadata = await stat(storyPath)
  const runtime = new ProjectWorkerClient({ projectRoot: scratch, loadTimeoutMs: 10_000, runTimeoutMs: 10_000 })
  t.after(() => runtime.close())
  const first = await runtime.inspect()
  const storyId = 'story/approval ?# café'

  const sameSizeEdit = originalSource.replace('Approval Requires Policy', 'Approval Requires Policx')
  assert.equal(Buffer.byteLength(sameSizeEdit), Buffer.byteLength(originalSource))
  await writeFile(storyPath, sameSizeEdit)
  await utimes(storyPath, metadata.atime, metadata.mtime)
  const second = await runtime.inspect()
  assert.notEqual(second.snapshot.revision, first.snapshot.revision)
  await assert.rejects(runtime.run({
    kind: 'run',
    storyId,
    expectedRevision: first.snapshot.revision,
    expectedStoryDigest: first.snapshot.storyDigests[storyId],
  }), (error) => error.code === 'STALE_PROJECT' && error.effectsMayHaveOccurred === false)

  await writeFile(path.join(scratch, 'hang.signal'), 'hang')
  const timed = new ProjectWorkerClient({ projectRoot: scratch, loadTimeoutMs: 10_000, runTimeoutMs: 200 })
  await assert.rejects(timed.run({
    kind: 'run',
    storyId,
    expectedRevision: second.snapshot.revision,
    expectedStoryDigest: second.snapshot.storyDigests[storyId],
  }), (error) => error.code === 'PROJECT_WORKER_TIMEOUT' && error.effectsMayHaveOccurred === true && error.retrySafe === false)
  const timedPid = Number(await readFile(path.join(scratch, 'worker.pid'), 'utf8'))
  assert.throws(() => process.kill(timedPid, 0), (error) => error.code === 'ESRCH')
  await timed.close()
  await rm(path.join(scratch, 'hang.signal'), { force: true })

  const cancellable = new ProjectWorkerClient({ projectRoot: scratch, loadTimeoutMs: 10_000, runTimeoutMs: 10_000 })
  const controller = new AbortController()
  const cancelled = cancellable.run({
    kind: 'run',
    storyId,
    expectedRevision: second.snapshot.revision,
    expectedStoryDigest: second.snapshot.storyDigests[storyId],
  }, controller.signal)
  setTimeout(() => controller.abort(), 30)
  await assert.rejects(cancelled, (error) => error.code === 'OPERATION_CANCELLED' && error.effectsMayHaveOccurred === true)
  await cancellable.close()

  await writeFile(path.join(scratch, 'hang.signal'), 'hang')
  await rm(path.join(scratch, 'worker.pid'), { force: true })
  const closing = new ProjectWorkerClient({ projectRoot: scratch, loadTimeoutMs: 10_000, runTimeoutMs: 10_000 })
  const closingOutcome = closing.run({
    kind: 'run',
    storyId,
    expectedRevision: second.snapshot.revision,
    expectedStoryDigest: second.snapshot.storyDigests[storyId],
  }).catch((error) => error)
  await waitForFile(path.join(scratch, 'worker.pid'))
  const closingPid = Number(await readFile(path.join(scratch, 'worker.pid'), 'utf8'))
  await closing.close()
  const closingError = await closingOutcome
  assert.equal(closingError.code, 'PROJECT_WORKER_EXITED')
  assert.throws(() => process.kill(closingPid, 0), (error) => error.code === 'ESRCH')
  await rm(path.join(scratch, 'hang.signal'), { force: true })

  const staleRuntime = new ProjectWorkerClient({ projectRoot: scratch, loadTimeoutMs: 10_000, runTimeoutMs: 10_000 })
  const beforeStaleRun = await staleRuntime.inspect()
  const workerMarker = path.join(scratch, 'worker.pid')
  await rm(workerMarker, { force: true })
  const staleRun = staleRuntime.run({
    kind: 'run',
    storyId,
    expectedRevision: beforeStaleRun.snapshot.revision,
    expectedStoryDigest: beforeStaleRun.snapshot.storyDigests[storyId],
  })
  await waitForFile(workerMarker)
  await writeFile(storyPath, originalSource)
  await assert.rejects(staleRun, (error) => error.code === 'STALE_EXECUTION' && error.effectsMayHaveOccurred === true && error.retrySafe === false)
  await staleRuntime.close()
})
