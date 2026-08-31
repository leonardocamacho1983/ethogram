import { lstat, readdir, readFile, realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import type {
  ExecutionRequest,
  LanguageAdapter,
  ObservedRun,
  ObservedToolCall,
  ProjectDescriptor,
  StoryDescriptor,
} from './contracts.js'
import {
  ExternalEvidenceValidationError,
  normalizeExternalExecutionEvidence,
} from './external-evidence.js'

type NativeAgent = {
  id: string
  name: string
  description: string
  icon: string
}

type NativeStory = {
  readonly __ethogramType: 'story'
  id: string
  name: string
  agent: NativeAgent
  description: string
  given: StoryDescriptor['given']
  prompt: string
  expectations: StoryDescriptor['expectations']
  execution?: { kind: 'external-profile'; profile: string }
}

type NativeToolInput = Readonly<Record<string, unknown>>
type NativeToolOutput = Readonly<Record<string, unknown>>
type NativeExecutionProfile = {
  readonly __ethogramType: 'execution-profile'
  id: string
  tools: Readonly<Record<string, {
    description: string
    execute(input: NativeToolInput): NativeToolOutput | Promise<NativeToolOutput>
  }>>
  execute(context: {
    story: NativeStory
    callTool(name: string, input: NativeToolInput): Promise<NativeToolOutput>
  }): Promise<{ decision: string; finalResponse: string; evidence?: unknown }>
}

type ProjectConfig = {
  name?: string
  agentDirectories?: string[]
  storyDirectories?: string[]
  executionDirectories?: string[]
}

type NativeBinding = {
  story: NativeStory
  profile: NativeExecutionProfile
}

type Invocation = {
  callId: string
  name: string
  input: NativeToolInput
  output?: NativeToolOutput
  error?: { name?: string; message: string }
  status: 'success' | 'error'
  startedAt: string
  endedAt: string
  durationMs: number
}

export type TypeScriptAdapterErrorCode =
  | 'INVALID_PROJECT_ROOT'
  | 'MISSING_PROJECT_PACKAGE'
  | 'MISSING_ETHOGRAM_CONFIG'
  | 'INVALID_ETHOGRAM_CONFIG'
  | 'PROJECT_PATH_ESCAPE'
  | 'NO_STORIES'
  | 'INVALID_AGENT_EXPORT'
  | 'INVALID_STORY_EXPORT'
  | 'INVALID_EXECUTION_PROFILE_EXPORT'
  | 'DUPLICATE_AGENT_ID'
  | 'DUPLICATE_STORY_ID'
  | 'DUPLICATE_EXECUTION_PROFILE_ID'
  | 'UNKNOWN_STORY_AGENT'
  | 'UNKNOWN_EXECUTION_PROFILE'
  | 'INVALID_EXTERNAL_EXECUTION_EVIDENCE'
  | 'CONFLICTING_OBSERVATION_SOURCES'
  | 'PROFILE_EXECUTION_FAILED'

export class TypeScriptAdapterError extends Error {
  constructor(readonly code: TypeScriptAdapterErrorCode, message: string) {
    super(message)
    this.name = 'TypeScriptAdapterError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object')
}

function isAgent(value: unknown): value is NativeAgent {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.length > 0
    && value.id.length <= 200
    && typeof value.name === 'string'
    && value.name.length <= 1_000
    && typeof value.description === 'string'
    && value.description.length <= 4_000
    && typeof value.icon === 'string'
    && value.icon.length <= 200
}

function isGivenValue(value: unknown, ancestors: Set<object>): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value !== 'object' || ancestors.has(value)) return false
  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      return value.every((entry, index) => Object.prototype.hasOwnProperty.call(value, index) && isGivenValue(entry, ancestors))
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) return false
    return Reflect.ownKeys(value).every((key) => {
      if (typeof key !== 'string') return false
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      return Boolean(descriptor && !descriptor.get && !descriptor.set && isGivenValue(descriptor.value, ancestors))
    })
  } finally {
    ancestors.delete(value)
  }
}

function isGiven(value: unknown): value is StoryDescriptor['given'] {
  return Array.isArray(value)
    ? value.every((entry) => typeof entry === 'string')
    : isGivenValue(value, new Set()) && Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function isJsonRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
    && isGivenValue(value, new Set())
}

