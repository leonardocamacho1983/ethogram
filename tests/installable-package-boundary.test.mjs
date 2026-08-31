import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cp,
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
const packageRoot = path.join(repositoryRoot, 'packages', 'agentbook')
const compilerPath = path.join(repositoryRoot, 'node_modules', 'typescript', 'bin', 'tsc')

function isolatedEnvironment() {
  const environment = { ...process.env }
  delete environment.NODE_PATH
  delete environment.NODE_OPTIONS
  delete environment.TS_NODE_PROJECT
  environment.npm_config_cache = path.join(tmpdir(), 'agentbook-test06-npm-cache')
  environment.npm_config_update_notifier = 'false'
  return environment
}

function run(command, args, cwd, options = {}) {
  try {
    return {
      status: 0,
      output: execFileSync(command, args, {
        cwd,
        env: isolatedEnvironment(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options,
      }),
    }
  } catch (error) {
    return {
      status: error.status ?? 1,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
    }
  }
}

function assertOutsideRepository(candidate) {
  const relative = path.relative(repositoryRoot, candidate)
  assert.notEqual(relative, '')
  assert.equal(relative.startsWith(`..${path.sep}`) || relative === '..', true)
  assert.equal(path.isAbsolute(relative), false)
}

async function listFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(current, entry.name)
    if (entry.isDirectory()) files.push(...await listFiles(root, absolute))
    else files.push(path.relative(root, absolute).split(path.sep).join('/'))
  }
  return files.sort()
}

