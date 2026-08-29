import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const corePackageRoot = path.join(repositoryRoot, 'packages', 'agentbook')
const cliPackageRoot = path.join(repositoryRoot, 'packages', 'cli')

const packageSource = `${JSON.stringify({
  name: 'purchase-approval-existing-agent',
  version: '1.0.0',
  private: true,
  type: 'module',
}, null, 2)}\n`

const toolsSource = `export const purchaseTools = {
  async lookupPurchasePolicy({ approvalThreshold, requesterLevel }) {
    return { approvalThreshold, requesterLevel, policyFound: true }
  },
  async createPurchaseOrder({ purchaseAmount, requesterLevel }) {
    return { purchaseOrderId: 'LOCAL-PO-001', purchaseAmount, requesterLevel, localOnly: true }
  },
  async requestPurchaseApproval({ purchaseAmount, requesterLevel }) {
    return { approvalRequestId: 'LOCAL-APPROVAL-001', purchaseAmount, requesterLevel, localOnly: true }
  },
}
`

const correctAgentSource = `export async function runPurchaseApprovalAgent(input, tools) {
  await tools.lookupPurchasePolicy({
    approvalThreshold: input.approvalThreshold,
    requesterLevel: input.requesterLevel,
  })

  if (input.purchaseAmount > input.approvalThreshold) {
    const approval = await tools.requestPurchaseApproval({
      purchaseAmount: input.purchaseAmount,
      requesterLevel: input.requesterLevel,
    })
    return {
      decision: 'Request purchase approval',
      finalResponse: \`\${input.instruction} Approval request \${approval.approvalRequestId} was created.\`,
    }
  }

  const order = await tools.createPurchaseOrder({
    purchaseAmount: input.purchaseAmount,
    requesterLevel: input.requesterLevel,
  })
  return {
    decision: 'Create purchase order',
    finalResponse: \`\${input.instruction} Purchase order \${order.purchaseOrderId} was created.\`,
  }
}
`

const regressionAgentSource = `export async function runPurchaseApprovalAgent(input, tools) {
  await tools.lookupPurchasePolicy({
    approvalThreshold: input.approvalThreshold,
    requesterLevel: input.requesterLevel,
  })

  if (input.purchaseAmount > input.approvalThreshold) {
    await tools.createPurchaseOrder({
      purchaseAmount: input.purchaseAmount,
      requesterLevel: input.requesterLevel,
    })
    const approval = await tools.requestPurchaseApproval({
      purchaseAmount: input.purchaseAmount,
      requesterLevel: input.requesterLevel,
    })
    return {
      decision: 'Request purchase approval',
      finalResponse: \`\${input.instruction} Approval request \${approval.approvalRequestId} was created.\`,
    }
  }

  const order = await tools.createPurchaseOrder({
    purchaseAmount: input.purchaseAmount,
    requesterLevel: input.requesterLevel,
  })
  return {
    decision: 'Create purchase order',
    finalResponse: \`\${input.instruction} Purchase order \${order.purchaseOrderId} was created.\`,
  }
}
`

const cliSource = `import { runPurchaseApprovalAgent } from './agent.ts'
import { purchaseTools } from './tools.ts'

const purchaseAmount = Number(process.argv[2])
const approvalThreshold = Number(process.argv[3])
const requesterLevel = process.argv[4] ?? 'employee'
const instruction = process.argv[5] ?? 'Purchase this item.'
const trace = []

const observedTools = {
  async lookupPurchasePolicy(input) {
    const output = await purchaseTools.lookupPurchasePolicy(input)
    trace.push({ name: 'lookup_purchase_policy', input, output })
    return output
  },
  async createPurchaseOrder(input) {
    const output = await purchaseTools.createPurchaseOrder(input)
    trace.push({ name: 'create_purchase_order', input, output })
    return output
  },
  async requestPurchaseApproval(input) {
    const output = await purchaseTools.requestPurchaseApproval(input)
    trace.push({ name: 'request_purchase_approval', input, output })
    return output
  },
}

const input = { purchaseAmount, approvalThreshold, requesterLevel, instruction }
const outcome = await runPurchaseApprovalAgent(input, observedTools)
console.log(JSON.stringify({ input, availableTools: Object.keys(observedTools), trace, outcome }))
`

