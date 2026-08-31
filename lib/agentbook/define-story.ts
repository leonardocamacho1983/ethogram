import type { Agent, DisplayStory, Story, StoryGiven, StoryGivenValue, StoryInput } from './domain'

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

function assertStructuredGivenValue(value: unknown, location: string, ancestors: Set<object>): asserts value is StoryGivenValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${location} must contain only finite numbers.`)
    return
  }
  if (typeof value !== 'object') throw new Error(`${location} contains unsupported value type "${typeof value}".`)
  if (ancestors.has(value)) throw new Error(`${location} must not contain cyclic values.`)
  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, index)) throw new Error(`${location}[${index}] must not be undefined or sparse.`)
        assertStructuredGivenValue(value[index], `${location}[${index}]`, ancestors)
      }
      return
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) throw new Error(`${location} must contain only plain records and arrays.`)
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new Error(`${location} must not contain symbol keys.`)
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || descriptor.get || descriptor.set) throw new Error(`${location}.${key} must be a plain data property.`)
      assertStructuredGivenValue(descriptor.value, `${location}.${key}`, ancestors)
    }
  } finally {
    ancestors.delete(value)
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}

function validatedGiven(given: StoryGiven | undefined): StoryGiven {
  if (given === undefined) return []
  if (Array.isArray(given)) {
    for (const [index, value] of given.entries()) {
      if (typeof value !== 'string') throw new Error(`Story given[${index}] must be a string.`)
    }
    return given
  }
  assertStructuredGivenValue(given, 'Story given', new Set())
  return deepFreeze(structuredClone(given))
}

export function defineAgent<const TAgent extends Agent>(agent: TAgent): TAgent {
  return agent
}

export function defineStory(input: StoryInput): Story {
  const prompt = (input.prompt ?? input.when) as string
  const expectations = (input.expectations ?? input.then) as Story['expectations']

  assertVerdictFreeExpectations(expectations)

  const story: Story = {
    __ethogramType: 'story',
    id: input.id,
    name: input.name,
    agent: input.agent,
    description: input.description,
    given: validatedGiven(input.given),
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
    '__ethogramType' in value &&
    value.__ethogramType === 'story'
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
