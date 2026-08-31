import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, realpath, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { Client } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'
import { parseNpmPackOutput } from '../scripts/parse-npm-pack-output.mjs'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const packageRoots = ['agentbook', 'cli', 'mcp'].map((name) => path.join(repositoryRoot, 'packages', name))
const esbuildPlatformPackage = `${process.platform}-${process.arch}`
const externalPackageRoots = [
  path.join(repositoryRoot, 'node_modules', '@modelcontextprotocol', 'server'),
  path.join(repositoryRoot, 'node_modules', '@modelcontextprotocol', 'core'),
  path.join(repositoryRoot, 'node_modules', 'zod'),
  path.join(repositoryRoot, 'node_modules', 'esbuild'),
  path.join(repositoryRoot, 'node_modules', '@esbuild', esbuildPlatformPackage),
]

function environment() {
  const value = { ...process.env }
  delete value.NODE_PATH
  delete value.NODE_OPTIONS
  delete value.TS_NODE_PROJECT
  value.npm_config_update_notifier = 'false'
  value.npm_config_audit = 'false'
  value.npm_config_fund = 'false'
  value.npm_config_logs_dir = path.join(tmpdir(), 'ethogram-mcp-package-logs')
  value.npm_config_cache = path.join(tmpdir(), 'ethogram-mcp-package-npm-cache')
  return value
}

