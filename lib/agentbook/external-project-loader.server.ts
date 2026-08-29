import { readdir, readFile, realpath, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { isStory } from './define-story.ts'
import type { Agent, Story } from './domain.ts'
import { isExternalExecutionProfile, type ExternalExecutionProfile } from './external-execution.ts'

export type ExternalProjectLoadErrorCode =
  | 'MISSING_PROJECT_ROOT'
  | 'INVALID_PROJECT_ROOT'
  | 'MISSING_PROJECT_PACKAGE'
  | 'INVALID_AGENT_EXPORT'
  | 'INVALID_STORY_EXPORT'
  | 'INVALID_EXECUTION_PROFILE_EXPORT'
  | 'DUPLICATE_AGENT_ID'
  | 'DUPLICATE_STORY_ID'
  | 'DUPLICATE_EXECUTION_PROFILE_ID'
  | 'UNKNOWN_STORY_AGENT'
  | 'UNKNOWN_EXECUTION_PROFILE'

export class ExternalProjectLoadError extends Error {
  readonly code: ExternalProjectLoadErrorCode

  constructor(code: ExternalProjectLoadErrorCode, message: string) {
    super(message)
    this.name = 'ExternalProjectLoadError'
    this.code = code
  }
}

export type LoadedAgentbookProject = {
  projectRoot: string
  packageName: string
  agents: Agent[]
  stories: Story[]
  executionProfiles: ExternalExecutionProfile[]
  sources: {
    agents: Readonly<Record<string, string>>
    stories: Readonly<Record<string, string>>
    executionProfiles: Readonly<Record<string, string>>
  }
}

type ProjectModule = Record<string, unknown>

const supportedExtensions = ['.ts', '.mts', '.js', '.mjs'] as const
const requireProjectModule = createRequire(import.meta.url)

function matchesConvention(filePath: string, stem: string): boolean {
  return supportedExtensions.some((extension) => filePath.endsWith(`${stem}${extension}`))
}

function isAgent(value: unknown): value is Agent {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'description' in value &&
    typeof value.description === 'string' &&
    'icon' in value &&
    ['headset', 'target', 'search'].includes(String(value.icon)),
  )
}

async function projectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries
    .filter((entry) => entry.name !== 'node_modules' && entry.name !== '.git')
    .map(async (entry) => {
      const entryPath = path.join(directory, entry.name)
      return entry.isDirectory() ? projectFiles(entryPath) : [entryPath]
    }))
  return nested.flat().sort()
}

async function importProjectModule(filePath: string): Promise<ProjectModule> {
  return Reflect.apply(requireProjectModule, undefined, [filePath]) as ProjectModule
}

function relativeSource(projectRoot: string, filePath: string): string {
  return path.relative(projectRoot, filePath).split(path.sep).join('/')
}

function uniqueById<T extends { id: string }>(
  values: Array<{ value: T; source: string }>,
  duplicateCode: ExternalProjectLoadErrorCode,
  label: string,
): Array<{ value: T; source: string }> {
  const seen = new Set<string>()
  for (const item of values) {
    if (seen.has(item.value.id)) {
      throw new ExternalProjectLoadError(duplicateCode, `Duplicate ${label} identity: ${item.value.id}`)
    }
    seen.add(item.value.id)
  }
  return values
}

