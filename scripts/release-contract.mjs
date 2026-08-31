import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const releasePackages = [
  { name: '@ethogram/core', directory: 'packages/agentbook' },
  { name: '@ethogram/cli', directory: 'packages/cli' },
  { name: '@ethogram/mcp', directory: 'packages/mcp' },
]

async function readManifest(repositoryRoot, relativePath) {
  return JSON.parse(await readFile(path.join(repositoryRoot, relativePath, 'package.json'), 'utf8'))
}

export async function inspectRelease(repositoryRoot = process.cwd()) {
  const root = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'))
  const packages = await Promise.all(releasePackages.map(async (releasePackage) => ({
    ...releasePackage,
    manifest: await readManifest(repositoryRoot, releasePackage.directory),
  })))
  return {
    root,
    packages,
    version: root.version,
    distTag: root.version.includes('-') ? 'next' : 'latest',
  }
}

export async function verifyRelease({ repositoryRoot = process.cwd(), tag, prerelease } = {}) {
  const release = await inspectRelease(repositoryRoot)
  const errors = []
  const expectedTag = `v${release.version}`

  if (release.root.private !== true) errors.push('The monorepo root must remain private.')
  if (tag !== undefined && tag !== expectedTag) errors.push(`Release tag must be ${expectedTag}; received ${tag}.`)
  if (prerelease !== undefined && prerelease !== release.version.includes('-')) {
    errors.push(`GitHub prerelease=${prerelease} does not match version ${release.version}.`)
  }

  for (const releasePackage of release.packages) {
    const { manifest } = releasePackage
    if (manifest.name !== releasePackage.name) {
      errors.push(`${releasePackage.directory} must publish as ${releasePackage.name}; received ${manifest.name}.`)
    }
    if (manifest.version !== release.version) {
      errors.push(`${manifest.name} must use version ${release.version}; received ${manifest.version}.`)
    }
    if (manifest.private === true) errors.push(`${manifest.name} must not be private.`)
    if (manifest.publishConfig?.access !== 'public') errors.push(`${manifest.name} must set publishConfig.access to public.`)
    if (manifest.repository?.url !== 'git+https://github.com/leonardocamacho1983/ethogram.git') {
      errors.push(`${manifest.name} must identify the canonical GitHub repository.`)
    }
  }

  const byName = new Map(release.packages.map((releasePackage) => [releasePackage.name, releasePackage.manifest]))
  if (byName.get('@ethogram/cli')?.dependencies?.['@ethogram/core'] !== release.version) {
    errors.push(`@ethogram/cli must depend on @ethogram/core@${release.version}.`)
  }
  if (byName.get('@ethogram/mcp')?.dependencies?.['@ethogram/cli'] !== release.version) {
    errors.push(`@ethogram/mcp must depend on @ethogram/cli@${release.version}.`)
  }

  if (errors.length > 0) throw new Error(`Release contract failed:\n- ${errors.join('\n- ')}`)
  return { ...release, expectedTag }
}
