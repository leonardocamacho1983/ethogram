import { readdir, readFile, realpath, stat } from 'node:fs/promises'
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

type NativeAgent = {
  id: string
  name: string
  description: string
  icon: string
}

type NativeStory = {
  readonly __agentbookType: 'story'
  id: string
  name: string
  agent: NativeAgent
  description: string
  given: string[]
  prompt: string
  expectations: StoryDescriptor['expectations']
  execution?: { kind: 'external-profile'; profile: string }
}

type NativeToolInput = Readonly<Record<string, unknown>>
type NativeToolOutput = Readonly<Record<string, unknown>>
type NativeExecutionProfile = {
  readonly __agentbookType: 'execution-profile'
  id: string
  tools: Readonly<Record<string, {
    description: string
    execute(input: NativeToolInput): NativeToolOutput | Promise<NativeToolOutput>
  }>>
  execute(context: {
    story: NativeStory
    callTool(name: string, input: NativeToolInput): Promise<NativeToolOutput>
  }): Promise<{ decision: string; finalResponse: string }>
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
  output: NativeToolOutput
  status: 'success' | 'error'
  startedAt: string
  endedAt: string
  durationMs: number
}

export type TypeScriptAdapterErrorCode =
  | 'INVALID_PROJECT_ROOT'
  | 'MISSING_PROJECT_PACKAGE'
  | 'MISSING_AGENTBOOK_CONFIG'
  | 'INVALID_AGENTBOOK_CONFIG'
  | 'NO_STORIES'
  | 'INVALID_AGENT_EXPORT'
  | 'INVALID_STORY_EXPORT'
  | 'INVALID_EXECUTION_PROFILE_EXPORT'
  | 'DUPLICATE_AGENT_ID'
  | 'DUPLICATE_STORY_ID'
  | 'DUPLICATE_EXECUTION_PROFILE_ID'
  | 'UNKNOWN_STORY_AGENT'
  | 'UNKNOWN_EXECUTION_PROFILE'
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
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.icon === 'string'
}

function isStory(value: unknown): value is NativeStory {
  return isRecord(value)
    && value.__agentbookType === 'story'
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && isAgent(value.agent)
    && typeof value.description === 'string'
    && Array.isArray(value.given)
    && typeof value.prompt === 'string'
    && Array.isArray(value.expectations)
}

function isProfile(value: unknown): value is NativeExecutionProfile {
  return isRecord(value)
    && value.__agentbookType === 'execution-profile'
    && typeof value.id === 'string'
    && isRecord(value.tools)
    && typeof value.execute === 'function'
}

function cloneRecord<T extends Readonly<Record<string, unknown>>>(value: T): T {
  return structuredClone(value)
}

async function allFiles(root: string, directories: string[]): Promise<string[]> {
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
      else files.push(absolute)
    }
  }
  for (const directory of directories) await visit(path.resolve(root, directory))
  return [...new Set(files)].sort()
}

function matches(filePath: string, stem: string): boolean {
  return ['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs'].some((extension) =>
    filePath.endsWith(`${stem}${extension}`),
  )
}

