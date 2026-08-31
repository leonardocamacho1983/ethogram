import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parseNpmPackOutput } from '../scripts/parse-npm-pack-output.mjs'
import { verifyRelease } from '../scripts/release-contract.mjs'
import { isModeOnlyBinDiff } from '../scripts/verify-package-diff.mjs'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

test('release manifests are aligned and map prereleases to the npm next tag', async () => {
  const release = await verifyRelease({
    repositoryRoot,
    tag: 'v0.1.0-alpha.2',
    prerelease: true,
  })
  assert.equal(release.version, '0.1.0-alpha.2')
  assert.equal(release.distTag, 'next')
  assert.deepEqual(release.packages.map(({ name }) => name), [
    '@ethogram/core',
    '@ethogram/cli',
    '@ethogram/mcp',
  ])
})

test('release verification rejects the wrong Git tag', async () => {
  await assert.rejects(
    verifyRelease({ repositoryRoot, tag: 'v0.1.0-alpha.1', prerelease: true }),
    /Release tag must be v0\.1\.0-alpha\.2/,
  )
})

test('npm pack metadata accepts npm 11 and npm 12 JSON formats', () => {
  const metadata = { name: '@ethogram/core', filename: 'ethogram-core.tgz', integrity: 'sha512-example' }
  assert.deepEqual(parseNpmPackOutput(JSON.stringify([metadata]), '@ethogram/core'), metadata)
  assert.deepEqual(parseNpmPackOutput(JSON.stringify({ '@ethogram/core': metadata }), '@ethogram/core'), metadata)
  assert.throws(() => parseNpmPackOutput('{}'), /Expected one packed package/)
})

test('retry accepts mode-only diffs only for declared package bins', () => {
  const diff = [
    'diff --git a/dist/cli.js b/dist/cli.js',
    'old mode 100644',
    'new mode 100755',
    'index v0.1.0-alpha.2..v0.1.0-alpha.2 ',
    '--- a/dist/cli.js',
    '+++ b/dist/cli.js',
  ].join('\n')
  assert.equal(isModeOnlyBinDiff(diff, ['dist/cli.js']), true)
  assert.equal(isModeOnlyBinDiff(diff, []), false)
  assert.equal(isModeOnlyBinDiff(`${diff}\n@@ -1 +1 @@\n-old\n+new`, ['dist/cli.js']), false)
})

test('publish workflow uses GitHub Release OIDC without a registry token', async () => {
  const workflow = await readFile(new URL('../.github/workflows/publish.yml', import.meta.url), 'utf8')
  const publisher = await readFile(new URL('../scripts/publish-release.mjs', import.meta.url), 'utf8')
  assert.match(workflow, /release:\s*\n\s+types: \[published\]/)
  assert.match(workflow, /id-token: write/)
  assert.match(workflow, /actions\/checkout@[a-f0-9]{40}/)
  assert.match(workflow, /actions\/setup-node@[a-f0-9]{40}/)
  assert.match(workflow, /npm run release:publish/)
  assert.match(publisher, /'--provenance'/)
  assert.match(publisher, /'diff'/)
  assert.match(publisher, /different package contents/)
  assert.doesNotMatch(workflow, /NODE_AUTH_TOKEN|NPM_TOKEN|secrets\./)
})