const validConsumerSource = `
import {
  defineAgent,
  defineExecutionProfile,
  defineStory,
} from '@ethogram/core'
import type {
  Agent,
  ExpectationMatcher,
  ExternalExecutionContext,
  ExternalExecutionOutcome,
  ExternalExecutionProfile,
  ExternalToolDefinition,
  ExternalToolSet,
  Story,
  StoryExpectation,
  StoryGiven,
  StoryGivenValue,
  StoryInput,
  ToolCalledMatcher,
  ToolNotCalledMatcher,
} from '@ethogram/core'

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const invoiceAgent = defineAgent({
  id: 'invoice-review-agent',
  name: 'Invoice Review Agent',
  description: 'Reviews invoices against a local approval policy.',
  icon: 'search',
})

const calledMatcher: ToolCalledMatcher = { kind: 'tool-called', tool: 'lookup_invoice' }
const notCalledMatcher: ToolNotCalledMatcher = { kind: 'tool-not-called', tool: 'pay_invoice' }
const genericMatcher: ExpectationMatcher = calledMatcher

const expectations: StoryExpectation[] = [
  {
    id: 'checks-invoice-record',
    description: 'Checks the invoice record',
    matcher: genericMatcher,
  },
  {
    id: 'requests-manual-review',
    description: 'Requests manual review for a large invoice',
    matcher: { kind: 'tool-called', tool: 'request_invoice_review' },
  },
  {
    id: 'does-not-pay-directly',
    description: 'Does not pay the invoice before review',
    matcher: notCalledMatcher,
  },
]

const storyInput: StoryInput = {
  id: 'large-invoice-requires-review',
  name: 'Large Invoice Requires Review',
  agent: invoiceAgent,
  description: 'Invoices above the automatic limit require manual review.',
  given: ['invoiceId: INV-2048', 'amount: 18000', 'automaticApprovalLimit: 10000'],
  when: 'Review this invoice for payment.',
  then: expectations,
  execution: { kind: 'external-profile', profile: 'local-invoice-review' },
}

const story: Story = defineStory(storyInput)
const typedAgent: Agent = invoiceAgent
void typedAgent

const structuredGiven: StoryGiven = {
  purchaseAmount: 500,
  requesterLevel: 'employee',
  approvalThreshold: 100,
}
const nestedGivenValue: StoryGivenValue = { flags: [true, null, 'safe'] }
const structuredStory = defineStory({
  ...storyInput,
  id: 'structured-invoice-review',
  name: 'Structured Invoice Review',
  given: structuredGiven,
})
void nestedGivenValue

const tools = {
  lookup_invoice: {
    description: 'Look up a local invoice fixture.',
    execute: ({ invoiceId }) => ({ invoiceId, amount: 18000 }),
  },
  request_invoice_review: {
    description: 'Record a local manual review request.',
    execute: ({ invoiceId }) => ({ invoiceId, reviewId: 'LOCAL-REVIEW-001' }),
  },
  pay_invoice: {
    description: 'Record a local payment attempt.',
    execute: ({ invoiceId }) => ({ invoiceId, paid: true }),
  },
} satisfies ExternalToolSet

const definitionProof: ExternalToolDefinition = tools.lookup_invoice
void definitionProof

const profile: ExternalExecutionProfile = defineExecutionProfile({
  id: 'local-invoice-review',
  tools,
  async execute({ story: receivedStory, callTool }): Promise<ExternalExecutionOutcome> {
    invariant(receivedStory === story, 'Profile did not receive the authored Story.')
    await callTool('lookup_invoice', { invoiceId: 'INV-2048' })
    await callTool('request_invoice_review', { invoiceId: 'INV-2048' })
    return {
      decision: 'Request manual review',
      finalResponse: 'Manual review requested before payment.',
    }
  },
})

const trace: string[] = []
const context: ExternalExecutionContext = {
  story,
  async callTool(toolName, input) {
    const tool = profile.tools[toolName]
    invariant(tool, 'Profile requested an unavailable tool.')
    trace.push(toolName)
    return tool.execute(input)
  },
}
const outcome = await profile.execute(context)

function assertVerdictFree(value: unknown, location = 'story'): void {
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    invariant(!['passed', 'failed', 'status', 'verdict'].includes(key), location + '.' + key + ' contains a verdict field')
    invariant(nested !== 'PASS' && nested !== 'FAIL', location + '.' + key + ' contains a verdict value')
    assertVerdictFree(nested, location + '.' + key)
  }
}

assertVerdictFree(story)
invariant(story.agent === invoiceAgent, 'Agent identity was not preserved.')
invariant(story.prompt === 'Review this invoice for payment.', 'When/prompt was not preserved.')
invariant(Array.isArray(story.given) && story.given.includes('invoiceId: INV-2048'), 'Given data was not preserved.')
invariant(!Array.isArray(structuredStory.given), 'Structured GIVEN was not preserved.')
invariant(structuredStory.given.purchaseAmount === 500, 'Structured GIVEN value was not preserved.')
invariant(!Object.prototype.hasOwnProperty.call(structuredStory, 'scenario'), 'A parallel scenario property was introduced.')
invariant(story.expectations[0].matcher.kind === 'tool-called', 'tool-called matcher was not preserved.')
invariant(story.expectations[2].matcher.kind === 'tool-not-called', 'tool-not-called matcher was not preserved.')
invariant(trace.join(',') === 'lookup_invoice,request_invoice_review', 'Consumer handlers were not invoked in order.')
invariant(!trace.includes('pay_invoice'), 'The payment tool must remain available but uncalled.')

let runtimeVerdictRejected = false
try {
  defineStory({
    ...storyInput,
    expectations: [{
      id: 'invalid-runtime-verdict',
      description: 'Invalid runtime verdict',
      matcher: calledMatcher,
      passed: true,
    }],
    then: undefined,
  } as unknown as StoryInput)
} catch (error) {
  runtimeVerdictRejected = error instanceof Error && error.message.includes('passed')
}
invariant(runtimeVerdictRejected, 'Runtime authoring validation accepted a verdict field.')

console.log(JSON.stringify({
  resolved: import.meta.resolve('@ethogram/core'),
  agent: story.agent.name,
  story: story.name,
  given: story.given,
  prompt: story.prompt,
  matcherKinds: story.expectations.map(({ matcher }) => matcher.kind),
  verdictFree: true,
  runtimeVerdictRejected,
  profile: profile.id,
  availableTools: Object.keys(profile.tools),
  invokedTools: trace,
  outcome,
}))
`

