import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  access,
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { createServer as createNetServer } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parseNpmPackOutput } from '../scripts/parse-npm-pack-output.mjs'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const corePackageRoot = path.join(repositoryRoot, 'packages', 'agentbook')
const cliPackageRoot = path.join(repositoryRoot, 'packages', 'cli')
const esbuildPackageRoots = [
  path.join(repositoryRoot, 'node_modules', 'esbuild'),
  path.join(repositoryRoot, 'node_modules', '@esbuild', `${process.platform}-${process.arch}`),
]

function cleanEnvironment() {
  const environment = { ...process.env }
  for (const key of [
    'NODE_PATH',
    'NODE_OPTIONS',
    'TS_NODE_PROJECT',
    'TSX_TSCONFIG_PATH',
    'ETHOGRAM_PROJECT_ROOT',
    'AI_GATEWAY_API_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
  ]) delete environment[key]
  environment.npm_config_update_notifier = 'false'
  environment.npm_config_audit = 'false'
  environment.npm_config_fund = 'false'
  environment.npm_config_cache = path.join(tmpdir(), 'ethogram-test07-npm-cache')
  environment.npm_config_logs_dir = path.join(tmpdir(), 'ethogram-test07-npm-logs')
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
    return {
      status: error.status ?? 1,
      output: `${error.stdout ?? ''}${error.stderr ?? ''}`,
    }
  }
}

function assertOutsideRepository(candidate) {
  const relative = path.relative(repositoryRoot, candidate)
  assert.notEqual(relative, '')
  assert.equal(relative === '..' || relative.startsWith(`..${path.sep}`), true)
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

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex')
}

function assertVerdictFree(value, location = 'observedRun') {
  if (!value || typeof value !== 'object') return
  for (const [key, nested] of Object.entries(value)) {
    assert.equal(['passed', 'failed', 'verdict'].includes(key), false, `${location}.${key} contains a verdict field`)
    assert.equal(nested === 'PASS' || nested === 'FAIL', false, `${location}.${key} contains a verdict value`)
    assertVerdictFree(nested, `${location}.${key}`)
  }
}

async function createOrdinaryProject(root, name) {
  await mkdir(root, { recursive: true })
  const packageJson = `${JSON.stringify({ name, version: '1.0.0', private: true }, null, 2)}\n`
  await writeFile(path.join(root, 'package.json'), packageJson)
  return packageJson
}

