import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { parseNpmPackOutput } from './parse-npm-pack-output.mjs'
import { verifyRelease } from './release-contract.mjs'

const npmInvocation = process.env.npm_execpath
  ? { command: process.execPath, prefix: [process.env.npm_execpath] }
  : { command: process.platform === 'win32' ? 'npm.cmd' : 'npm', prefix: [] }
let npmEnvironment = { ...process.env }

function npm(args, options = {}) {
  return execFileSync(npmInvocation.command, [...npmInvocation.prefix, ...args], {
    cwd: process.cwd(),
    env: npmEnvironment,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  })
}

function npmResult(args) {
  return spawnSync(npmInvocation.command, [...npmInvocation.prefix, ...args], {
    cwd: process.cwd(),
    env: npmEnvironment,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function registryIntegrity(name, version) {
  const result = npmResult(['view', `${name}@${version}`, 'dist.integrity', '--json'])
  if (result.status === 0) return JSON.parse(result.stdout)
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
  if (/\bE404\b|is not in this registry|Not found/i.test(output)) return undefined
  throw new Error(`Could not inspect ${name}@${version}:\n${output.trim()}`)
}

const dryRun = process.argv.includes('--dry-run')
const expectedTagIndex = process.argv.indexOf('--tag')
const expectedTag = expectedTagIndex === -1 ? undefined : process.argv[expectedTagIndex + 1]
const release = await verifyRelease({ tag: expectedTag })
const packDirectory = await mkdtemp(path.join(tmpdir(), 'ethogram-release-'))
npmEnvironment = {
  ...process.env,
  npm_config_cache: path.join(packDirectory, 'npm-cache'),
  npm_config_logs_dir: path.join(packDirectory, 'npm-logs'),
}

try {
  for (const releasePackage of release.packages) {
    const packed = parseNpmPackOutput(npm([
      'pack',
      path.resolve(releasePackage.directory),
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      packDirectory,
    ]), releasePackage.name)
    const tarball = path.join(packDirectory, packed.filename)

    if (dryRun) {
      console.log(`[dry-run] ${releasePackage.name}@${release.version} ${packed.integrity}`)
      continue
    }

    const publishedIntegrity = registryIntegrity(releasePackage.name, release.version)
    if (publishedIntegrity !== undefined) {
      if (publishedIntegrity !== packed.integrity) {
        throw new Error(`${releasePackage.name}@${release.version} already exists with different contents.`)
      }
      console.log(`${releasePackage.name}@${release.version} already exists with matching integrity; skipping.`)
      continue
    }

    console.log(`Publishing ${releasePackage.name}@${release.version} with npm dist-tag ${release.distTag}.`)
    npm([
      'publish',
      tarball,
      '--access',
      'public',
      '--tag',
      release.distTag,
      '--provenance',
    ], { stdio: 'inherit' })
  }
} finally {
  await rm(packDirectory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