export async function loadAgentbookProject(projectRoot: string): Promise<LoadedAgentbookProject> {
  if (typeof projectRoot !== 'string' || projectRoot.trim() === '') {
    throw new ExternalProjectLoadError('MISSING_PROJECT_ROOT', 'An external project root is required.')
  }

  let canonicalRoot: string
  try {
    canonicalRoot = await realpath(projectRoot)
    if (!(await stat(canonicalRoot)).isDirectory()) throw new Error('not-directory')
  } catch {
    throw new ExternalProjectLoadError('INVALID_PROJECT_ROOT', 'The external project root is not a readable directory.')
  }

  let packageName: string
  try {
    const packageJson = JSON.parse(await readFile(path.join(canonicalRoot, 'package.json'), 'utf8')) as { name?: unknown }
    if (typeof packageJson.name !== 'string' || packageJson.name.trim() === '') throw new Error('invalid-package')
    packageName = packageJson.name
  } catch {
    throw new ExternalProjectLoadError('MISSING_PROJECT_PACKAGE', 'The external project must contain a valid package.json name.')
  }

  const files = await projectFiles(canonicalRoot)
  const agentFiles = files.filter((file) => matchesConvention(file, '.agent'))
  const storyFiles = files.filter((file) => matchesConvention(file, '.agent.stories'))
  const profileFiles = files.filter((file) =>
    matchesConvention(file, '.profile') || matchesConvention(file, '-profile'),
  )

  const agentEntries = (await Promise.all(agentFiles.map(async (file) => {
    const module = await importProjectModule(file)
    const agents = Object.values(module).filter(isAgent)
    if (agents.length === 0) {
      throw new ExternalProjectLoadError('INVALID_AGENT_EXPORT', `No valid Agent export found in ${relativeSource(canonicalRoot, file)}.`)
    }
    return agents.map((value) => ({ value, source: relativeSource(canonicalRoot, file) }))
  }))).flat()

  const storyEntries = (await Promise.all(storyFiles.map(async (file) => {
    const module = await importProjectModule(file)
    const stories = Object.values(module).filter(isStory)
    if (stories.length === 0) {
      throw new ExternalProjectLoadError('INVALID_STORY_EXPORT', `No valid Story export found in ${relativeSource(canonicalRoot, file)}.`)
    }
    return stories.map((value) => ({ value, source: relativeSource(canonicalRoot, file) }))
  }))).flat()

  const profileEntries = (await Promise.all(profileFiles.map(async (file) => {
    const module = await importProjectModule(file)
    const profiles = Object.values(module).filter(isExternalExecutionProfile)
    if (profiles.length === 0) {
      throw new ExternalProjectLoadError(
        'INVALID_EXECUTION_PROFILE_EXPORT',
        `No valid execution profile export found in ${relativeSource(canonicalRoot, file)}.`,
      )
    }
    return profiles.map((value) => ({ value, source: relativeSource(canonicalRoot, file) }))
  }))).flat()

  const uniqueAgents = uniqueById(agentEntries, 'DUPLICATE_AGENT_ID', 'Agent')
  const uniqueStories = uniqueById(storyEntries, 'DUPLICATE_STORY_ID', 'Story')
  const uniqueProfiles = uniqueById(profileEntries, 'DUPLICATE_EXECUTION_PROFILE_ID', 'execution profile')
  const agentIds = new Set(uniqueAgents.map(({ value }) => value.id))
  const profilesById = new Map(uniqueProfiles.map(({ value }) => [value.id, value]))

  for (const { value: story } of uniqueStories) {
    if (!agentIds.has(story.agent.id)) {
      throw new ExternalProjectLoadError('UNKNOWN_STORY_AGENT', `Story ${story.id} references unknown Agent ${story.agent.id}.`)
    }
    if (story.execution?.kind === 'external-profile' && !profilesById.has(story.execution.profile)) {
      throw new ExternalProjectLoadError(
        'UNKNOWN_EXECUTION_PROFILE',
        `Story ${story.id} references unknown execution profile ${story.execution.profile}.`,
      )
    }
  }

  return {
    projectRoot: canonicalRoot,
    packageName,
    agents: uniqueAgents.map(({ value }) => value),
    stories: uniqueStories.map(({ value }) => value),
    executionProfiles: uniqueProfiles.map(({ value }) => value),
    sources: {
      agents: Object.freeze(Object.fromEntries(uniqueAgents.map(({ value, source }) => [value.id, source]))),
      stories: Object.freeze(Object.fromEntries(uniqueStories.map(({ value, source }) => [value.id, source]))),
      executionProfiles: Object.freeze(Object.fromEntries(uniqueProfiles.map(({ value, source }) => [value.id, source]))),
    },
  }
}