function isStory(value: unknown): value is NativeStory {
  return isRecord(value)
    && value.__ethogramType === 'story'
    && typeof value.id === 'string'
    && value.id.length > 0
    && value.id.length <= 200
    && typeof value.name === 'string'
    && value.name.length <= 1_000
    && isAgent(value.agent)
    && typeof value.description === 'string'
    && value.description.length <= 4_000
    && isGiven(value.given)
    && typeof value.prompt === 'string'
    && value.prompt.length <= 128_000
    && Array.isArray(value.expectations)
    && value.expectations.length > 0
    && (() => {
      const ids = new Set<string>()
      return value.expectations.every((candidate) => {
        if (!isRecord(candidate)
          || typeof candidate.id !== 'string'
          || !candidate.id.trim()
          || candidate.id.length > 200
          || ids.has(candidate.id)
          || typeof candidate.description !== 'string'
          || !candidate.description.trim()
          || candidate.description.length > 4_000
          || (candidate.failureDescription !== undefined
            && (typeof candidate.failureDescription !== 'string'
              || !candidate.failureDescription.trim()
              || candidate.failureDescription.length > 4_000))
          || !isRecord(candidate.matcher)
          || (candidate.matcher.kind !== 'tool-called' && candidate.matcher.kind !== 'tool-not-called')
          || typeof candidate.matcher.tool !== 'string'
          || !candidate.matcher.tool.trim()
          || candidate.matcher.tool.length > 200
          || ['passed', 'failed', 'status', 'verdict'].some((key) => Object.prototype.hasOwnProperty.call(candidate, key))) {
          return false
        }
        ids.add(candidate.id)
        return true
      })
    })()
}

function isProfile(value: unknown): value is NativeExecutionProfile {
  return isRecord(value)
    && value.__ethogramType === 'execution-profile'
    && typeof value.id === 'string'
    && value.id.length > 0
    && value.id.length <= 200
    && isRecord(value.tools)
    && typeof value.execute === 'function'
}

function cloneRecord<T extends Readonly<Record<string, unknown>>>(value: T): T {
  return structuredClone(value)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}

async function allFiles(directories: string[]): Promise<string[]> {
  const files: string[] = []
  async function visit(directory: string): Promise<void> {
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) await visit(absolute)
      else if (entry.isFile() || entry.isSymbolicLink()) files.push(absolute)
    }
  }
  for (const directory of directories) await visit(directory)
  return [...new Set(files)].sort()
}

function isInside(root: string, candidate: string): boolean {
  const relativePath = path.relative(root, candidate)
  return relativePath === '' || (!relativePath.startsWith(`..${path.sep}`) && relativePath !== '..' && !path.isAbsolute(relativePath))
}

async function confinedDirectories(root: string, entries: string[], field: string): Promise<string[]> {
  const directories: string[] = []
  for (const entry of entries) {
    if (path.isAbsolute(entry)) {
      throw new TypeScriptAdapterError('PROJECT_PATH_ESCAPE', `${field} must contain project-relative paths: ${entry}`)
    }
    const resolved = path.resolve(root, entry)
    if (!isInside(root, resolved)) {
      throw new TypeScriptAdapterError('PROJECT_PATH_ESCAPE', `${field} path escapes the project root: ${entry}`)
    }
    let canonical = resolved
    try {
      canonical = await realpath(resolved)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
    if (!isInside(root, canonical)) {
      throw new TypeScriptAdapterError('PROJECT_PATH_ESCAPE', `${field} path resolves outside the project root: ${entry}`)
    }
    directories.push(canonical)
  }
  return directories
}

function matches(filePath: string, stem: string): boolean {
  return ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'].some((extension) =>
    filePath.endsWith(`${stem}${extension}`),
  )
}

async function importNativeModule(filePath: string, projectRoot: string): Promise<Record<string, unknown>> {
  try {
    const result = await build({
      entryPoints: [filePath],
      absWorkingDir: projectRoot,
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      write: false,
      sourcemap: false,
      metafile: true,
      logLevel: 'silent',
    })
    for (const [importer, metadata] of Object.entries(result.metafile.inputs)) {
      const importerPath = path.isAbsolute(importer) ? importer : path.resolve(projectRoot, importer)
      if (!isInside(projectRoot, importerPath)) continue
      for (const imported of metadata.imports) {
        const original = imported.original ?? imported.path
        if (!original.startsWith('.') && !path.isAbsolute(original)) continue
        const resolved = path.isAbsolute(imported.path) ? imported.path : path.resolve(projectRoot, imported.path)
        let canonical = resolved
        try {
          canonical = await realpath(resolved)
        } catch {
          // esbuild owns missing-import diagnostics; this check only narrows resolved inputs.
        }
        if (!isInside(projectRoot, canonical)) {
          throw new TypeScriptAdapterError(
            'PROJECT_PATH_ESCAPE',
            `A project-relative import resolves outside the project root: ${original}`,
          )
        }
      }
    }
    const source = result.outputFiles[0]?.contents
    if (!source) throw new Error('The TypeScript adapter produced no executable module.')
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
    return await import(moduleUrl) as Record<string, unknown>
  } catch (error) {
    if (error instanceof TypeScriptAdapterError) throw error
    const detail = error instanceof Error ? error.message.split('\n')[0] : 'Unknown module-loading error.'
    throw new TypeScriptAdapterError(
      filePath.includes('.stories.') ? 'INVALID_STORY_EXPORT' : 'INVALID_EXECUTION_PROFILE_EXPORT',
      `Could not load ${filePath}: ${detail}`,
    )
  }
}

