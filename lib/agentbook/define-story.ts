import type { Agent, Story, StoryInput } from './domain'

export function defineAgent<const TAgent extends Agent>(agent: TAgent): TAgent {
  return agent
}

export function defineStory(input: StoryInput): Story {
  const prompt = (input.prompt ?? input.when) as string
  const expectations = (input.expectations ?? input.then) as Story['expectations']

  return {
    __agentbookType: 'story',
    id: input.id,
    name: input.name,
    agent: input.agent,
    group: input.group ?? 'General',
    description: input.description,
    status: input.status ?? 'pass',
    kind: input.kind ?? 'DEFAULT',
    tags: input.tags ?? [],
    given: input.given ?? [],
    prompt,
    result: input.result ?? {
      decision: 'Ready to run',
      reason: 'No model execution is configured for this Story yet.',
    },
    tools: input.tools ?? [],
    expectations,
    runs: input.runs ?? [],
    source: {
      file: input.source?.file ?? 'Discovered Story',
      exportName: input.source?.exportName,
      code: input.source?.code,
    },
    simulation: input.simulation ?? { kind: 'static' },
    comparison: input.comparison,
  }
}

export function isStory(value: unknown): value is Story {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__agentbookType' in value &&
    value.__agentbookType === 'story'
  )
}
