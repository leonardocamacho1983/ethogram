import type { Agent, DisplayStory, Story, StoryInput } from './domain'

const forbiddenExpectationVerdictKeys = ['passed', 'failed', 'status', 'verdict'] as const

function assertVerdictFreeExpectations(expectations: Story['expectations']): void {
  for (const expectation of expectations) {
    for (const key of forbiddenExpectationVerdictKeys) {
      if (Object.prototype.hasOwnProperty.call(expectation, key)) {
        throw new Error(`Story expectation "${expectation.id}" must not contain behavioral verdict field "${key}".`)
      }
    }
  }
}

export function defineAgent<const TAgent extends Agent>(agent: TAgent): TAgent {
  return agent
}

export function defineStory(input: StoryInput): Story {
  const prompt = (input.prompt ?? input.when) as string
  const expectations = (input.expectations ?? input.then) as Story['expectations']

  assertVerdictFreeExpectations(expectations)

  const story: Story = {
    __agentbookType: 'story',
    id: input.id,
    name: input.name,
    agent: input.agent,
    description: input.description,
    given: input.given ?? [],
    prompt,
    expectations,
  }

  if (input.execution !== undefined) {
    story.execution = input.execution
  }

  const presentationFields = [
    'group',
    'status',
    'kind',
    'tags',
    'result',
    'tools',
    'runs',
    'source',
    'simulation',
    'comparison',
  ] as const
  const usesPresentationModel = presentationFields.some((key) =>
    Object.prototype.hasOwnProperty.call(input, key),
  )

  if (usesPresentationModel) {
    Object.assign(story, {
      group: input.group ?? 'General',
      status: input.status ?? 'pass',
      kind: input.kind ?? 'DEFAULT',
      tags: input.tags ?? [],
      result: input.result ?? {
        decision: 'Ready to run',
        reason: 'No model execution is configured for this Story yet.',
      },
      tools: input.tools ?? [],
      runs: input.runs ?? [],
      source: {
        file: input.source?.file ?? 'Discovered Story',
        exportName: input.source?.exportName,
        code: input.source?.code,
      },
      simulation: input.simulation ?? { kind: 'static' },
      comparison: input.comparison,
    } satisfies Omit<DisplayStory, keyof Story>)
  }

  return story
}

export function isStory(value: unknown): value is Story {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__agentbookType' in value &&
    value.__agentbookType === 'story'
  )
}

export function isDisplayStory(value: unknown): value is DisplayStory {
  return (
    isStory(value) &&
    typeof value.group === 'string' &&
    typeof value.status === 'string' &&
    typeof value.kind === 'string' &&
    Array.isArray(value.tags) &&
    value.result !== undefined &&
    Array.isArray(value.tools) &&
    Array.isArray(value.runs) &&
    value.source !== undefined &&
    value.simulation !== undefined
  )
}
