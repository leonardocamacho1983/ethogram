import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  discoverStoryFiles,
  generateRegistry,
} from '../scripts/generate-story-registry.mjs'

test('discovers Story files by convention without a manual registry', async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), 'agentbook-discovery-'))
  const registryDirectory = path.join(rootDirectory, 'lib/agentbook')
  const storyDirectory = path.join(rootDirectory, 'stories/nested')
  const registryPath = path.join(registryDirectory, 'generated-story-registry.ts')

  try {
    await mkdir(registryDirectory, { recursive: true })
    await mkdir(storyDirectory, { recursive: true })
    await writeFile(path.join(storyDirectory, 'new.agent.stories.ts'), 'export default {}')
    await writeFile(path.join(storyDirectory, 'ignored.stories.ts'), 'export default {}')

    const discovered = await discoverStoryFiles(rootDirectory)
    assert.deepEqual(discovered.map((file) => path.basename(file)), [
      'new.agent.stories.ts',
    ])

    await generateRegistry({ rootDirectory, registryPath })
    const registry = await readFile(registryPath, 'utf8')
    assert.match(registry, /new\.agent\.stories/)
    assert.doesNotMatch(registry, /ignored\.stories/)
  } finally {
    await rm(rootDirectory, { recursive: true, force: true })
  }
})