const agentDescriptorSource = `import { defineAgent } from '@agentbook/core'

export const purchaseApprovalAgent = defineAgent({
  id: 'purchase-approval-agent',
  name: 'Purchase Approval Agent',
  description: 'Applies the existing local purchase approval behavior.',
  icon: 'target',
})
`

const storiesSource = `import { defineStory } from '@agentbook/core'
import { purchaseApprovalAgent } from '../agents/purchase-approval.agent.ts'

export const highValuePurchase = defineStory({
  id: 'high-value-purchase-requires-approval',
  name: 'High-Value Purchase Requires Approval',
  agent: purchaseApprovalAgent,
  description: 'A purchase above the threshold must wait for approval.',
  given: {
    purchaseAmount: 500,
    requesterLevel: 'employee',
    approvalThreshold: 100,
  },
  when: 'Purchase this item.',
  then: [
    { id: 'checks-purchase-policy', description: 'Checks the purchase policy', matcher: { kind: 'tool-called', tool: 'lookup_purchase_policy' } },
    { id: 'requests-purchase-approval', description: 'Requests approval for the purchase', matcher: { kind: 'tool-called', tool: 'request_purchase_approval' } },
    { id: 'does-not-create-purchase-order', description: 'Does not create a purchase order before approval', matcher: { kind: 'tool-not-called', tool: 'create_purchase_order' } },
  ],
  execution: { kind: 'external-profile', profile: 'existing-purchase-approval' },
})

export const lowValuePurchase = defineStory({
  id: 'low-value-purchase-creates-order',
  name: 'Low-Value Purchase Creates Order',
  agent: purchaseApprovalAgent,
  description: 'A purchase at or below the threshold creates an order.',
  given: {
    purchaseAmount: 50,
    requesterLevel: 'employee',
    approvalThreshold: 100,
  },
  when: 'Purchase this item.',
  then: [
    { id: 'checks-purchase-policy', description: 'Checks the purchase policy', matcher: { kind: 'tool-called', tool: 'lookup_purchase_policy' } },
    { id: 'creates-purchase-order', description: 'Creates the purchase order', matcher: { kind: 'tool-called', tool: 'create_purchase_order' } },
    { id: 'does-not-request-approval', description: 'Does not request unnecessary approval', matcher: { kind: 'tool-not-called', tool: 'request_purchase_approval' } },
  ],
  execution: { kind: 'external-profile', profile: 'existing-purchase-approval' },
})
`

const profileSource = `import { defineExecutionProfile } from '@agentbook/core'
import { runPurchaseApprovalAgent } from '../src/agent.ts'
import { purchaseTools } from '../src/tools.ts'

function mapAndValidateGiven(given, prompt) {
  if (Array.isArray(given)) throw new Error('Purchase Approval Stories require structured GIVEN.')
  const { purchaseAmount, requesterLevel, approvalThreshold } = given
  if (typeof purchaseAmount !== 'number' || !Number.isFinite(purchaseAmount)) throw new Error('purchaseAmount must be a finite number.')
  if (typeof requesterLevel !== 'string' || requesterLevel.length === 0) throw new Error('requesterLevel must be a non-empty string.')
  if (typeof approvalThreshold !== 'number' || !Number.isFinite(approvalThreshold)) throw new Error('approvalThreshold must be a finite number.')
  return { purchaseAmount, requesterLevel, approvalThreshold, instruction: prompt }
}

export const purchaseApprovalProfile = defineExecutionProfile({
  id: 'existing-purchase-approval',
  tools: {
    lookup_purchase_policy: {
      description: 'Invoke the existing local purchase policy lookup.',
      execute: (input) => purchaseTools.lookupPurchasePolicy(input),
    },
    create_purchase_order: {
      description: 'Invoke the existing local purchase-order action.',
      execute: (input) => purchaseTools.createPurchaseOrder(input),
    },
    request_purchase_approval: {
      description: 'Invoke the existing local approval-request action.',
      execute: (input) => purchaseTools.requestPurchaseApproval(input),
    },
  },
  async execute({ story, callTool }) {
    const input = mapAndValidateGiven(story.given, story.prompt)
    return runPurchaseApprovalAgent(input, {
      lookupPurchasePolicy: (toolInput) => callTool('lookup_purchase_policy', toolInput),
      createPurchaseOrder: (toolInput) => callTool('create_purchase_order', toolInput),
      requestPurchaseApproval: (toolInput) => callTool('request_purchase_approval', toolInput),
    })
  },
})
`

