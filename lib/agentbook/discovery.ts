import { isStory } from './define-story'
import type { Agent, Story } from './domain'
import { storyModules } from './generated-story-registry'

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

export function discoverStories(): Story[] {
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

export type AgentWithStories = Agent & { stories: Story[] }

export function groupStoriesByAgent(stories: Story[]): AgentWithStories[] {
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