function run(command, args, cwd) {
  try {
    return { status: 0, output: execFileSync(command, args, { cwd, env: environment(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }
  } catch (error) {
    return { status: error.status ?? 1, output: `${error.stdout ?? ''}${error.stderr ?? ''}` }
  }
}

function runNpm(args, cwd) {
  return process.env.npm_execpath
    ? run(process.execPath, [process.env.npm_execpath, ...args], cwd)
    : run(npmCommand, args, cwd)
}

async function files(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true })
  const result = []
  for (const entry of entries) {
    const absolute = path.join(current, entry.name)
    if (entry.isDirectory()) result.push(...await files(root, absolute))
    else result.push(path.relative(root, absolute).split(path.sep).join('/'))
  }
  return result.sort()
}

test('packed @ethogram/mcp installs outside the monorepo and runs only from shipped artifacts', { timeout: 180_000 }, async (t) => {
  const scratch = await mkdtemp(path.join(tmpdir(), 'ethogram-mcp-package-'))
  t.after(() => rm(scratch, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }))
  const artifacts = path.join(scratch, 'artifacts')
  const consumer = path.join(scratch, 'consumer with spaces')
  await mkdir(artifacts)
  await mkdir(consumer)

  const tarballs = []
  for (const packageRoot of packageRoots) {
    const packed = runNpm(['pack', packageRoot, '--ignore-scripts', '--json', '--pack-destination', artifacts], repositoryRoot)
    assert.equal(packed.status, 0, packed.output)
    const metadata = parseNpmPackOutput(packed.output)
    tarballs.push(path.join(artifacts, metadata.filename))
  }
  const dependencyTarballs = []
  for (const packageRoot of externalPackageRoots) {
    const packed = runNpm(['pack', packageRoot, '--ignore-scripts', '--json', '--pack-destination', artifacts], repositoryRoot)
    assert.equal(packed.status, 0, packed.output)
    const metadata = parseNpmPackOutput(packed.output)
    dependencyTarballs.push(path.join(artifacts, metadata.filename))
  }

  const mcpExtract = path.join(scratch, 'mcp-extract')
  await mkdir(mcpExtract)
  const extracted = run('tar', ['-xzf', tarballs[2], '-C', mcpExtract], repositoryRoot)
  assert.equal(extracted.status, 0, extracted.output)
  const manifest = await files(path.join(mcpExtract, 'package'))
  for (const required of ['dist/cli.js', 'dist/index.js', 'dist/worker.js', 'dist/worker-client.js', 'dist/knowledge.js', 'dist/version.js', 'README.md', 'package.json']) {
    assert.equal(manifest.includes(required), true, `MCP package is missing ${required}`)
  }
  const packedJson = JSON.parse(await readFile(path.join(mcpExtract, 'package', 'package.json'), 'utf8'))
  const packedReadme = await readFile(path.join(mcpExtract, 'package', 'README.md'), 'utf8')
  assert.equal(packedJson.name, '@ethogram/mcp')
  assert.equal(packedJson.version, '0.1.0-alpha.2')
  assert.equal(packedJson.dependencies['@ethogram/cli'], '0.1.0-alpha.2')
  assert.match(packedJson.dependencies['@modelcontextprotocol/server'], /^\^2\./)
  assert.equal(packedJson.bin['ethogram-mcp'], 'dist/cli.js')
  assert.match(packedReadme, /ethogram_run_story/)
  assert.match(packedReadme, /SIGKILL/)
  assert.match(packedReadme, /0\.1\.0-alpha\.2/)
  const packedText = (await Promise.all(manifest.filter((file) => !file.endsWith('.json') || file === 'package.json').map((file) => readFile(path.join(mcpExtract, 'package', file), 'utf8')))).join('\n')
  assert.equal(packedText.includes(repositoryRoot), false)
  assert.equal(packedText.includes('/Users/'), false)

  await writeFile(path.join(consumer, 'package.json'), `${JSON.stringify({ name: 'packed-mcp-consumer', version: '1.0.0', private: true }, null, 2)}\n`)
  const install = runNpm(['install', '--save-dev', '--ignore-scripts', '--offline', '--no-audit', '--no-fund', ...tarballs, ...dependencyTarballs], consumer)
  assert.equal(install.status, 0, install.output)
  for (const packageName of ['core', 'cli', 'mcp']) {
    const installed = await realpath(path.join(consumer, 'node_modules', '@ethogram', packageName))
    assert.equal(installed.startsWith(`${await realpath(consumer)}${path.sep}`), true)
    assert.equal(installed.includes(repositoryRoot), false)
  }

  const ethogram = path.join(consumer, 'node_modules', '@ethogram', 'cli', 'dist', 'cli.js')
  const mcp = path.join(consumer, 'node_modules', '@ethogram', 'mcp', 'dist', 'cli.js')
  assert.equal(run(process.execPath, [ethogram, 'init'], consumer).status, 0)
  assert.equal(run(process.execPath, [mcp, '--version'], consumer).output.trim(), packedJson.version)
  assert.match(run(process.execPath, [mcp, '--help'], consumer).output, /acknowledgement/)
  const runtimeImport = run(process.execPath, ['--input-type=module', '--eval', "const runtime = await import('@ethogram/cli/runtime'); console.log(typeof runtime.executeProjectOperation)"], consumer)
  assert.equal(runtimeImport.status, 0, runtimeImport.output)
  assert.equal(runtimeImport.output.trim(), 'function')

  const client = new Client({ name: 'packed-ethogram-mcp-test', version: '1.0.0' })
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [mcp, '--project', consumer], stderr: 'pipe' }))
  try {
    assert.equal(client.getServerVersion()?.version, packedJson.version)
    const storyResult = await client.callTool({ name: 'ethogram_get_story', arguments: { storyId: 'admin-access-requires-approval' } })
    assert.equal(storyResult.isError, undefined, JSON.stringify(storyResult))
    const story = storyResult.structuredContent.data
    const runResult = await client.callTool({ name: 'ethogram_run_story', arguments: {
      storyId: story.id,
      expectedRevision: story.revision,
      expectedStoryDigest: story.storyDigest,
      acknowledgeExternalEffects: true,
    } })
    assert.equal(runResult.isError, undefined, JSON.stringify(runResult))
    assert.equal(runResult.structuredContent.data.execution.evaluationResult.verdict, 'PASS')
  } finally {
    await client.close()
  }
})
