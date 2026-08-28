import { isStepCount, ToolLoopAgent, type ToolSet } from 'ai'
import type {
  ModelTokenUsage,
  ObservedRun,
  Story,
  TimelineStep,
  ToolCall,
} from './domain'
import type { Runner } from './runner'
import type { ControlledToolInvocation } from './controlled-refund-tools'

export type RealAgentRunnerConfig = {
  provider: string
  model: string
  tools: ToolSet
  readToolTrace: () => readonly ControlledToolInvocation[]
  instructions: string
  maxSteps: number
  timeoutMs: number
  temperature: number
}

function warningLabel(warning: unknown): string {
  if (typeof warning === 'string') return warning
  if (warning && typeof warning === 'object' && 'type' in warning) {
    return String(warning.type)
  }
  return 'provider-warning'
}

function tokenUsage(usage: {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  outputTokenDetails?: { reasoningTokens?: number }
}): ModelTokenUsage {
  const available = [usage.inputTokens, usage.outputTokens, usage.totalTokens]
    .some((value) => typeof value === 'number')

  return {
    availability: available ? 'available' : 'unavailable',
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    reasoningTokens: usage.outputTokenDetails?.reasoningTokens,
  }
}

function observedToolCall(invocation: ControlledToolInvocation): ToolCall {
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

function storyPrompt(story: Story): string {
  const context = story.given.length > 0
    ? story.given.map((fact) => `- ${fact}`).join('\n')
    : '- No additional scenario facts were supplied.'

  return [
    `Scenario: ${story.description}`,
    'Known context:',
    context,
    `Customer request: ${story.prompt}`,
    'Handle this request using the available tools and then respond to the customer.',
  ].join('\n')
}

export class RealAgentRunner implements Runner<void, Promise<ObservedRun>> {
  readonly availableToolNames: readonly string[]
  private readonly config: RealAgentRunnerConfig
  private receivedStory?: Story

  constructor(config: RealAgentRunnerConfig) {
    this.config = config
    this.availableToolNames = Object.freeze(Object.keys(config.tools))
  }

  get lastReceivedStory(): Story | undefined {
    return this.receivedStory
  }

  async run(story: Story, _context: void): Promise<ObservedRun> {
    this.receivedStory = story
    const startedAtMs = Date.now()
    const startedAt = new Date(startedAtMs).toISOString()

    const agent = new ToolLoopAgent({
      model: this.config.model,
      instructions: this.config.instructions,
      tools: this.config.tools,
      toolChoice: 'auto',
      stopWhen: isStepCount(this.config.maxSteps),
      temperature: this.config.temperature,
      maxOutputTokens: 800,
      maxRetries: 0,
    })

    const result = await agent.generate({
      prompt: storyPrompt(story),
      timeout: { totalMs: this.config.timeoutMs },
    })

    const endedAtMs = Date.now()
    const endedAt = new Date(endedAtMs).toISOString()
    const trace = this.config.readToolTrace()
    const toolCalls = trace.map(observedToolCall)
    const timeline: TimelineStep[] = result.steps.map((step, index) => {
      const calledTools = step.toolCalls.map((call) => call.toolName)
      return {
        label: `Model step ${index + 1}`,
        detail: calledTools.length > 0
          ? `Called ${calledTools.join(', ')}`
          : `Completed with finish reason ${step.finishReason}`,
        duration: 'provider step timing unavailable',
      }
    })
    const finalResponse = result.text
    const finalStep = result.steps.at(-1)

    return {
      decision: finalResponse.length > 0
        ? 'Model response completed'
        : 'Model execution completed without final response text',
      reason: finalResponse || `Provider finish reason: ${result.finishReason}`,
      finalResponse,
      toolCalls,
      timeline,
      evidence: {
        provider: this.config.provider,
        model: this.config.model,
        responseProvider: finalStep?.model.provider,
        responseModel: finalStep?.response.modelId,
        responseId: finalStep?.response.id,
        startedAt,
        endedAt,
        latencyMs: Math.max(0, endedAtMs - startedAtMs),
        requestCount: result.steps.length,
        finishReason: result.finishReason,
        tokenUsage: tokenUsage(result.usage),
        warnings: (result.warnings ?? []).map(warningLabel),
        randomness: {
          temperature: this.config.temperature,
          mode: 'lowest-practical',
          realLlmRemainsNonDeterministic: true,
        },
      },
    }
  }
}
