import { isDisplayStory, isStory } from './define-story'
import type { Agent, DisplayStory, Story } from './domain'
import { storyModuleFiles, storyModules } from './generated-story-registry'

type StoryModule = Record<string, unknown> & { default?: unknown }

function storyExports(module: StoryModule): Story[] {
  const candidates = module.default === undefined
    ? Object.values(module)
    : [
        module.default,
        ...Object.entries(module)
          .filter(([exportName]) => exportName !== 'default')
          .map(([, value]) => value),
      ]

  return candidates.flatMap((candidate) => {
    if (isStory(candidate)) return [candidate]
    if (Array.isArray(candidate)) return candidate.filter(isStory)
    return []
  })
}

function toDisplayStory(story: Story, discoveredFile: string): DisplayStory {
  if (isDisplayStory(story)) return story

  return {
    ...story,
    group: story.execution?.kind === 'real-agent' ? 'Real executions' : 'General',
    status: story.execution?.kind === 'real-agent' ? 'policy' : 'pass',
    kind: story.execution?.kind === 'real-agent' ? 'POLICY' : 'DEFAULT',
    tags: story.execution?.kind === 'real-agent' ? ['real-agent'] : [],
    result: {
      decision: 'Not run',
      reason: 'Run this Story to produce execution evidence.',
    },
    tools: [],
    runs: [],
    source: { file: discoveredFile },
    simulation: { kind: 'static' },
  }
}

export function discoverStoryDefinitions(): Story[] {
  const stories = storyModules.flatMap(storyExports)
  const uniqueStories = new Map<string, Story>()

  for (const story of stories) {
    const key = `${story.agent.id}/${story.id}`
    if (uniqueStories.has(key)) {
      throw new Error(`Duplicate Agentbook Story discovered: ${key}`)
    }
    uniqueStories.set(key, story)
  }

  return [...uniqueStories.values()]
}

export function discoverStories(): DisplayStory[] {
  const stories = storyModules.flatMap((module, index) =>
    storyExports(module).map((story) => toDisplayStory(story, storyModuleFiles[index] ?? 'Discovered Story')),
  )
  const uniqueStories = new Map<string, DisplayStory>()

  for (const story of stories) {
    const key = `${story.agent.id}/${story.id}`
    if (uniqueStories.has(key)) {
      throw new Error(`Duplicate Agentbook Story discovered: ${key}`)
    }
    uniqueStories.set(key, story)
  }

  return [...uniqueStories.values()]
}

export type AgentWithStories = Agent & { stories: DisplayStory[] }

export function groupStoriesByAgent(stories: DisplayStory[]): AgentWithStories[] {
  const agents = new Map<string, AgentWithStories>()

  for (const story of stories) {
    const existing = agents.get(story.agent.id)
    if (existing) {
      existing.stories.push(story)
    } else {
      agents.set(story.agent.id, { ...story.agent, stories: [story] })
    }
  }

  return [...agents.values()]
}
