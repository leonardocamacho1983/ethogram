import type { Story } from './domain.ts'

export type ExternalToolInput = Readonly<Record<string, unknown>>
export type ExternalToolOutput = Readonly<Record<string, unknown>>

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
  readonly __ethogramType: 'execution-profile'
  id: string
  tools: ExternalToolSet
  execute(context: ExternalExecutionContext): Promise<ExternalExecutionOutcome>
}

export function defineExecutionProfile(
  profile: Omit<ExternalExecutionProfile, '__ethogramType'>,
): ExternalExecutionProfile {
  if (!profile.id.trim()) throw new Error('Execution profile id is required.')
  if (Object.keys(profile.tools).length === 0) throw new Error('Execution profile must expose at least one tool.')
  return { __ethogramType: 'execution-profile', ...profile }
}

export function isExternalExecutionProfile(value: unknown): value is ExternalExecutionProfile {
  return Boolean(
    value &&
    typeof value === 'object' &&
    '__ethogramType' in value &&
    value.__ethogramType === 'execution-profile' &&
    'id' in value &&
    typeof value.id === 'string' &&
    'tools' in value &&
    value.tools &&
    typeof value.tools === 'object' &&
    'execute' in value &&
    typeof value.execute === 'function',
  )
}