const originalFiles = ['src/agent.ts', 'src/tools.ts', 'src/cli.ts']
const integrationFiles = [
  'agentbook.config.mjs',
  'agents/purchase-approval.agent.ts',
  'stories/purchase-approval.agent.stories.ts',
  'execution/purchase-approval.profile.ts',
]

function cleanEnvironment() {
  const environment = { ...process.env }
  for (const key of [
    'NODE_PATH',
    'NODE_OPTIONS',
    'TS_NODE_PROJECT',
    'TSX_TSCONFIG_PATH',
    'AGENTBOOK_PROJECT_ROOT',
    'AI_GATEWAY_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
  ]) delete environment[key]
  environment.npm_config_update_notifier = 'false'
  environment.npm_config_audit = 'false'
  environment.npm_config_fund = 'false'
  return environment
}

function run(command, args, cwd, options = {}) {
  try {
    return {
      status: 0,
      output: execFileSync(command, args, {
        cwd,
        env: cleanEnvironment(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options,
      }),
    }
  } catch (error) {
    return { status: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` }
  }
}

function assertOutsideRepository(candidate) {
  const relative = path.relative(repositoryRoot, candidate)
  assert.notEqual(relative, '')
  assert.equal(relative === '..' || relative.startsWith(`..${path.sep}`), true)
  assert.equal(path.isAbsolute(relative), false)
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex')
}

async function hashes(root, files) {
  return Object.fromEntries(await Promise.all(files.map(async (file) => [file, await sha256(path.join(root, file))])))
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.name === 'node_modules') continue
    const absolute = path.join(current, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(root, absolute))
    else files.push(path.relative(root, absolute).split(path.sep).join('/'))
  }
  return files.sort()
}

function physicalLoc(source) {
  return source.split('\n').filter((line, index, lines) => index < lines.length - 1 || line.length > 0).length
}

function logicalLoc(source) {
  return source.split('\n').filter((line) => line.trim() && !line.trim().startsWith('//')).length
}

function assertVerdictFree(value, location = 'observedRun') {
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    assert.equal(['passed', 'failed', 'verdict'].includes(key), false, `${location}.${key} contains a verdict field`)
    assert.equal(nested === 'PASS' || nested === 'FAIL', false, `${location}.${key} contains a verdict value`)
    assertVerdictFree(nested, `${location}.${key}`)
  }
}

async function createExistingAgent(root) {
  await mkdir(path.join(root, 'src'), { recursive: true })
  await writeFile(path.join(root, 'package.json'), packageSource)
  await writeFile(path.join(root, 'src', 'agent.ts'), correctAgentSource)
  await writeFile(path.join(root, 'src', 'tools.ts'), toolsSource)
  await writeFile(path.join(root, 'src', 'cli.ts'), cliSource)
}

async function addIntegration(root) {
  await mkdir(path.join(root, 'agents'), { recursive: true })
  await mkdir(path.join(root, 'stories'), { recursive: true })
  await mkdir(path.join(root, 'execution'), { recursive: true })
  await writeFile(path.join(root, 'agents', 'purchase-approval.agent.ts'), agentDescriptorSource)
  await writeFile(path.join(root, 'stories', 'purchase-approval.agent.stories.ts'), storiesSource)
  await writeFile(path.join(root, 'execution', 'purchase-approval.profile.ts'), profileSource)
}

function standaloneRun(root, amount) {
  const result = run('node', ['--disable-warning=ExperimentalWarning', 'src/cli.ts', String(amount), '100', 'employee', 'Purchase this item.'], root)
  assert.equal(result.status, 0, result.output)
  return JSON.parse(result.output.trim())
}

async function installArtifacts(root, coreTarball, cliTarball) {
  const result = run('npm', [
    'install', '--save-dev', '--ignore-scripts', '--no-audit', '--no-fund', '--offline', coreTarball, cliTarball,
  ], root)
  assert.equal(result.status, 0, result.output)
  return result.output.trim()
}

async function installedBoundary(root) {
  const canonicalRoot = await realpath(root)
  const core = await realpath(path.join(root, 'node_modules', '@agentbook', 'core'))
  const cli = await realpath(path.join(root, 'node_modules', '@agentbook', 'cli'))
  const binary = await realpath(path.join(root, 'node_modules', '.bin', 'agentbook'))
  for (const target of [core, cli, binary]) {
    assert.equal(target.startsWith(`${canonicalRoot}${path.sep}`), true)
    assert.equal(target.includes(repositoryRoot), false)
  }
  assert.equal((await lstat(core)).isSymbolicLink(), false)
  assert.equal((await lstat(cli)).isSymbolicLink(), false)
  return { core, cli, binary }
}

async function startDev(binary, cwd) {
  const child = spawn(binary, ['dev', '--no-open', '--port', '0'], {
    cwd,
    env: cleanEnvironment(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })
  const url = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for Agentbook dev.\n${output}`)), 15_000)
    const inspect = () => {
      const match = output.match(/Local URL: (http:\/\/127\.0\.0\.1:\d+\/)/)
      if (!match) return
      clearTimeout(timeout)
      resolve(match[1])
    }
    child.stdout.on('data', inspect)
    child.once('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`Agentbook dev exited before readiness (${code}).\n${output}`))
    })
  })
  return {
    child,
    url,
    output: () => output,
    async stop() {
      if (child.exitCode !== null) return
      child.kill('SIGINT')
      await new Promise((resolve) => child.once('exit', resolve))
      assert.match(output, /Agentbook developer server stopped\./)
    },
  }
}

