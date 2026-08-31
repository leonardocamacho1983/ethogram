'use server'

import { toDisplayStory } from '@/lib/agentbook/discovery'
import { ExternalProjectLoadError, loadAgentbookProject } from '@/lib/agentbook/external-project-loader.server'
import type { DisplayStory } from '@/lib/agentbook/domain'

export type ConfiguredProjectResult =
  | { status: 'not-configured' }
  | { status: 'loaded'; projectRoot: string; packageName: string; stories: DisplayStory[] }
  | { status: 'project-error'; code: string; message: string }

export async function loadConfiguredAgentbookProject(): Promise<ConfiguredProjectResult> {
  const projectRoot = process.env.ETHOGRAM_PROJECT_ROOT?.trim()
  if (!projectRoot) return { status: 'not-configured' }

  try {
    const project = await loadAgentbookProject(projectRoot)
    return {
      status: 'loaded',
      projectRoot: project.projectRoot,
      packageName: project.packageName,
      stories: project.stories.map((story) => toDisplayStory(story, project.sources.stories[story.id])),
    }
  } catch (error) {
    if (error instanceof ExternalProjectLoadError) {
      return { status: 'project-error', code: error.code, message: error.message }
    }
    return {
      status: 'project-error',
      code: 'EXTERNAL_PROJECT_LOAD_FAILED',
      message: 'The configured external Ethogram project could not be loaded.',
    }
  }
}