async function importNativeModule(filePath: string): Promise<Record<string, unknown>> {
  try {
    const result = await build({
      entryPoints: [filePath],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node20',
      write: false,
      sourcemap: false,
      logLevel: 'silent',
    })
    const source = result.outputFiles[0]?.contents
    if (!source) throw new Error('The TypeScript adapter produced no executable module.')
    const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
    return await import(moduleUrl) as Record<string, unknown>
  } catch (error) {
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
  return {
    callId: invocation.callId,
    name: invocation.name,
    status: invocation.status,
    duration: `${invocation.durationMs}ms`,
    input: JSON.stringify(invocation.input),
    output: JSON.stringify(invocation.output),
    startedAt: invocation.startedAt,
    endedAt: invocation.endedAt,
  }
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
      const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')) as { name?: unknown }
      if (typeof packageJson.name !== 'string' || !packageJson.name.trim()) throw new Error('missing-name')
      packageName = packageJson.name
    } catch {
      throw new TypeScriptAdapterError('MISSING_PROJECT_PACKAGE', `Project ${root} must contain a package.json with a name.`)
    }

    const configPath = path.join(root, 'agentbook.config.mjs')
    try {
      if (!(await stat(configPath)).isFile()) throw new Error('not-file')
    } catch {
      throw new TypeScriptAdapterError(
        'MISSING_AGENTBOOK_CONFIG',
        `Project ${root} is not initialized. Run "agentbook init" first.`,
      )
    }

    let config: ProjectConfig
    try {
      const module = await importNativeModule(configPath)
      if (!isRecord(module.default)) throw new Error('missing-default')
      config = module.default as ProjectConfig
    } catch (error) {
      if (error instanceof TypeScriptAdapterError) {
        throw new TypeScriptAdapterError('INVALID_AGENTBOOK_CONFIG', `Invalid agentbook.config.mjs in ${root}: ${error.message}`)
      }
      throw new TypeScriptAdapterError('INVALID_AGENTBOOK_CONFIG', `Invalid agentbook.config.mjs in ${root}.`)
    }

    const agentDirectories = config.agentDirectories ?? ['agents']
    const storyDirectories = config.storyDirectories ?? ['stories']
    const executionDirectories = config.executionDirectories ?? ['execution']
    if (![agentDirectories, storyDirectories, executionDirectories].every((entries) =>
      Array.isArray(entries) && entries.every((entry) => typeof entry === 'string' && entry.length > 0),
    )) {
      throw new TypeScriptAdapterError('INVALID_AGENTBOOK_CONFIG', 'Agentbook directory configuration must contain string arrays.')
    }

    const [agentFiles, storyFiles, profileFiles] = await Promise.all([
      allFiles(root, agentDirectories),
      allFiles(root, storyDirectories),
      allFiles(root, executionDirectories),
    ])

    const selectedAgentFiles = agentFiles.filter((file) => matches(file, '.agent'))
    const selectedStoryFiles = storyFiles.filter((file) => matches(file, '.agent.stories'))
    const selectedProfileFiles = profileFiles.filter((file) => matches(file, '.profile') || matches(file, '-profile'))

    const agentEntries = (await Promise.all(selectedAgentFiles.map(async (file) => {
      const module = await importNativeModule(file)
      const values = Object.values(module).filter(isAgent)
      if (values.length === 0) {
        throw new TypeScriptAdapterError('INVALID_AGENT_EXPORT', `No valid Agent export found in ${relative(root, file)}.`)
      }
      return values.map((value) => ({ value, source: relative(root, file) }))
    }))).flat()

    const storyEntries = (await Promise.all(selectedStoryFiles.map(async (file) => {
      const module = await importNativeModule(file)
      const values = Object.values(module).filter(isStory)
      if (values.length === 0) {
        throw new TypeScriptAdapterError('INVALID_STORY_EXPORT', `No valid Story export found in ${relative(root, file)}.`)
      }
      return values.map((value) => ({ value, source: relative(root, file) }))
    }))).flat()

    const profileEntries = (await Promise.all(selectedProfileFiles.map(async (file) => {
      const module = await importNativeModule(file)
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
    if (stories.length === 0) throw new TypeScriptAdapterError('NO_STORIES', `No Agentbook Stories were found in ${root}.`)

    const agentIds = new Set(agents.map(({ value }) => value.id))
    const profilesById = new Map(profiles.map(({ value }) => [value.id, value]))
    this.bindings = new Map()

    const descriptors = stories.map(({ value: story, source }): StoryDescriptor => {
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
          const tool = binding.profile.tools[name]
          if (!tool) throw new Error(`Execution profile requested unavailable tool: ${name}`)
          const callStartedMs = Date.now()
          const invocation: Invocation = {
            callId: `typescript-${trace.length + 1}`,
            name,
            input: cloneRecord(input),
            output: {},
            status: 'success',
            startedAt: new Date(callStartedMs).toISOString(),
            endedAt: '',
            durationMs: 0,
          }
          trace.push(invocation)
          try {
            const output = await tool.execute(cloneRecord(input))
            invocation.output = cloneRecord(output)
            return cloneRecord(output)
          } catch (error) {
            invocation.status = 'error'
            invocation.output = { error: error instanceof Error ? error.name : 'ToolExecutionError' }
            throw error
          } finally {
            const endedAtMs = Date.now()
            invocation.endedAt = new Date(endedAtMs).toISOString()
            invocation.durationMs = Math.max(0, endedAtMs - callStartedMs)
          }
        },
      })
      const endedAtMs = Date.now()
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
      const detail = error instanceof Error ? error.message : 'Unknown profile execution error.'
      throw new TypeScriptAdapterError('PROFILE_EXECUTION_FAILED', `TypeScript execution profile failed: ${detail}`)
    }
  }
}