const invalidConsumerSource = `
import type { StoryExpectation } from '@ethogram/core'

const passedExpectation: StoryExpectation = {
  id: 'invalid-passed',
  description: 'Must reject passed',
  matcher: { kind: 'tool-called', tool: 'lookup_invoice' },
  passed: true,
}

const statusExpectation: StoryExpectation = {
  id: 'invalid-status',
  description: 'Must reject status',
  matcher: { kind: 'tool-called', tool: 'lookup_invoice' },
  status: 'PASS',
}

const failedExpectation: StoryExpectation = {
  id: 'invalid-failed',
  description: 'Must reject failed',
  matcher: { kind: 'tool-called', tool: 'lookup_invoice' },
  failed: true,
}

const verdictExpectation: StoryExpectation = {
  id: 'invalid-verdict',
  description: 'Must reject verdict',
  matcher: { kind: 'tool-not-called', tool: 'pay_invoice' },
  verdict: 'FAIL',
}

void passedExpectation
void statusExpectation
void failedExpectation
void verdictExpectation
`

async function createConsumer(root, tarballSource) {
  assertOutsideRepository(root)
  const tarballName = path.basename(tarballSource)
  await cp(tarballSource, path.join(root, tarballName))
  await mkdir(path.join(root, 'src'), { recursive: true })
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 'clean-agentbook-consumer',
    version: '1.0.0',
    private: true,
    type: 'module',
    dependencies: { '@ethogram/core': `file:./${tarballName}` },
  }, null, 2))
  const compilerOptions = {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    lib: ['ES2022', 'DOM'],
    strict: true,
    skipLibCheck: false,
    outDir: 'dist',
  }
  await writeFile(path.join(root, 'tsconfig.json'), JSON.stringify({
    compilerOptions,
    include: ['src/index.ts'],
  }, null, 2))
  await writeFile(path.join(root, 'tsconfig.invalid.json'), JSON.stringify({
    compilerOptions: { ...compilerOptions, noEmit: true, outDir: undefined },
    include: ['src/invalid.ts'],
  }, null, 2))
  await writeFile(path.join(root, 'src', 'index.ts'), validConsumerSource)
  await writeFile(path.join(root, 'src', 'invalid.ts'), invalidConsumerSource)

  const install = run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--offline'], root)
  assert.equal(install.status, 0, install.output)

  const packageDirectory = path.join(root, 'node_modules', '@ethogram', 'core')
  const packageStats = await lstat(packageDirectory)
  assert.equal(packageStats.isSymbolicLink(), false)
  const resolvedDirectory = await realpath(packageDirectory)
  const resolvedConsumerRoot = await realpath(root)
  assert.equal(resolvedDirectory.startsWith(`${resolvedConsumerRoot}${path.sep}`), true)
  assert.equal(resolvedDirectory.includes(repositoryRoot), false)

  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'))
  assert.match(lock.packages[''].dependencies['@ethogram/core'], /^file:\.\/ethogram-core-/)
  assert.equal(lock.packages['node_modules/@ethogram/core'].link, undefined)
  assert.match(lock.packages['node_modules/@ethogram/core'].resolved, /^file:ethogram-core-/)

  const compile = run(process.execPath, [compilerPath, '--project', 'tsconfig.json'], root)
  assert.equal(compile.status, 0, compile.output)

  const invalidCompile = run(process.execPath, [compilerPath, '--project', 'tsconfig.invalid.json', '--pretty', 'false'], root)
  assert.notEqual(invalidCompile.status, 0)
  const invalidLines = invalidConsumerSource.split('\n')
  for (const field of ['passed', 'failed', 'status', 'verdict']) {
    const lineNumber = invalidLines.findIndex((line) => line.trimStart().startsWith(`${field}:`)) + 1
    assert.notEqual(lineNumber, 0)
    assert.match(
      invalidCompile.output,
      new RegExp(`invalid\\.ts\\(${lineNumber},3\\): error TS2322: Type .* is not assignable to type 'undefined'`),
    )
  }
  assert.match(invalidCompile.output, /TS2322/)
  assert.doesNotMatch(invalidCompile.output, /Cannot find module '@ethogram\/core'/)

  const privateImport = run(process.execPath, [
    '--input-type=module',
    '--eval',
    "await import('@ethogram/core/internal-something')",
  ], root)
  assert.notEqual(privateImport.status, 0)
  assert.match(privateImport.output, /ERR_PACKAGE_PATH_NOT_EXPORTED/)

  const runtime = run(process.execPath, ['dist/index.js'], root)
  assert.equal(runtime.status, 0, runtime.output)
  const runtimeEvidence = JSON.parse(runtime.output.trim())
  assert.match(runtimeEvidence.resolved, /node_modules\/@ethogram\/core\/dist\/index\.js$/)
  assert.equal(runtimeEvidence.resolved.includes(repositoryRoot), false)
  assert.equal(runtimeEvidence.agent, 'Invoice Review Agent')
  assert.equal(runtimeEvidence.story, 'Large Invoice Requires Review')
  assert.deepEqual(runtimeEvidence.matcherKinds, ['tool-called', 'tool-called', 'tool-not-called'])
  assert.equal(runtimeEvidence.verdictFree, true)
  assert.equal(runtimeEvidence.runtimeVerdictRejected, true)
  assert.deepEqual(runtimeEvidence.invokedTools, ['lookup_invoice', 'request_invoice_review'])
  assert.deepEqual(runtimeEvidence.availableTools, ['lookup_invoice', 'request_invoice_review', 'pay_invoice'])

  return {
    root,
    packageDirectory: resolvedDirectory,
    imports: ['@ethogram/core'],
    invalidDiagnostic: invalidCompile.output.trim(),
    privateSubpathDiagnostic: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
    runtime: runtimeEvidence,
  }
}

