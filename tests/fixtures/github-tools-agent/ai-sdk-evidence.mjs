const isRecord = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value))

const requiredText = (value, location) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${location} must be a non-empty string.`)
  return value
}

const callIdentity = (value, location) => {
  if (!isRecord(value)) throw new Error(`${location} must be a record.`)
  return {
    toolCallId: requiredText(value.toolCallId, `${location}.toolCallId`),
    toolName: requiredText(value.toolName, `${location}.toolName`),
  }
}

const exactlyOne = (values, callId, location) => {
  const matches = values.filter((value) => value?.toolCall?.toolCallId === callId)
  if (matches.length !== 1) throw new Error(`${location} must contain exactly one event for ${callId}.`)
  return matches[0]
}

const jsonEqual = (left, right) => JSON.stringify(left) === JSON.stringify(right)

const safeError = (value) => {
  if (value instanceof Error) return { name: value.name, message: value.message }
  if (isRecord(value) && typeof value.message === 'string' && value.message) {
    return {
      ...(typeof value.name === 'string' && value.name ? { name: value.name } : {}),
      message: value.message,
    }
  }
  return undefined
}

export function extractNormalizedUserText(prompt) {
  if (!Array.isArray(prompt)) throw new Error('AI SDK normalized prompt must be an array.')
  const userMessages = prompt.filter((message) => message?.role === 'user')
  if (userMessages.length !== 1) {
    throw new Error(`AI SDK normalized prompt must contain exactly one user message; observed ${userMessages.length}.`)
  }
  const content = userMessages[0]?.content
  if (!Array.isArray(content)) throw new Error('AI SDK normalized user message content must be an array.')
  const textParts = content.filter((part) => part?.type === 'text')
  if (textParts.length !== 1 || typeof textParts[0]?.text !== 'string') {
    throw new Error(`AI SDK normalized user message must contain exactly one text part; observed ${textParts.length}.`)
  }
  return textParts[0].text
}

export function describeNormalizedPromptShape(prompt) {
  if (!Array.isArray(prompt)) return { kind: typeof prompt }
  return {
    kind: 'messages',
    messageCount: prompt.length,
    messages: prompt.map((message, messageIndex) => ({
      messageIndex,
      role: typeof message?.role === 'string' ? message.role : 'unavailable',
      content: typeof message?.content === 'string'
        ? { kind: 'text', length: message.content.length }
        : Array.isArray(message?.content)
          ? {
              kind: 'parts',
              partCount: message.content.length,
              parts: message.content.map((part, partIndex) => ({
                partIndex,
                type: typeof part?.type === 'string' ? part.type : 'unavailable',
                ...(part?.type === 'text' && typeof part.text === 'string' ? { textLength: part.text.length } : {}),
              })),
            }
          : { kind: typeof message?.content },
    })),
  }
}

export function translateAiSdkExecutionEvidence({ result, starts, ends, provider, model }) {
  if (!isRecord(result) || !Array.isArray(result.steps)) throw new Error('AI SDK result.steps is required.')
  if (!Array.isArray(starts) || !Array.isArray(ends)) throw new Error('AI SDK tool callback arrays are required.')

  const calls = []
  const results = new Map()
  result.steps.forEach((step, stepIndex) => {
    if (!Array.isArray(step.toolCalls) || !Array.isArray(step.toolResults)) {
      throw new Error(`AI SDK step ${stepIndex} must expose toolCalls and toolResults arrays.`)
    }
    step.toolCalls.forEach((toolCall) => {
      const identity = callIdentity(toolCall, `AI SDK step ${stepIndex} tool call`)
      if (calls.some((entry) => entry.toolCallId === identity.toolCallId)) {
        throw new Error(`AI SDK result contains duplicate toolCallId ${identity.toolCallId}.`)
      }
      calls.push({ ...identity, input: toolCall.input, step: stepIndex })
    })
    step.toolResults.forEach((toolResult) => {
      const identity = callIdentity(toolResult, `AI SDK step ${stepIndex} tool result`)
      if (results.has(identity.toolCallId)) throw new Error(`AI SDK result contains duplicate result ${identity.toolCallId}.`)
      results.set(identity.toolCallId, { ...identity, output: toolResult.output, step: stepIndex })
    })
  })

  for (const [toolCallId] of results) {
    if (!calls.some((entry) => entry.toolCallId === toolCallId)) {
      throw new Error(`AI SDK result contains unmatched tool result ${toolCallId}.`)
    }
  }

  const startOrder = new Map(starts.map((event, index) => [event?.toolCall?.toolCallId, index]))
  if (startOrder.size !== starts.length) throw new Error('AI SDK callbacks contain duplicate tool start IDs.')

  const toolCalls = calls
    .map((call) => {
      const start = exactlyOne(starts, call.toolCallId, 'AI SDK start callbacks')
      const end = exactlyOne(ends, call.toolCallId, 'AI SDK end callbacks')
      const startIdentity = callIdentity(start.toolCall, 'AI SDK start callback toolCall')
      const endIdentity = callIdentity(end.toolCall, 'AI SDK end callback toolCall')
      if (startIdentity.toolName !== call.toolName || endIdentity.toolName !== call.toolName) {
        throw new Error(`AI SDK callback tool name mismatch for ${call.toolCallId}.`)
      }
      if (!jsonEqual(start.toolCall.input, call.input) || !jsonEqual(end.toolCall.input, call.input)) {
        throw new Error(`AI SDK callback input mismatch for ${call.toolCallId}.`)
      }
      const toolResult = results.get(call.toolCallId)
      if (!toolResult) throw new Error(`AI SDK result is missing tool result ${call.toolCallId}.`)
      if (toolResult.toolName !== call.toolName || toolResult.step !== call.step) {
        throw new Error(`AI SDK tool result mismatch for ${call.toolCallId}.`)
      }
      if (!isRecord(end.toolOutput) || !['tool-result', 'tool-error'].includes(end.toolOutput.type)) {
        throw new Error(`AI SDK end callback lacks an operational result for ${call.toolCallId}.`)
      }

      const base = {
        callId: call.toolCallId,
        name: call.toolName,
        input: call.input,
        sequence: startOrder.get(call.toolCallId),
        step: call.step,
        ...(typeof start.observedAt === 'string' ? { startedAt: start.observedAt } : {}),
        ...(typeof end.observedAt === 'string' ? { endedAt: end.observedAt } : {}),
        ...(typeof end.toolExecutionMs === 'number' && Number.isFinite(end.toolExecutionMs) && end.toolExecutionMs >= 0
          ? { durationMs: end.toolExecutionMs }
          : {}),
      }

      if (end.toolOutput.type === 'tool-result') {
        if (!jsonEqual(end.toolOutput.output, toolResult.output)) {
          throw new Error(`AI SDK callback/result output mismatch for ${call.toolCallId}.`)
        }
        return { ...base, status: 'success', output: toolResult.output }
      }

      return {
        ...base,
        status: 'error',
        ...(safeError(end.toolOutput.error) === undefined ? {} : { error: safeError(end.toolOutput.error) }),
      }
    })
    .sort((left, right) => left.sequence - right.sequence)

  const usage = isRecord(result.usage) ? result.usage : undefined
  const tokenUsage = usage === undefined ? undefined : {
    ...(typeof usage.inputTokens === 'number' ? { inputTokens: usage.inputTokens } : {}),
    ...(typeof usage.outputTokens === 'number' ? { outputTokens: usage.outputTokens } : {}),
    ...(typeof usage.totalTokens === 'number' ? { totalTokens: usage.totalTokens } : {}),
    ...(typeof usage.outputTokenDetails?.reasoningTokens === 'number'
      ? { reasoningTokens: usage.outputTokenDetails.reasoningTokens }
      : {}),
  }

  return {
    source: 'vercel-ai-sdk',
    toolCalls,
    ...(typeof provider === 'string' && provider ? { provider } : {}),
    ...(typeof model === 'string' && model ? { model } : {}),
    ...(typeof result.finishReason === 'string' && result.finishReason ? { finishReason: result.finishReason } : {}),
    ...(tokenUsage !== undefined && Object.keys(tokenUsage).length > 0 ? { tokenUsage } : {}),
  }
}
