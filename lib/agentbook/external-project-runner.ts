import type { ObservedRun, Story, ToolCall } from './domain.ts'
import type {
  ExternalExecutionProfile,
  ExternalToolInput,
  ExternalToolOutput,
} from './external-execution.ts'
import type { Runner } from './runner.ts'

export type ExternalToolInvocation = {
  order: number
  callId: string
  name: string
  input: ExternalToolInput
  output: ExternalToolOutput
  status: 'success' | 'error'
  startedAt: string
  endedAt: string
  durationMs: number
}

function cloneRecord<T extends Readonly<Record<string, unknown>>>(value: T): T {
  return structuredClone(value)
}

function toObservedToolCall(invocation: ExternalToolInvocation): ToolCall {
  return {
    callId: invocation.callId,
    name: invocation.name,
    status: invocation.status,
    duration: `${invocation.durationMs}ms`,
    input: JSON.stringify(invocation.input),
    output: JSON.stringify(invocation.output),
    startedAt: invocation.startedAt,
    endedAt: invocation.endedAt,
  }
}

export class ExternalProjectRunner implements Runner<void, Promise<ObservedRun>> {
  readonly availableToolNames: readonly string[]
  private readonly profile: ExternalExecutionProfile
  private trace: ExternalToolInvocation[] = []
  private receivedStory?: Story

  constructor(profile: ExternalExecutionProfile) {
    this.profile = profile
    this.availableToolNames = Object.freeze(Object.keys(profile.tools))
  }

  get lastReceivedStory(): Story | undefined {
    return this.receivedStory
  }

  getTrace(): readonly ExternalToolInvocation[] {
    return this.trace.map((invocation) => structuredClone(invocation))
  }

  async run(story: Story, _context: void): Promise<ObservedRun> {
    this.receivedStory = story
    this.trace = []

    const outcome = await this.profile.execute({
      story,
      callTool: async (toolName, input) => {
        const tool = this.profile.tools[toolName]
        if (!tool) throw new Error(`External execution profile requested unavailable tool: ${toolName}`)

        const order = this.trace.length + 1
        const startedAtMs = Date.now()
        const invocation: ExternalToolInvocation = {
          order,
          callId: `external-${order}`,
          name: toolName,
          input: cloneRecord(input),
          output: {},
          status: 'success',
          startedAt: new Date(startedAtMs).toISOString(),
          endedAt: '',
          durationMs: 0,
        }
        this.trace.push(invocation)

        try {
          const output = await tool.execute(cloneRecord(input))
          invocation.output = cloneRecord(output)
          return cloneRecord(output)
        } catch (error) {
          invocation.status = 'error'
          invocation.output = { error: error instanceof Error ? error.name : 'ExternalToolError' }
          throw error
        } finally {
          const endedAtMs = Date.now()
          invocation.endedAt = new Date(endedAtMs).toISOString()
          invocation.durationMs = Math.max(0, endedAtMs - startedAtMs)
        }
      },
    })

    const toolCalls = this.trace.map(toObservedToolCall)
    return {
      decision: outcome.decision,
      reason: outcome.finalResponse,
      finalResponse: outcome.finalResponse,
      toolCalls,
      timeline: this.trace.map((invocation) => ({
        label: `Tool completed: ${invocation.name}`,
        detail: `Operational status: ${invocation.status}`,
        duration: `${invocation.durationMs}ms`,
      })),
    }
  }
}
