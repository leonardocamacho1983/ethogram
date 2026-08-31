type AgentIcon = 'headset' | 'target' | 'search'

export type Agent = {
  id: string
  name: string
  description: string
  icon: AgentIcon
}

export type ToolCalledMatcher = {
  kind: 'tool-called'
  tool: string
}

export type ToolNotCalledMatcher = {
  kind: 'tool-not-called'
  tool: string
}

export type ExpectationMatcher = ToolCalledMatcher | ToolNotCalledMatcher

export type StoryExpectation = {
  id: string
  description: string
  failureDescription?: string
  matcher: ExpectationMatcher
  passed?: never
  failed?: never
  status?: never
  verdict?: never
}

type StoryExecutionCapability = { kind: 'external-profile'; profile: string }

export type StoryGivenValue =
  | string
  | number
  | boolean
  | null
  | readonly StoryGivenValue[]
  | { readonly [key: string]: StoryGivenValue }

export type StoryGiven = string[] | Readonly<Record<string, StoryGivenValue>>

export type Story = {
  readonly __ethogramType: 'story'
  id: string
  name: string
  agent: Agent
  description: string
  given: StoryGiven
  prompt: string
  expectations: StoryExpectation[]
  execution?: StoryExecutionCapability
}

type PromptInput = { prompt: string; when?: never } | { when: string; prompt?: never }
type ExpectationsInput =
  | { expectations: StoryExpectation[]; then?: never }
  | { then: StoryExpectation[]; expectations?: never }

export type StoryInput = {
  id: string
  name: string
  agent: Agent
  description: string
  given?: StoryGiven
  execution?: StoryExecutionCapability
} & PromptInput & ExpectationsInput

type ExternalToolInput = Readonly<Record<string, unknown>>
type ExternalToolOutput = Readonly<Record<string, unknown>>

export type ExternalExecutionEvidenceValue =
  | string
  | number
  | boolean
  | null
  | readonly ExternalExecutionEvidenceValue[]
  | { readonly [key: string]: ExternalExecutionEvidenceValue }

type ExternalToolCallEvidenceBase = {
  callId: string
  name: string
  input: ExternalExecutionEvidenceValue
  sequence: number
  step?: number
  startedAt?: string
  endedAt?: string
  durationMs?: number
}

export type ExternalToolCallEvidence =
  | (ExternalToolCallEvidenceBase & {
      status: 'success'
      output?: ExternalExecutionEvidenceValue
      error?: never
    })
  | (ExternalToolCallEvidenceBase & {
      status: 'error'
      output?: never
      error?: {
        name?: string
        message: string
      }
    })

export type ExternalExecutionEvidence = {
  source: string
  toolCalls: readonly ExternalToolCallEvidence[]
  provider?: string
  model?: string
  startedAt?: string
  endedAt?: string
  latencyMs?: number
  finishReason?: string
  tokenUsage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    reasoningTokens?: number
  }
}

export type ExternalToolDefinition = {
  description: string
  execute(input: ExternalToolInput): ExternalToolOutput | Promise<ExternalToolOutput>
}

export type ExternalToolSet = Readonly<Record<string, ExternalToolDefinition>>

export type ExternalExecutionOutcome = {
  decision: string
  finalResponse: string
  evidence?: ExternalExecutionEvidence
}

export type ExternalExecutionContext = {
  story: Story
  callTool(toolName: string, input: ExternalToolInput): Promise<ExternalToolOutput>
}

export type ExternalExecutionProfile = {
  readonly __ethogramType: 'execution-profile'
  id: string
  tools: ExternalToolSet
  execute(context: ExternalExecutionContext): Promise<ExternalExecutionOutcome>
}

const forbiddenExpectationVerdictKeys = ['passed', 'failed', 'status', 'verdict'] as const

function requiredText(value: string, field: string): void {
  if (!value.trim()) throw new Error(`${field} is required.`)
}

function assertValidExpectations(expectations: StoryExpectation[]): void {
  if (!Array.isArray(expectations) || expectations.length === 0) {
    throw new Error('Story expectations must contain at least one expectation.')
  }
  const ids = new Set<string>()
  for (const [index, expectation] of expectations.entries()) {
    if (!expectation || typeof expectation !== 'object') {
      throw new Error(`Story expectation[${index}] must be an object.`)
    }
    requiredText(expectation.id, `Story expectation[${index}] id`)
    requiredText(expectation.description, `Story expectation "${expectation.id}" description`)
    if (ids.has(expectation.id)) throw new Error(`Duplicate Story expectation identity: ${expectation.id}`)
    ids.add(expectation.id)
    for (const key of forbiddenExpectationVerdictKeys) {
      if (Object.prototype.hasOwnProperty.call(expectation, key)) {
        throw new Error(`Story expectation "${expectation.id}" must not contain behavioral verdict field "${key}".`)
      }
    }
    const matcher = expectation.matcher as unknown
    if (!matcher || typeof matcher !== 'object') {
      throw new Error(`Story expectation "${expectation.id}" matcher must be an object.`)
    }
    const { kind, tool } = matcher as { kind?: unknown; tool?: unknown }
    if (kind !== 'tool-called' && kind !== 'tool-not-called') {
      throw new Error(`Story expectation "${expectation.id}" uses unsupported matcher kind "${String(kind)}".`)
    }
    if (typeof tool !== 'string' || !tool.trim()) {
      throw new Error(`Story expectation "${expectation.id}" matcher tool is required.`)
    }
  }
}

function assertStructuredGivenValue(
  value: unknown,
  location: string,
  ancestors: Set<object>,
): asserts value is StoryGivenValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${location} must contain only finite numbers.`)
    return
  }
  if (typeof value !== 'object') {
    throw new Error(`${location} contains unsupported value type "${typeof value}".`)
  }
  if (ancestors.has(value)) throw new Error(`${location} must not contain cyclic values.`)
  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(value, index)) {
          throw new Error(`${location}[${index}] must not be undefined or sparse.`)
        }
        assertStructuredGivenValue(value[index], `${location}[${index}]`, ancestors)
      }
      return
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error(`${location} must contain only plain records and arrays.`)
    }
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') throw new Error(`${location} must not contain symbol keys.`)
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || descriptor.get || descriptor.set) {
        throw new Error(`${location}.${key} must be a plain data property.`)
      }
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
  requiredText(agent.id, 'Agent id')
  requiredText(agent.name, 'Agent name')
  return agent
}

export function defineStory(input: StoryInput): Story {
  requiredText(input.id, 'Story id')
  requiredText(input.name, 'Story name')

  const prompt = (input.prompt ?? input.when) as string
  const expectations = (input.expectations ?? input.then) as StoryExpectation[]
  requiredText(prompt, 'Story prompt')
  assertValidExpectations(expectations)

  return {
    __ethogramType: 'story',
    id: input.id,
    name: input.name,
    agent: input.agent,
    description: input.description,
    given: validatedGiven(input.given),
    prompt,
    expectations,
    ...(input.execution === undefined ? {} : { execution: input.execution }),
  }
}

export function defineExecutionProfile(
  profile: Omit<ExternalExecutionProfile, '__ethogramType'>,
): ExternalExecutionProfile {
  requiredText(profile.id, 'Execution profile id')
  return { __ethogramType: 'execution-profile', ...profile }
}