async function startDev(binary, cwd, args) {
  const child = spawn(binary, ['dev', ...args], {
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
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for Ethogram dev.\n${output}`)), 15_000)
    const inspect = () => {
      const match = output.match(/Local URL: (http:\/\/127\.0\.0\.1:\d+\/)/)
      if (!match) return
      clearTimeout(timeout)
      resolve(match[1])
    }
    child.stdout.on('data', inspect)
    child.once('exit', (code) => {
      clearTimeout(timeout)
      reject(new Error(`Ethogram dev exited before readiness (${code}).\n${output}`))
    })
  })
  return {
    child,
    url,
    output: () => output,
    async stop() {
      child.kill('SIGINT')
      await new Promise((resolve) => child.once('exit', resolve))
      assert.match(output, /Ethogram developer server stopped\./)
    },
  }
}

async function installArtifacts(root, coreTarball, cliTarball, dependencyTarballs) {
  const install = run('npm', [
    'install',
    '--save-dev',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--offline',
    coreTarball,
    cliTarball,
    ...dependencyTarballs,
  ], root)
  assert.equal(install.status, 0, install.output)
  return install.output.trim()
}

async function installedBoundary(root) {
  const core = await realpath(path.join(root, 'node_modules', '@ethogram', 'core'))
  const cli = await realpath(path.join(root, 'node_modules', '@ethogram', 'cli'))
  const binaryLink = path.join(root, 'node_modules', '.bin', 'ethogram')
  const binaryTarget = await realpath(binaryLink)
  for (const resolved of [core, cli, binaryTarget]) {
    assert.equal(resolved.startsWith(`${await realpath(root)}${path.sep}`), true)
    assert.equal(resolved.includes(repositoryRoot), false)
  }
  assert.equal((await lstat(core)).isSymbolicLink(), false)
  assert.equal((await lstat(cli)).isSymbolicLink(), false)
  return { core, cli, binary: binaryTarget }
}

test('Test 07 packed artifacts provide five-minute zero-config onboarding', { timeout: 300_000 }, async (t) => {
  const scratchRoot = await mkdtemp(path.join(tmpdir(), 'agentbook-test07-'))
  t.after(() => rm(scratchRoot, { recursive: true, force: true }))
  assertOutsideRepository(scratchRoot)

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
  const corePackResult = parseNpmPackOutput(corePack.output, '@ethogram/core')
  const cliPackResult = parseNpmPackOutput(cliPack.output, '@ethogram/cli')
  const coreTarball = path.join(artifactDirectory, corePackResult.filename)
  const cliTarball = path.join(artifactDirectory, cliPackResult.filename)
  const dependencyTarballs = esbuildPackageRoots.map((packageRoot) => {
    const packed = run('npm', ['pack', packageRoot, '--ignore-scripts', '--json', '--pack-destination', artifactDirectory], repositoryRoot)
    assert.equal(packed.status, 0, packed.output)
    const metadata = parseNpmPackOutput(packed.output)
    return path.join(artifactDirectory, metadata.filename)
  })

  const extracted = path.join(scratchRoot, 'extracted')
  await mkdir(extracted)
  assert.equal(run('tar', ['-xzf', cliTarball, '-C', extracted], repositoryRoot).status, 0)
  const cliManifest = await listFiles(path.join(extracted, 'package'))
  const packedCliJson = JSON.parse(await readFile(path.join(extracted, 'package', 'package.json'), 'utf8'))
  assert.equal(packedCliJson.name, '@ethogram/cli')
  assert.equal(packedCliJson.bin.ethogram, 'dist/cli.js')
  assert.equal(packedCliJson.engines.node, '>=20.9')
  assert.equal(packedCliJson.dependencies['@ethogram/core'], '0.1.0-alpha.2')
  assert.match(packedCliJson.dependencies.esbuild, /^\^0\./)
  for (const required of [
    'dist/cli.js',
    'dist/generic-engine.js',
    'dist/evaluator.js',
    'dist/typescript-adapter.js',
    'dist/runtime/index.html',
    'dist/runtime/app.js',
    'dist/runtime/styles.css',
  ]) assert.equal(cliManifest.includes(required), true, `CLI artifact is missing ${required}`)
  const packedText = (await Promise.all(cliManifest
    .filter((file) => !file.endsWith('.png'))
    .map((file) => readFile(path.join(extracted, 'package', file), 'utf8')))).join('\n')
  for (const forbidden of [repositoryRoot, '/Users/', 'ETHOGRAM_PROJECT_ROOT', 'AI_GATEWAY_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY']) {
    assert.equal(packedText.includes(forbidden), false, `CLI artifact leaked ${forbidden}`)
  }

  const consumerOne = path.join(scratchRoot, 'consumer-one')
  const initialPackageJson = await createOrdinaryProject(consumerOne, 'test07-clean-consumer')
  assertOutsideRepository(consumerOne)
  assert.deepEqual(await listFiles(consumerOne), ['package.json'])
  assert.equal(initialPackageJson.includes('"type"'), false)
  for (const forbiddenPackage of ['typescript', 'tsx', 'ts-node', 'esbuild']) {
    assert.equal(initialPackageJson.includes(forbiddenPackage), false)
  }
  await assert.rejects(access(path.join(consumerOne, 'tsconfig.json')))
  await assert.rejects(access(path.join(consumerOne, 'node_modules')))

  const timerStartWall = new Date().toISOString()
  const timerStart = process.hrtime.bigint()
  const installOutput = await installArtifacts(consumerOne, coreTarball, cliTarball, dependencyTarballs)
  const boundary = await installedBoundary(consumerOne)
  const binary = path.join(consumerOne, 'node_modules', '.bin', 'ethogram')
  const packageAfterInstall = await readFile(path.join(consumerOne, 'package.json'), 'utf8')
  assert.equal(JSON.parse(packageAfterInstall).type, undefined)
  assert.equal(JSON.parse(packageAfterInstall).devDependencies.typescript, undefined)
  assert.equal(JSON.parse(packageAfterInstall).devDependencies.tsx, undefined)
  assert.equal(JSON.parse(packageAfterInstall).devDependencies['ts-node'], undefined)
  assert.equal((await stat(path.join(consumerOne, 'node_modules', 'esbuild'))).isDirectory(), true)

  const firstInit = run(binary, ['init'], consumerOne)
  assert.equal(firstInit.status, 0, firstInit.output)
  assert.match(firstInit.output, /Created ethogram\.config\.mjs/)
  const packageAfterInit = await readFile(path.join(consumerOne, 'package.json'), 'utf8')
  assert.equal(packageAfterInit, packageAfterInstall)
  await assert.rejects(access(path.join(consumerOne, 'tsconfig.json')))
  const generatedFiles = [
    'ethogram.config.mjs',
    'agents/access-request.agent.ts',
    'stories/admin-access-requires-approval.agent.stories.ts',
    'execution/access-request.profile.ts',
  ]
  for (const file of generatedFiles) assert.equal((await stat(path.join(consumerOne, file))).isFile(), true)
  const generatedImports = (await Promise.all(generatedFiles.map((file) => readFile(path.join(consumerOne, file), 'utf8'))))
    .flatMap((source) => [...source.matchAll(/from ['"]([^'"]+)['"]/g)].map((match) => match[1]))
  assert.deepEqual([...new Set(generatedImports.filter((value) => !value.startsWith('.')))], ['@ethogram/core'])

  const beforeSecondInit = await Promise.all(generatedFiles.map((file) => sha256(path.join(consumerOne, file))))
  const secondInit = run(binary, ['init'], consumerOne)
  assert.equal(secondInit.status, 0, secondInit.output)
  assert.match(secondInit.output, /already initialized/)
  assert.deepEqual(await Promise.all(generatedFiles.map((file) => sha256(path.join(consumerOne, file)))), beforeSecondInit)

  const helpResult = run(binary, ['--help'], consumerOne)
  const versionResult = run(binary, ['--version'], consumerOne)
  assert.equal(helpResult.status, 0, helpResult.output)
  assert.match(helpResult.output, /ethogram init/)
  assert.match(helpResult.output, /--project <path>/)
  assert.match(helpResult.output, /--no-open/)
  assert.equal(versionResult.output.trim(), packedCliJson.version)

  const dev = await startDev(binary, consumerOne, ['--no-open', '--port', '0'])
  t.after(() => { if (dev.child.exitCode === null) dev.child.kill('SIGINT') })
  assert.match(dev.output(), /Ethogram project: test07-clean-consumer/)
  assert.match(dev.output(), new RegExp(`Project root: ${(await realpath(consumerOne)).replaceAll('\\', '\\\\')}`))
  assert.match(dev.output(), /TypeScript adapter: ready \(1 Story\)/)
  const html = await (await fetch(dev.url)).text()
  const project = await (await fetch(new URL('/api/project', dev.url))).json()
  assert.match(html, /Ethogram Developer/)
  assert.equal(project.name, 'test07-clean-consumer')
  assert.equal(project.adapter.id, 'typescript')
  assert.deepEqual(project.agents.map(({ name }) => name), ['Access Request Agent'])
  assert.deepEqual(project.stories.map(({ name }) => name), ['Admin Access Requires Approval'])
  assert.equal(project.stories[0].source, 'stories/admin-access-requires-approval.agent.stories.ts')
  assert.equal(JSON.stringify(project).includes('acme-agents'), false)
  assert.equal(/refund|travel|invoice/i.test(JSON.stringify(project)), false)

  const runResponse = await fetch(new URL('/api/run', dev.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storyId: 'admin-access-requires-approval', ...project.runtime }),
  })
  const runPayload = await runResponse.json()
  assert.equal(runResponse.status, 200)
  assert.equal(runPayload.status, 'completed')
  const { observedRun, evaluationResult } = runPayload.execution
  assertVerdictFree(observedRun)
  assert.deepEqual(observedRun.toolCalls.map(({ name }) => name), ['check_access_policy', 'request_access_approval'])
  assert.equal(observedRun.toolCalls.some(({ name }) => name === 'grant_admin_access'), false)
  assert.equal(evaluationResult.verdict, 'PASS')
  assert.deepEqual(evaluationResult.expectations, {
    'checks-access-policy': 'PASS',
    'does-not-grant-directly': 'PASS',
    'requests-approval': 'PASS',
  })
  assert.equal(runPayload.boundaryEvidence.storyUnchanged, true)
  assert.equal(runPayload.boundaryEvidence.mockDataUsed, 'unknown')
  assert.equal(runPayload.boundaryEvidence.adapter, 'typescript')

  const storyPath = path.join(consumerOne, 'stories', 'admin-access-requires-approval.agent.stories.ts')
  const storyBeforeReload = await readFile(storyPath, 'utf8')
  await writeFile(storyPath, storyBeforeReload.replace(
    "name: 'Admin Access Requires Approval',",
    "name: 'Admin Access Requires Approval Reloaded',",
  ))
  let reloadedProject
  const reloadDeadline = Date.now() + 10_000
  while (Date.now() < reloadDeadline) {
    const response = await fetch(new URL('/api/project', dev.url))
    if (response.ok) {
      const candidate = await response.json()
      if (candidate.runtime.revision > project.runtime.revision) {
        reloadedProject = candidate
        break
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(reloadedProject, 'Ethogram did not reload the edited Story')
  assert.deepEqual(reloadedProject.stories.map(({ name }) => name), ['Admin Access Requires Approval Reloaded'])
  const staleRunResponse = await fetch(new URL('/api/run', dev.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storyId: 'admin-access-requires-approval', ...project.runtime }),
  })
  const staleRunPayload = await staleRunResponse.json()
  assert.equal(staleRunResponse.status, 400)
  assert.equal(staleRunPayload.error.code, 'STALE_PROJECT')
  assert.equal(JSON.stringify(staleRunPayload).includes('PASS'), false)
  const currentRunResponse = await fetch(new URL('/api/run', dev.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storyId: 'admin-access-requires-approval', ...reloadedProject.runtime }),
  })
  const currentRunPayload = await currentRunResponse.json()
  assert.equal(currentRunResponse.status, 200)
  assert.equal(currentRunPayload.execution.evaluationResult.verdict, 'PASS')

  const storyAfterNameReload = await readFile(storyPath, 'utf8')
  await writeFile(storyPath, storyAfterNameReload.replace(
    "requesterRole: 'developer',",
    "requesterRole: 'manager',",
  ))
  let changedInputProject
  const changedInputDeadline = Date.now() + 10_000
  while (Date.now() < changedInputDeadline) {
    const response = await fetch(new URL('/api/project', dev.url))
    if (response.ok) {
      const candidate = await response.json()
      if (candidate.runtime.revision > reloadedProject.runtime.revision) {
        changedInputProject = candidate
        break
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  assert.ok(changedInputProject, 'Ethogram did not reload the changed Story input')
  const changedInputResponse = await fetch(new URL('/api/run', dev.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ storyId: 'admin-access-requires-approval', ...changedInputProject.runtime }),
  })
  const changedInputPayload = await changedInputResponse.json()
  assert.equal(changedInputResponse.status, 200)
  assert.deepEqual(changedInputPayload.execution.observedRun.toolCalls.map(({ name }) => name), [
    'check_access_policy',
    'grant_admin_access',
  ])
  assert.equal(changedInputPayload.execution.evaluationResult.verdict, 'FAIL')
  const timerEnd = process.hrtime.bigint()
  const timerEndWall = new Date().toISOString()
  const elapsedMs = Number(timerEnd - timerStart) / 1_000_000
  assert.equal(elapsedMs <= 300_000, true, `Onboarding took ${elapsedMs}ms`)

  await dev.stop()
  const reusedPort = Number(new URL(dev.url).port)
  const portReuse = createNetServer()
  await new Promise((resolve, reject) => portReuse.listen(reusedPort, '127.0.0.1', resolve).once('error', reject))
  await new Promise((resolve) => portReuse.close(resolve))

  const consumerTwo = path.join(scratchRoot, 'consumer-two')
  await createOrdinaryProject(consumerTwo, 'test07-portable-consumer')
  await installArtifacts(consumerTwo, coreTarball, cliTarball, dependencyTarballs)
  const binaryTwo = path.join(consumerTwo, 'node_modules', '.bin', 'ethogram')
  assert.equal(run(binaryTwo, ['init'], consumerTwo).status, 0)
  await unlink(path.join(consumerTwo, 'execution', 'access-request.profile.ts'))
  const partialInit = run(binaryTwo, ['init'], consumerTwo)
  assert.equal(partialInit.status, 0, partialInit.output)
  assert.match(partialInit.output, /Created execution\/access-request\.profile\.ts/)
  assert.match(partialInit.output, /Preserved ethogram\.config\.mjs/)
  const explicitDev = await startDev(binaryTwo, scratchRoot, ['--project', consumerTwo, '--no-open', '--port', '0'])
  t.after(() => { if (explicitDev.child.exitCode === null) explicitDev.child.kill('SIGINT') })
  const portableProject = await (await fetch(new URL('/api/project', explicitDev.url))).json()
  assert.equal(portableProject.name, 'test07-portable-consumer')
  await explicitDev.stop()

  const conflictRoot = path.join(scratchRoot, 'conflict-consumer')
  await createOrdinaryProject(conflictRoot, 'test07-conflict-consumer')
  await installArtifacts(conflictRoot, coreTarball, cliTarball, dependencyTarballs)
  await mkdir(path.join(conflictRoot, 'agents'))
  await writeFile(path.join(conflictRoot, 'agents', 'access-request.agent.ts'), 'user owned content\n')
  const conflictBinary = path.join(conflictRoot, 'node_modules', '.bin', 'ethogram')
  const conflictInit = run(conflictBinary, ['init'], conflictRoot)
  assert.notEqual(conflictInit.status, 0)
  assert.match(conflictInit.output, /Existing files were preserved; nothing was written/)
  assert.equal(await readFile(path.join(conflictRoot, 'agents', 'access-request.agent.ts'), 'utf8'), 'user owned content\n')
  await assert.rejects(access(path.join(conflictRoot, 'ethogram.config.mjs')))

  const uninitializedRoot = path.join(scratchRoot, 'uninitialized-consumer')
  await createOrdinaryProject(uninitializedRoot, 'test07-uninitialized')
  await installArtifacts(uninitializedRoot, coreTarball, cliTarball, dependencyTarballs)
  const uninitializedBinary = path.join(uninitializedRoot, 'node_modules', '.bin', 'ethogram')
  const beforeInitDev = run(uninitializedBinary, ['dev', '--no-open', '--port', '0'], uninitializedRoot)
  assert.notEqual(beforeInitDev.status, 0)
  assert.match(beforeInitDev.output, /Run "ethogram init" first/)
  assert.doesNotMatch(beforeInitDev.output, /\n\s+at /)

  const invalidRoot = path.join(scratchRoot, 'invalid-story-consumer')
  await createOrdinaryProject(invalidRoot, 'test07-invalid-story')
  await installArtifacts(invalidRoot, coreTarball, cliTarball, dependencyTarballs)
  const invalidBinary = path.join(invalidRoot, 'node_modules', '.bin', 'ethogram')
  assert.equal(run(invalidBinary, ['init'], invalidRoot).status, 0)
  await writeFile(path.join(invalidRoot, 'stories', 'admin-access-requires-approval.agent.stories.ts'), 'export const invalid = true\n')
  const invalidStory = run(invalidBinary, ['dev', '--no-open', '--port', '0'], invalidRoot)
  assert.notEqual(invalidStory.status, 0)
  assert.match(invalidStory.output, /No valid Story export found.*admin-access-requires-approval\.agent\.stories\.ts/)
  assert.doesNotMatch(invalidStory.output, /\n\s+at /)

  const invalidProject = run(binaryTwo, ['dev', '--project', path.join(scratchRoot, 'missing'), '--no-open', '--port', '0'], scratchRoot)
  assert.notEqual(invalidProject.status, 0)
  assert.match(invalidProject.output, /Project root is not a readable directory/)

  const occupied = createNetServer()
  await new Promise((resolve, reject) => occupied.listen(0, '127.0.0.1', resolve).once('error', reject))
  const occupiedAddress = occupied.address()
  const occupiedPort = typeof occupiedAddress === 'object' ? occupiedAddress.port : 0
  const occupiedResult = run(binaryTwo, ['dev', '--no-open', '--port', String(occupiedPort)], consumerTwo)
  assert.notEqual(occupiedResult.status, 0)
  assert.match(occupiedResult.output, new RegExp(`port ${occupiedPort} is already in use`))
  assert.match(occupiedResult.output, /--port <number>/)
  await new Promise((resolve) => occupied.close(resolve))

  const runtimeIndex = path.join(consumerTwo, 'node_modules', '@ethogram', 'cli', 'dist', 'runtime', 'index.html')
  await unlink(runtimeIndex)
  const missingRuntime = run(binaryTwo, ['dev', '--no-open', '--port', '0'], consumerTwo)
  assert.notEqual(missingRuntime.status, 0)
  assert.match(missingRuntime.output, /Packaged developer runtime is incomplete.*Reinstall @ethogram\/cli/)

  const genericEngineSource = await readFile(path.join(repositoryRoot, 'packages', 'cli', 'src', 'generic-engine.ts'), 'utf8')
  const evaluatorSource = await readFile(path.join(repositoryRoot, 'packages', 'cli', 'src', 'evaluator.ts'), 'utf8')
  for (const source of [genericEngineSource, evaluatorSource]) {
    assert.doesNotMatch(source, /from ['"]esbuild['"]|profile\.execute|tool\.execute|\.agent\.stories\.|\.profile\./)
  }
  const adapterSource = await readFile(path.join(repositoryRoot, 'packages', 'cli', 'src', 'typescript-adapter.ts'), 'utf8')
  assert.match(adapterSource, /from 'esbuild'/)
  assert.match(adapterSource, /binding\.profile\.execute/)
  assert.doesNotMatch(adapterSource, /evaluateStory|EvaluationResult/)
  const runtimeSources = [
    'packages/cli/src/generic-engine.ts',
    'packages/cli/src/evaluator.ts',
    'packages/cli/src/server.ts',
    'packages/cli/src/runtime/app.js',
  ]
  const accessKnowledge = /Access Request|Admin Access|check_access_policy|grant_admin_access|request_access_approval/
  for (const file of runtimeSources) {
    assert.doesNotMatch(await readFile(path.join(repositoryRoot, file), 'utf8'), accessKnowledge)
  }

  const runtimeApplication = await readFile(
    path.join(repositoryRoot, 'packages/cli/src/runtime/app.js'),
    'utf8',
  )
  for (const renderedTarget of ['story-verdict', 'decision', 'final-response', 'assertion-count']) {
    assert.match(
      runtimeApplication,
      new RegExp(`id=["']${renderedTarget}["']`),
      `The browser runtime must render the #${renderedTarget} target that it updates after a Story run.`,
    )
  }

  const evidence = {
    artifacts: {
      core: { filename: corePackResult.filename, sha256: await sha256(coreTarball), manifest: corePackResult.files.map(({ path: file }) => file).sort() },
      cli: { filename: cliPackResult.filename, sha256: await sha256(cliTarball), manifest: cliManifest, dependencies: packedCliJson.dependencies },
    },
    consumer: {
      root: await realpath(consumerOne),
      initialFiles: ['package.json'],
      initialPackageType: null,
      preinstalledTypeScriptToolchain: [],
      installedBoundary: boundary,
      generatedFiles,
      generatedImports,
    },
    onboarding: {
      start: timerStartWall,
      end: timerEndWall,
      elapsedMs,
      developerActions: [
        'install @ethogram/core and @ethogram/cli tarballs',
        'ethogram init',
        'ethogram dev',
        'open the reported local URL',
        'click Run Story',
      ],
      developerActionCount: 5,
      installOutput,
    },
    project,
    observedRun,
    evaluationResult,
    boundaryEvidence: runPayload.boundaryEvidence,
    help: helpResult.output.trim().split('\n'),
    version: versionResult.output.trim(),
    gracefulShutdown: 'PASS',
    secondLocationPortability: 'PASS',
    errorUx: 'PASS',
    offlineInstall: true,
    artifactOnlyReplacementAnswer: 'YES',
    typescriptConfigurationAnswer: 'NO',
    futureAdapterSubstitutionAnswer: 'YES',
    genericEngineLanguageIndependenceAnswer: 'YES',
  }
  console.log(`TEST07_EVIDENCE ${JSON.stringify(evidence)}`)
})
