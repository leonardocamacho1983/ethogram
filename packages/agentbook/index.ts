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

export type Story = {
  readonly __agentbookType: 'story'
  id: string
  name: string
  agent: Agent
  description: string
  given: string[]
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
  given?: string[]
  execution?: StoryExecutionCapability
} & PromptInput & ExpectationsInput

type ExternalToolInput = Readonly<Record<string, unknown>>
type ExternalToolOutput = Readonly<Record<string, unknown>>

export type ExternalToolDefinition = {
  description: string
  execute(input: ExternalToolInput): ExternalToolOutput | Promise<ExternalToolOutput>
}

export type ExternalToolSet = Readonly<Record<string, ExternalToolDefinition>>

export type ExternalExecutionOutcome = {
  decision: string
  finalResponse: string
}

export type ExternalExecutionContext = {
  story: Story
  callTool(toolName: string, input: ExternalToolInput): Promise<ExternalToolOutput>
}

export type ExternalExecutionProfile = {
  readonly __agentbookType: 'execution-profile'
  id: string
  tools: ExternalToolSet
  execute(context: ExternalExecutionContext): Promise<ExternalExecutionOutcome>
}

const forbiddenExpectationVerdictKeys = ['passed', 'failed', 'status', 'verdict'] as const

function requiredText(value: string, field: string): void {
  if (!value.trim()) throw new Error(`${field} is required.`)
}

function assertVerdictFreeExpectations(expectations: StoryExpectation[]): void {
  for (const expectation of expectations) {
    for (const key of forbiddenExpectationVerdictKeys) {
      if (Object.prototype.hasOwnProperty.call(expectation, key)) {
        throw new Error(`Story expectation "${expectation.id}" must not contain behavioral verdict field "${key}".`)
      }
    }
  }
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
  assertVerdictFreeExpectations(expectations)

  return {
    __agentbookType: 'story',
    id: input.id,
    name: input.name,
    agent: input.agent,
    description: input.description,
    given: input.given ?? [],
    prompt,
    expectations,
    ...(input.execution === undefined ? {} : { execution: input.execution }),
  }
}

export function defineExecutionProfile(
  profile: Omit<ExternalExecutionProfile, '__agentbookType'>,
): ExternalExecutionProfile {
  requiredText(profile.id, 'Execution profile id')
  if (Object.keys(profile.tools).length === 0) {
    throw new Error('Execution profile must expose at least one tool.')
  }
  return { __agentbookType: 'execution-profile', ...profile }
}