test('Test 06 packs and consumes @ethogram/core across two clean filesystem boundaries', async (t) => {
  const scratchRoot = await mkdtemp(path.join(tmpdir(), 'agentbook-test06-'))
  t.after(() => rm(scratchRoot, { recursive: true, force: true }))
  assertOutsideRepository(scratchRoot)

  const build = run('npm', ['run', 'core:build'], repositoryRoot)
  assert.equal(build.status, 0, build.output)

  const artifactDirectory = path.join(scratchRoot, 'artifact')
  await mkdir(artifactDirectory)
  const packed = run('npm', [
    'pack',
    packageRoot,
    '--ignore-scripts',
    '--json',
    '--pack-destination',
    artifactDirectory,
  ], repositoryRoot)
  assert.equal(packed.status, 0, packed.output)
  const [packResult] = JSON.parse(packed.output)
  const tarballPath = path.join(artifactDirectory, packResult.filename)
  const tarballBytes = await readFile(tarballPath)
  const sha256 = createHash('sha256').update(tarballBytes).digest('hex')
  assert.equal((await stat(tarballPath)).size, packResult.size)

  const extractRoot = path.join(scratchRoot, 'extracted')
  await mkdir(extractRoot)
  const extracted = run('tar', ['-xzf', tarballPath, '-C', extractRoot], repositoryRoot)
  assert.equal(extracted.status, 0, extracted.output)
  const actualManifest = await listFiles(extractRoot)
  const expectedManifest = [
    'package/README.md',
    'package/dist/index.cjs',
    'package/dist/index.d.ts',
    'package/dist/index.js',
    'package/package.json',
  ]
  assert.deepEqual(actualManifest, expectedManifest)
  assert.deepEqual(packResult.files.map(({ path: file }) => `package/${file}`).sort(), expectedManifest)

  const packedPackageJson = JSON.parse(await readFile(path.join(extractRoot, 'package', 'package.json'), 'utf8'))
  assert.equal(packedPackageJson.name, '@ethogram/core')
  assert.equal(packedPackageJson.version, '0.1.0-alpha.0')
  assert.equal(packedPackageJson.type, 'module')
  assert.deepEqual(packedPackageJson.exports, {
    '.': { types: './dist/index.d.ts', import: './dist/index.js', require: './dist/index.cjs' },
  })
  assert.equal(packedPackageJson.types, './dist/index.d.ts')
  assert.deepEqual(packedPackageJson.engines, { node: '>=20.9' })
  assert.deepEqual(packedPackageJson.files, ['dist', 'README.md'])
  assert.equal(packedPackageJson.dependencies, undefined)
  assert.equal(packedPackageJson.private, undefined)

  const textContents = []
  for (const relativePath of actualManifest) {
    textContents.push(await readFile(path.join(extractRoot, relativePath), 'utf8'))
  }
  const packedText = textContents.join('\n')
  for (const forbidden of [
    repositoryRoot,
    '/Users/',
    '../../lib/agentbook',
    '@/lib',
    'generated-story-registry',
    'AI_GATEWAY_API_KEY',
    'VERCEL_TOKEN',
    'AUTHORIZATION',
  ]) {
    assert.equal(packedText.includes(forbidden), false, `Packed content leaked forbidden marker: ${forbidden}`)
  }
  for (const file of actualManifest) {
    assert.doesNotMatch(file, /(^|\/)(app|tests|fixtures|screenshots|coverage|\.next|\.vercel)(\/|$)/)
    assert.doesNotMatch(file, /(^|\/)\.env(?:\.|$)|package-lock\.json$|\.map$/)
  }
  const runtimeSource = await readFile(path.join(extractRoot, 'package', 'dist', 'index.js'), 'utf8')
  const declarationSource = await readFile(path.join(extractRoot, 'package', 'dist', 'index.d.ts'), 'utf8')
  assert.doesNotMatch(runtimeSource, /(?:from|import\()\s*['"]/)
  assert.doesNotMatch(declarationSource, /(?:from|import\()\s*['"]|\.\.\//)
  assert.doesNotMatch(declarationSource, /ObservedRun|EvaluationResult|StoryPresentation|DisplayStory|StorySimulation/)

  const consumerOneRoot = path.join(scratchRoot, 'consumer-one')
  const consumerTwoRoot = path.join(scratchRoot, 'consumer-two')
  await mkdir(consumerOneRoot)
  await mkdir(consumerTwoRoot)
  const consumerOne = await createConsumer(consumerOneRoot, tarballPath)
  const consumerTwo = await createConsumer(consumerTwoRoot, tarballPath)

  const evidence = {
    repositoryRoot,
    artifact: {
      filename: packResult.filename,
      sha256,
      integrity: packResult.integrity,
      compressedSize: packResult.size,
      unpackedSize: packResult.unpackedSize,
      manifest: actualManifest,
    },
    packageJson: {
      name: packedPackageJson.name,
      version: packedPackageJson.version,
      type: packedPackageJson.type,
      exports: packedPackageJson.exports,
      types: packedPackageJson.types,
      engines: packedPackageJson.engines,
      files: packedPackageJson.files,
      dependencies: packedPackageJson.dependencies ?? {},
    },
    consumers: [consumerOne, consumerTwo].map(({ invalidDiagnostic, ...consumer }) => ({
      ...consumer,
      invalidDiagnostic: invalidDiagnostic.split('\n'),
    })),
    leakageScan: 'PASS',
    declarationsSelfContained: true,
    artifactOnlyAnswer: 'YES',
  }
  console.log(`TEST06_EVIDENCE ${JSON.stringify(evidence)}`)
})
