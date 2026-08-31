import { createHash, randomUUID } from 'node:crypto'
import { readFile, readdir, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { EthogramEngine, type EngineRunResult } from './generic-engine.js'
import type { ProjectDescriptor } from './contracts.js'
import { TypeScriptAdapter, TypeScriptAdapterError } from './typescript-adapter.js'

const ignoredDirectories = new Set([
  '.git', '.next', '.turbo', '.vercel', 'build', 'coverage', 'dist', 'node_modules',
])
const sourceExtensions = new Set(['.cjs', '.cts', '.js', '.json', '.mjs', '.mts', '.ts'])

export type ProjectSnapshot = {
  revision: string
  project: ProjectDescriptor
  storyDigests: Readonly<Record<string, string>>
}

export type ProjectOperationRequest =
  | { kind: 'inspect' }
  | {
      kind: 'run'
      storyId: string
      expectedRevision: string
      expectedStoryDigest: string
      executionId?: string
    }

export type ProjectOperationResult =
  | { kind: 'inspect'; snapshot: ProjectSnapshot }
  | { kind: 'run'; snapshot: ProjectSnapshot; run: EngineRunResult }

export type ProjectOperationOptions = {
  beforeRun?: (snapshot: ProjectSnapshot) => void | Promise<void>
}

export class ProjectRuntimeError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly effectsMayHaveOccurred = false,
    readonly retrySafe = !effectsMayHaveOccurred,
  ) {
    super(message)
    this.name = 'ProjectRuntimeError'
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function digest(value: unknown): string {
  return createHash('sha256').update(stableJson(value)).digest('hex')
}

async function projectSourceDigest(projectRoot: string): Promise<string> {
  const files: string[] = []
  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      if (ignoredDirectories.has(entry.name)) continue
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        await visit(absolute)
      } else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
        files.push(absolute)
      }
    }
  }
  await visit(projectRoot)
  files.sort()
  const hash = createHash('sha256')
  for (const file of files) {
    hash.update(path.relative(projectRoot, file).split(path.sep).join('/'))
    hash.update('\0')
    hash.update(await readFile(file))
    hash.update('\0')
  }
  return hash.digest('hex')
}

function runtimeError(error: unknown, effectsMayHaveOccurred = false): ProjectRuntimeError {
  if (error instanceof ProjectRuntimeError) return error
  if (error instanceof TypeScriptAdapterError) {
    return new ProjectRuntimeError(error.code, error.message, effectsMayHaveOccurred, !effectsMayHaveOccurred)
  }
  if (error instanceof Error) {
    const [candidate] = error.message.slice(0, 128).split(':', 1)
    const code = /^[A-Z][A-Z_]+$/.test(candidate) ? candidate : 'ETHOGRAM_RUNTIME_ERROR'
    return new ProjectRuntimeError(code, error.message, effectsMayHaveOccurred, !effectsMayHaveOccurred)
  }
  return new ProjectRuntimeError('ETHOGRAM_RUNTIME_ERROR', 'The Ethogram runtime operation failed.', effectsMayHaveOccurred, !effectsMayHaveOccurred)
}

async function stableSnapshot(projectRoot: string, expectedRevision?: string): Promise<{ snapshot: ProjectSnapshot; engine: EthogramEngine }> {
  let root: string
  try {
    root = await realpath(projectRoot)
    if (!(await stat(root)).isDirectory()) throw new Error('not-directory')
  } catch {
    throw new ProjectRuntimeError('INVALID_PROJECT_ROOT', 'The configured project root is not a readable directory.')
  }
  const before = await projectSourceDigest(root)
  if (expectedRevision !== undefined && before !== expectedRevision) {
    throw new ProjectRuntimeError('STALE_PROJECT', 'The project revision no longer matches the inspected revision.')
  }
  const engine = new EthogramEngine(new TypeScriptAdapter())
  let project: ProjectDescriptor
  try {
    project = await engine.loadProject(root)
  } catch (error) {
    throw runtimeError(error, true)
  }
  const after = await projectSourceDigest(root)
  if (before !== after) {
    throw new ProjectRuntimeError('STALE_PROJECT', 'Project sources changed while Ethogram was loading them.', true, false)
  }
  const storyDigests = Object.freeze(Object.fromEntries(project.stories.map((story) => [story.id, digest(story)])))
  return { snapshot: Object.freeze({ revision: after, project, storyDigests }), engine }
}

export async function executeProjectOperation(
  projectRoot: string,
  request: ProjectOperationRequest,
  options: ProjectOperationOptions = {},
): Promise<ProjectOperationResult> {
  const { snapshot, engine } = await stableSnapshot(
    projectRoot,
    request.kind === 'run' ? request.expectedRevision : undefined,
  )
  if (request.kind === 'inspect') return { kind: 'inspect', snapshot }

  if (request.expectedRevision !== snapshot.revision) {
    throw new ProjectRuntimeError('STALE_PROJECT', 'The project revision no longer matches the inspected revision.')
  }
  const storyDigest = snapshot.storyDigests[request.storyId]
  if (!storyDigest) {
    throw new ProjectRuntimeError(
      'STORY_NOT_FOUND',
      'The requested Story does not exist in the current project.',
      true,
      false,
    )
  }
  if (storyDigest !== request.expectedStoryDigest) {
    throw new ProjectRuntimeError('STALE_PROJECT', 'The Story contract no longer matches the inspected Story digest.', true, false)
  }

  try {
    await options.beforeRun?.(snapshot)
  } catch (error) {
    throw runtimeError(error, true)
  }

  const executionId = request.executionId ?? randomUUID()
  let run: EngineRunResult
  try {
    run = await engine.runStory(request.storyId, executionId)
  } catch (error) {
    throw runtimeError(error, true)
  }
  let afterRun: string
  try {
    afterRun = await projectSourceDigest(snapshot.project.projectRoot)
  } catch (error) {
    throw runtimeError(error, true)
  }
  if (afterRun !== snapshot.revision) {
    throw new ProjectRuntimeError(
      'STALE_EXECUTION',
      'Project sources changed after execution started.',
      true,
      false,
    )
  }
  return { kind: 'run', snapshot, run }
}