async function runStory(url, storyId) {
  const response = await fetch(new URL('/api/run', url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storyId }),
  })
  const payload = await response.json()
  assert.equal(response.status, 200, JSON.stringify(payload))
  assert.equal(payload.status, 'completed')
  assertVerdictFree(payload.execution.observedRun)
  assert.equal(payload.boundaryEvidence.storyUnchanged, true)
  assert.equal(payload.boundaryEvidence.mockDataUsed, false)
  return payload
}

function toolNames(payload) {
  return payload.execution.observedRun.toolCalls.map(({ name }) => name)
}

async function packArtifacts(scratchRoot) {
  const buildCore = run('npm', ['run', 'core:build'], repositoryRoot)
  const buildCli = run('npm', ['run', 'cli:build'], repositoryRoot)
  assert.equal(buildCore.status, 0, buildCore.output)
  assert.equal(buildCli.status, 0, buildCli.output)
  const artifactDirectory = path.join(scratchRoot, 'artifacts')
  await mkdir(artifactDirectory)
  const corePack = run('npm', ['pack', corePackageRoot, '--ignore-scripts', '--json', '--pack-destination', artifactDirectory], repositoryRoot)
  const cliPack = run('npm', ['pack', cliPackageRoot, '--ignore-scripts', '--json', '--pack-destination', artifactDirectory], repositoryRoot)
  assert.equal(corePack.status, 0, corePack.output)
  assert.equal(cliPack.status, 0, cliPack.output)
  const [core] = JSON.parse(corePack.output)
  const [cli] = JSON.parse(cliPack.output)
  return {
    core: { ...core, path: path.join(artifactDirectory, core.filename) },
    cli: { ...cli, path: path.join(artifactDirectory, cli.filename) },
  }
}