function uniqueById<T extends { id: string }>(
  values: Array<{ value: T; source: string }>,
  code: TypeScriptAdapterErrorCode,
  label: string,
): Array<{ value: T; source: string }> {
  const seen = new Set<string>()
  for (const item of values) {
    if (seen.has(item.value.id)) throw new TypeScriptAdapterError(code, `Duplicate ${label} identity: ${item.value.id}`)
    seen.add(item.value.id)
  }
  return values
}

function relative(root: string, filePath: string): string {
  return path.relative(root, filePath).split(path.sep).join('/')
}

function toToolCall(invocation: Invocation): ObservedToolCall {
  const base = {
    callId: invocation.callId,
    name: invocation.name,
    duration: `${invocation.durationMs}ms`,
    input: JSON.stringify(invocation.input),
    startedAt: invocation.startedAt,
    endedAt: invocation.endedAt,
  }
  return invocation.status === 'success'
    ? { ...base, status: 'success', output: JSON.stringify(invocation.output) }
    : { ...base, status: 'error', ...(invocation.error === undefined ? {} : { error: invocation.error }) }
}

export class TypeScriptAdapter implements LanguageAdapter {
  readonly id = 'typescript'
  private bindings = new Map<string, NativeBinding>()

  async loadProject(projectRoot: string): Promise<ProjectDescriptor> {
    let root: string
    try {
      root = await realpath(projectRoot)
      if (!(await stat(root)).isDirectory()) throw new Error('not-directory')
    } catch {
      throw new TypeScriptAdapterError('INVALID_PROJECT_ROOT', `Project root is not a readable directory: ${path.resolve(projectRoot)}`)
    }

    let packageName: string
    try {
      const packagePath = path.join(root, 'package.json')
      const packageMetadata = await lstat(packagePath)
      if (packageMetadata.isSymbolicLink() || !packageMetadata.isFile()) {
        throw new TypeScriptAdapterError('PROJECT_PATH_ESCAPE', 'package.json must be a regular file inside the project root.')
      }
      const packageJson = JSON.parse(await readFile(packagePath, 'utf8')) as { name?: unknown }
      if (typeof packageJson.name !== 'string' || !packageJson.name.trim()) throw new Error('missing-name')
      packageName = packageJson.name
    } catch (error) {
      if (error instanceof TypeScriptAdapterError) throw error
      throw new TypeScriptAdapterError('MISSING_PROJECT_PACKAGE', `Project ${root} must contain a package.json with a name.`)
    }

    const configPath = path.join(root, 'ethogram.config.mjs')
    try {
      const configMetadata = await lstat(configPath)
      if (configMetadata.isSymbolicLink()) {
        throw new TypeScriptAdapterError('PROJECT_PATH_ESCAPE', 'ethogram.config.mjs must not be a symbolic link.')
      }
      if (!configMetadata.isFile()) throw new Error('not-file')
    } catch (error) {
      if (error instanceof TypeScriptAdapterError) throw error
      throw new TypeScriptAdapterError(
        'MISSING_ETHOGRAM_CONFIG',
        `Project ${root} is not initialized. Run "ethogram init" first.`,
      )
    }

    let config: ProjectConfig
    try {
      const module = await importNativeModule(configPath, root)
      if (!isRecord(module.default)) throw new Error('missing-default')
      config = module.default as ProjectConfig
    } catch (error) {
      if (error instanceof TypeScriptAdapterError) {
        throw new TypeScriptAdapterError('INVALID_ETHOGRAM_CONFIG', `Invalid ethogram.config.mjs in ${root}: ${error.message}`)
      }
      throw new TypeScriptAdapterError('INVALID_ETHOGRAM_CONFIG', `Invalid ethogram.config.mjs in ${root}.`)
    }

    const configuredAgentDirectories = config.agentDirectories ?? ['agents']
    const configuredStoryDirectories = config.storyDirectories ?? ['stories']
    const configuredExecutionDirectories = config.executionDirectories ?? ['execution']
    if (![configuredAgentDirectories, configuredStoryDirectories, configuredExecutionDirectories].every((entries) =>
      Array.isArray(entries) && entries.every((entry) => typeof entry === 'string' && entry.length > 0),
    )) {
      throw new TypeScriptAdapterError('INVALID_ETHOGRAM_CONFIG', 'Ethogram directory configuration must contain string arrays.')
    }

    const [agentDirectories, storyDirectories, executionDirectories] = await Promise.all([
      confinedDirectories(root, configuredAgentDirectories, 'agentDirectories'),
      confinedDirectories(root, configuredStoryDirectories, 'storyDirectories'),
      confinedDirectories(root, configuredExecutionDirectories, 'executionDirectories'),
    ])

    const [agentFiles, storyFiles, profileFiles] = await Promise.all([
      allFiles(agentDirectories),
      allFiles(storyDirectories),
      allFiles(executionDirectories),
    ])

    const selectedAgentFiles = agentFiles.filter((file) => matches(file, '.agent'))
    const selectedStoryFiles = storyFiles.filter((file) => matches(file, '.agent.stories'))
    const selectedProfileFiles = profileFiles.filter((file) => matches(file, '.profile') || matches(file, '-profile'))
    await Promise.all([...selectedAgentFiles, ...selectedStoryFiles, ...selectedProfileFiles].map(async (file) => {
      if ((await lstat(file)).isSymbolicLink()) {
        throw new TypeScriptAdapterError(
          'PROJECT_PATH_ESCAPE',
          `Ethogram source entrypoints must not be symbolic links: ${relative(root, file)}`,
        )
      }
    }))

    const agentEntries = (await Promise.all(selectedAgentFiles.map(async (file) => {
      const module = await importNativeModule(file, root)
      const values = Object.values(module).filter(isAgent)
      if (values.length === 0) {
        throw new TypeScriptAdapterError('INVALID_AGENT_EXPORT', `No valid Agent export found in ${relative(root, file)}.`)
      }
      return values.map((value) => ({ value, source: relative(root, file) }))
    }))).flat()

    const storyEntries = (await Promise.all(selectedStoryFiles.map(async (file) => {
      const module = await importNativeModule(file, root)
      const values = Object.values(module).filter(isStory)
      if (values.length === 0) {
        throw new TypeScriptAdapterError('INVALID_STORY_EXPORT', `No valid Story export found in ${relative(root, file)}.`)
      }
      return values.map((value) => ({ value, source: relative(root, file) }))
    }))).flat()

    const profileEntries = (await Promise.all(selectedProfileFiles.map(async (file) => {
      const module = await importNativeModule(file, root)
      const values = Object.values(module).filter(isProfile)
      if (values.length === 0) {
        throw new TypeScriptAdapterError(
          'INVALID_EXECUTION_PROFILE_EXPORT',
          `No valid execution profile export found in ${relative(root, file)}.`,
        )
      }
      return values.map((value) => ({ value, source: relative(root, file) }))
    }))).flat()

    const agents = uniqueById(agentEntries, 'DUPLICATE_AGENT_ID', 'Agent')
    const stories = uniqueById(storyEntries, 'DUPLICATE_STORY_ID', 'Story')
    const profiles = uniqueById(profileEntries, 'DUPLICATE_EXECUTION_PROFILE_ID', 'execution profile')
    if (stories.length === 0) throw new TypeScriptAdapterError('NO_STORIES', `No Ethogram Stories were found in ${root}.`)

    const agentIds = new Set(agents.map(({ value }) => value.id))
    const profilesById = new Map(profiles.map(({ value }) => [value.id, value]))
    this.bindings = new Map()

    const descriptors = stories.map(({ value: story, source }): StoryDescriptor => {
      deepFreeze(story)
      if (!agentIds.has(story.agent.id)) {
        throw new TypeScriptAdapterError('UNKNOWN_STORY_AGENT', `Story ${story.id} references unknown Agent ${story.agent.id}.`)
      }
      const profileId = story.execution?.profile
      const profile = profileId ? profilesById.get(profileId) : undefined
      if (!profile) {
        throw new TypeScriptAdapterError(
          'UNKNOWN_EXECUTION_PROFILE',
          `Story ${story.id} references unavailable execution profile ${profileId ?? '(none)'}.`,
        )
      }
      this.bindings.set(story.id, { story, profile })
      return structuredClone({
        id: story.id,
        name: story.name,
        agent: story.agent,
        description: story.description,
        given: story.given,
        prompt: story.prompt,
        expectations: story.expectations,
        source,
        executable: true,
      })
    })

    return {
      projectRoot: root,
      name: typeof config.name === 'string' && config.name.trim() ? config.name : packageName,
      adapter: { id: this.id, label: 'TypeScript' },
      agents: agents.map(({ value }) => structuredClone(value)),
      stories: descriptors,
    }
  }

  async run(request: ExecutionRequest): Promise<ObservedRun> {
    const binding = this.bindings.get(request.story.id)
    if (!binding) throw new TypeScriptAdapterError('UNKNOWN_EXECUTION_PROFILE', `No TypeScript binding exists for ${request.story.id}.`)

    const trace: Invocation[] = []
    const startedAtMs = Date.now()
    try {
      const outcome = await binding.profile.execute({
        story: binding.story,
        callTool: async (name, input) => {
          if (typeof name !== 'string' || !name.trim() || name.length > 200 || !isJsonRecord(input)) {
            throw new TypeScriptAdapterError(
              'PROFILE_EXECUTION_FAILED',
              'PROFILE_EXECUTION_FAILED: callTool requires a bounded tool name and a finite JSON object input.',
            )
          }
          const tool = binding.profile.tools[name]
          if (!tool) throw new Error(`Execution profile requested unavailable tool: ${name}`)
          const callStartedMs = Date.now()
          const invocation: Invocation = {
            callId: `typescript-${trace.length + 1}`,
            name,
            input: cloneRecord(input),
            status: 'success',
            startedAt: new Date(callStartedMs).toISOString(),
            endedAt: '',
            durationMs: 0,
          }
          trace.push(invocation)
          try {
            const output = await tool.execute(cloneRecord(input))
            if (!isJsonRecord(output)) {
              throw new TypeScriptAdapterError(
                'PROFILE_EXECUTION_FAILED',
                'PROFILE_EXECUTION_FAILED: an intercepted tool must return a finite JSON object output.',
              )
            }
            invocation.output = cloneRecord(output)
            return cloneRecord(output)
          } catch (error) {
            invocation.status = 'error'
            invocation.output = undefined
            invocation.error = error instanceof Error
              ? { name: error.name, message: error.message }
              : { message: 'The tool execution failed.' }
            throw error
          } finally {
            const endedAtMs = Date.now()
            invocation.endedAt = new Date(endedAtMs).toISOString()
            invocation.durationMs = Math.max(0, endedAtMs - callStartedMs)
          }
        },
      })
      if (!outcome || typeof outcome !== 'object'
        || typeof outcome.decision !== 'string'
        || typeof outcome.finalResponse !== 'string') {
        throw new TypeScriptAdapterError(
          'PROFILE_EXECUTION_FAILED',
          'PROFILE_EXECUTION_FAILED: The execution profile must return string decision and finalResponse fields.',
        )
      }
      if (outcome.evidence !== undefined && trace.length > 0) {
        throw new TypeScriptAdapterError(
          'CONFLICTING_OBSERVATION_SOURCES',
          'CONFLICTING_OBSERVATION_SOURCES: A Run cannot use both Ethogram callTool evidence and external execution evidence.',
        )
      }
      const endedAtMs = Date.now()
      if (outcome.evidence !== undefined) {
        let normalized
        try {
          normalized = normalizeExternalExecutionEvidence(outcome.evidence)
        } catch (error) {
          if (error instanceof ExternalEvidenceValidationError) {
            throw new TypeScriptAdapterError(error.code, error.message)
          }
          throw error
        }
        return {
          decision: outcome.decision,
          reason: outcome.finalResponse,
          finalResponse: outcome.finalResponse,
          ...normalized,
        }
      }
      return {
        decision: outcome.decision,
        reason: outcome.finalResponse,
        finalResponse: outcome.finalResponse,
        toolCalls: trace.map(toToolCall),
        timeline: trace.map((invocation) => ({
          label: `Tool completed: ${invocation.name}`,
          detail: `Operational status: ${invocation.status}`,
          duration: `${invocation.durationMs}ms`,
        })),
        evidence: {
          provider: 'local-typescript-adapter',
          model: 'offline-deterministic-profile',
          startedAt: new Date(startedAtMs).toISOString(),
          endedAt: new Date(endedAtMs).toISOString(),
          latencyMs: Math.max(0, endedAtMs - startedAtMs),
          finishReason: 'completed',
          tokenUsage: { availability: 'unavailable' },
        },
      }
    } catch (error) {
      if (error instanceof TypeScriptAdapterError) throw error
      const detail = error instanceof Error ? error.message : 'Unknown profile execution error.'
      throw new TypeScriptAdapterError('PROFILE_EXECUTION_FAILED', `TypeScript execution profile failed: ${detail}`)
    }
  }
}