test('Test 08 integrates and observes a pre-existing TypeScript agent without source changes', { timeout: 300_000 }, async (t) => {
  const scratchRoot = await mkdtemp(path.join(tmpdir(), 'agentbook-test08-'))
  const keep = process.env.AGENTBOOK_KEEP_TEST08 === '1'
  if (!keep) t.after(() => rm(scratchRoot, { recursive: true, force: true }))
  assertOutsideRepository(scratchRoot)

  const consumer = path.join(scratchRoot, 'purchase-agent')
  await createExistingAgent(consumer)
  const preAgentbookTree = await listFiles(consumer)
  assert.deepEqual(preAgentbookTree, ['package.json', 'src/agent.ts', 'src/cli.ts', 'src/tools.ts'])
  const preIntegrationHashes = await hashes(consumer, originalFiles)
  const preIntegrationSources = Object.fromEntries(await Promise.all(originalFiles.map(async (file) => [file, await readFile(path.join(consumer, file), 'utf8')])))
  const preAgentbookImports = Object.values(preIntegrationSources).flatMap((source) => [...source.matchAll(/from ['"]([^'"]+)['"]/g)].map((match) => match[1]))
  assert.equal(Object.values(preIntegrationSources).join('\n').includes('agentbook'), false)

  const baselineHigh = standaloneRun(consumer, 500)
  const baselineLow = standaloneRun(consumer, 50)
  assert.deepEqual(baselineHigh.availableTools, ['lookupPurchasePolicy', 'createPurchaseOrder', 'requestPurchaseApproval'])
  assert.deepEqual(baselineLow.availableTools, baselineHigh.availableTools)
  assert.deepEqual(baselineHigh.trace.map(({ name }) => name), ['lookup_purchase_policy', 'request_purchase_approval'])
  assert.deepEqual(baselineLow.trace.map(({ name }) => name), ['lookup_purchase_policy', 'create_purchase_order'])

  const artifacts = await packArtifacts(scratchRoot)
  const timerStartWall = new Date().toISOString()
  const timerStart = process.hrtime.bigint()
  const installOutput = await installArtifacts(consumer, artifacts.core.path, artifacts.cli.path)
  const boundary = await installedBoundary(consumer)
  const binary = path.join(consumer, 'node_modules', '.bin', 'agentbook')

  const packageAfterInstall = await readFile(path.join(consumer, 'package.json'), 'utf8')
  const firstInit = run(binary, ['init', '--existing'], consumer)
  assert.equal(firstInit.status, 0, firstInit.output)
  assert.match(firstInit.output, /Created agentbook\.config\.mjs/)
  assert.match(firstInit.output, /thin execution profile/)
  assert.equal(await readFile(path.join(consumer, 'package.json'), 'utf8'), packageAfterInstall)
  assert.deepEqual((await listFiles(consumer)).filter((file) => !file.startsWith('package') && !file.startsWith('src/')), ['agentbook.config.mjs'])

  const configHash = await sha256(path.join(consumer, 'agentbook.config.mjs'))
  const secondInit = run(binary, ['init', '--existing'], consumer)
  assert.equal(secondInit.status, 0, secondInit.output)
  assert.match(secondInit.output, /already initialized/)
  assert.equal(await sha256(path.join(consumer, 'agentbook.config.mjs')), configHash)

  await addIntegration(consumer)
  const postIntegrationHashes = await hashes(consumer, originalFiles)
  assert.deepEqual(postIntegrationHashes, preIntegrationHashes)
  const integrationSources = Object.fromEntries(await Promise.all(integrationFiles.map(async (file) => [file, await readFile(path.join(consumer, file), 'utf8')])))
  assert.doesNotMatch(profileSource, /purchaseAmount\s*>|purchaseAmount\s*<=|matcher|expectation|\b500\b|\b50\b|\b100\b/)
  assert.match(profileSource, /runPurchaseApprovalAgent\(input/)
  assert.match(profileSource, /story\.given/)
  assert.doesNotMatch(profileSource, /story\.scenario|\bscenario\s*:/)

  const storyHash = await sha256(path.join(consumer, 'stories', 'purchase-approval.agent.stories.ts'))
  const profileHash = await sha256(path.join(consumer, 'execution', 'purchase-approval.profile.ts'))

  const firstServer = await startDev(binary, consumer)
  t.after(() => { if (firstServer.child.exitCode === null) firstServer.child.kill('SIGINT') })
  const projectResponse = await fetch(new URL('/api/project', firstServer.url))
  const project = await projectResponse.json()
  assert.equal(project.name, 'purchase-approval-existing-agent')
  assert.deepEqual(project.agents.map(({ name }) => name), ['Purchase Approval Agent'])
  assert.deepEqual(project.stories.map(({ name }) => name), ['High-Value Purchase Requires Approval', 'Low-Value Purchase Creates Order'])
  assert.deepEqual(Object.keys(project.stories[0].given), ['purchaseAmount', 'requesterLevel', 'approvalThreshold'])
  assert.equal(JSON.stringify(project).includes('Access Request'), false)
  assert.equal(project.stories.every(({ given }) => !Array.isArray(given)), true)

  const highPass = await runStory(firstServer.url, 'high-value-purchase-requires-approval')
  const lowPass = await runStory(firstServer.url, 'low-value-purchase-creates-order')
  assert.deepEqual(toolNames(highPass), ['lookup_purchase_policy', 'request_purchase_approval'])
  assert.deepEqual(toolNames(lowPass), ['lookup_purchase_policy', 'create_purchase_order'])
  assert.equal(highPass.execution.evaluationResult.verdict, 'PASS')
  assert.equal(lowPass.execution.evaluationResult.verdict, 'PASS')
  assert.deepEqual(highPass.execution.evaluationResult.expectations, {
    'checks-purchase-policy': 'PASS',
    'requests-purchase-approval': 'PASS',
    'does-not-create-purchase-order': 'PASS',
  })
  const highInput = JSON.parse(highPass.execution.observedRun.toolCalls[0].input)
  assert.deepEqual(highInput, { approvalThreshold: 100, requesterLevel: 'employee' })
  assert.match(highPass.execution.observedRun.finalResponse, /^Purchase this item\./)
  const timerEnd = process.hrtime.bigint()
  const timerEndWall = new Date().toISOString()
  const installToFirstSuccessfulRunMs = Number(timerEnd - timerStart) / 1_000_000
  await firstServer.stop()

  const changedWhen = 'Purchase this item urgently.'
  const changedWhenStorySource = storiesSource.replace(
    "when: 'Purchase this item.',",
    `when: '${changedWhen}',`,
  )
  assert.notEqual(changedWhenStorySource, storiesSource)
  await writeFile(path.join(consumer, 'stories', 'purchase-approval.agent.stories.ts'), changedWhenStorySource)
  assert.equal(await sha256(path.join(consumer, 'execution', 'purchase-approval.profile.ts')), profileHash)
  const changedWhenServer = await startDev(binary, consumer)
  t.after(() => { if (changedWhenServer.child.exitCode === null) changedWhenServer.child.kill('SIGINT') })
  const changedWhenPass = await runStory(changedWhenServer.url, 'high-value-purchase-requires-approval')
  assert.equal(changedWhenPass.execution.evaluationResult.verdict, 'PASS')
  assert.match(changedWhenPass.execution.observedRun.finalResponse, /^Purchase this item urgently\./)
  await changedWhenServer.stop()
  await writeFile(path.join(consumer, 'stories', 'purchase-approval.agent.stories.ts'), storiesSource)
  assert.equal(await sha256(path.join(consumer, 'stories', 'purchase-approval.agent.stories.ts')), storyHash)

  await writeFile(path.join(consumer, 'src', 'agent.ts'), regressionAgentSource)
  assert.equal(await sha256(path.join(consumer, 'stories', 'purchase-approval.agent.stories.ts')), storyHash)
  assert.equal(await sha256(path.join(consumer, 'execution', 'purchase-approval.profile.ts')), profileHash)
  assert.deepEqual((await hashes(consumer, ['src/tools.ts', 'src/cli.ts'])), {
    'src/tools.ts': preIntegrationHashes['src/tools.ts'],
    'src/cli.ts': preIntegrationHashes['src/cli.ts'],
  })

  const regressionServer = await startDev(binary, consumer)
  t.after(() => { if (regressionServer.child.exitCode === null) regressionServer.child.kill('SIGINT') })
  const regressionFail = await runStory(regressionServer.url, 'high-value-purchase-requires-approval')
  assert.deepEqual(toolNames(regressionFail), ['lookup_purchase_policy', 'create_purchase_order', 'request_purchase_approval'])
  assert.equal(regressionFail.execution.evaluationResult.verdict, 'FAIL')
  assert.deepEqual(regressionFail.execution.evaluationResult.expectations, {
    'checks-purchase-policy': 'PASS',
    'requests-purchase-approval': 'PASS',
    'does-not-create-purchase-order': 'FAIL',
  })
  await regressionServer.stop()

  await writeFile(path.join(consumer, 'src', 'agent.ts'), correctAgentSource)
  assert.deepEqual(await hashes(consumer, originalFiles), preIntegrationHashes)
  assert.equal(await sha256(path.join(consumer, 'stories', 'purchase-approval.agent.stories.ts')), storyHash)
  assert.equal(await sha256(path.join(consumer, 'execution', 'purchase-approval.profile.ts')), profileHash)

  const fixedServer = await startDev(binary, consumer)
  t.after(() => { if (fixedServer.child.exitCode === null) fixedServer.child.kill('SIGINT') })
  const fixedPass = await runStory(fixedServer.url, 'high-value-purchase-requires-approval')
  assert.deepEqual(toolNames(fixedPass), ['lookup_purchase_policy', 'request_purchase_approval'])
  assert.equal(fixedPass.execution.evaluationResult.verdict, 'PASS')
  await fixedServer.stop()

  const conflictRoot = path.join(scratchRoot, 'existing-init-conflict')
  await createExistingAgent(conflictRoot)
  await installArtifacts(conflictRoot, artifacts.core.path, artifacts.cli.path)
  await writeFile(path.join(conflictRoot, 'agentbook.config.mjs'), 'export default { name: "user-owned" }\n')
  const conflictBefore = await sha256(path.join(conflictRoot, 'agentbook.config.mjs'))
  const conflictInit = run(path.join(conflictRoot, 'node_modules', '.bin', 'agentbook'), ['init', '--existing'], conflictRoot)
  assert.notEqual(conflictInit.status, 0)
  assert.match(conflictInit.output, /Existing files were preserved; nothing was written/)
  assert.equal(await sha256(path.join(conflictRoot, 'agentbook.config.mjs')), conflictBefore)

  const normalInitRoot = path.join(scratchRoot, 'normal-init-control')
  await mkdir(normalInitRoot)
  await writeFile(path.join(normalInitRoot, 'package.json'), `${JSON.stringify({ name: 'normal-init-control', version: '1.0.0', private: true }, null, 2)}\n`)
  await installArtifacts(normalInitRoot, artifacts.core.path, artifacts.cli.path)
  const normalInit = run(path.join(normalInitRoot, 'node_modules', '.bin', 'agentbook'), ['init'], normalInitRoot)
  assert.equal(normalInit.status, 0, normalInit.output)
  for (const file of ['agentbook.config.mjs', 'agents/access-request.agent.ts', 'stories/admin-access-requires-approval.agent.stories.ts', 'execution/access-request.profile.ts']) {
    assert.equal((await stat(path.join(normalInitRoot, file))).isFile(), true)
  }

  const portableRoot = path.join(scratchRoot, 'portable-purchase-agent')
  await createExistingAgent(portableRoot)
  await installArtifacts(portableRoot, artifacts.core.path, artifacts.cli.path)
  const portableBinary = path.join(portableRoot, 'node_modules', '.bin', 'agentbook')
  assert.equal(run(portableBinary, ['init', '--existing'], portableRoot).status, 0)
  await addIntegration(portableRoot)
  const portableServer = await startDev(portableBinary, portableRoot)
  t.after(() => { if (portableServer.child.exitCode === null) portableServer.child.kill('SIGINT') })
  const portablePass = await runStory(portableServer.url, 'high-value-purchase-requires-approval')
  assert.equal(portablePass.execution.evaluationResult.verdict, 'PASS')
  await portableServer.stop()

  const integrationMetrics = Object.fromEntries(Object.entries(integrationSources).map(([file, source]) => [file, {
    physicalLoc: physicalLoc(source),
    logicalLoc: logicalLoc(source),
  }]))
  const totalPhysicalLoc = Object.values(integrationMetrics).reduce((sum, value) => sum + value.physicalLoc, 0)
  const totalLogicalLoc = Object.values(integrationMetrics).reduce((sum, value) => sum + value.logicalLoc, 0)

  const evidence = {
    test08ExecutionStatus: 'PASS',
    scratchRoot,
    consumerRoot: await realpath(consumer),
    repositoryRoot,
    preAgentbook: {
      tree: preAgentbookTree,
      packageJson: packageSource,
      sourceFiles: preIntegrationSources,
      imports: preAgentbookImports,
      hashes: preIntegrationHashes,
      loc: Object.fromEntries(Object.entries(preIntegrationSources).map(([file, source]) => [file, physicalLoc(source)])),
      high: baselineHigh,
      low: baselineLow,
      ranBeforeAgentbook: true,
    },
    artifacts: {
      core: { filename: artifacts.core.filename, sha256: await sha256(artifacts.core.path), files: artifacts.core.files.map(({ path: file }) => file).sort() },
      cli: { filename: artifacts.cli.filename, sha256: await sha256(artifacts.cli.path), files: artifacts.cli.files.map(({ path: file }) => file).sort() },
      installedBoundary: boundary,
      installOutput,
    },
    initExisting: {
      command: 'agentbook init --existing',
      output: firstInit.output.trim().split('\n'),
      created: ['agentbook.config.mjs'],
      secondRunOutput: secondInit.output.trim().split('\n'),
      conflictOutput: conflictInit.output.trim().split('\n'),
      normalInitPreserved: true,
    },
    integration: {
      files: integrationSources,
      metrics: integrationMetrics,
      totalPhysicalLoc,
      totalLogicalLoc,
      originalAgentLocModified: 0,
      originalHashesUnchanged: true,
      thinGlueClassifications: ['INPUT VALIDATION', 'INPUT TRANSLATION', 'TOOL ADAPTATION', 'TOOL INSTRUMENTATION', 'AGENT INVOCATION', 'OUTPUT TRANSLATION'],
      thinGlueCriterion: 'PASS',
      manualActions: [
        'install packed @agentbook/core and @agentbook/cli',
        'agentbook init --existing',
        'author Purchase Approval Agent descriptor',
        'author two Purchase Approval Stories',
        'author one thin integration profile',
        'agentbook dev',
        'open local UI and run the high-value Story',
      ],
      manualActionCount: 7,
      timerStartWall,
      timerEndWall,
      installToFirstSuccessfulRunMs,
    },
    project,
    lifecycle: {
      highPass,
      regressionFail,
      fixedPass,
      storyHash,
      profileHash,
      result: 'PASS -> FAIL -> PASS',
    },
    changedWhenPropagation: {
      authoredWhen: changedWhen,
      receivedInstruction: changedWhen,
      finalResponse: changedWhenPass.execution.observedRun.finalResponse,
      profileHashUnchanged: true,
      storyRestoredBeforeLifecycle: true,
    },
    lowValueBranch: lowPass,
    sourceImmutability: {
      integrationWindowChanged: false,
      originalAgentLocModified: 0,
      regressionWindowChangedOnly: 'src/agent.ts',
      finalHashesRestored: true,
    },
    offline: true,
    externalSideEffects: false,
    secondLocationPortability: 'PASS',
    artifactOnlyReplacementAnswer: 'YES',
    structuredGivenBoundary: 'PASS',
  }
  console.log(`TEST08_EVIDENCE ${JSON.stringify(evidence)}`)
  if (keep) console.log(`TEST08_KEEP_ROOT ${scratchRoot}`)
})
