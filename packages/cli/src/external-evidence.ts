import type {
  ObservedRun,
  ObservedTimelineStep,
  ObservedTokenUsage,
  ObservedToolCall,
} from './contracts.js'

type JsonEvidenceValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonEvidenceValue[]
  | { readonly [key: string]: JsonEvidenceValue }

export type NormalizedExternalEvidence = Pick<ObservedRun, 'toolCalls' | 'timeline' | 'evidence'>

export class ExternalEvidenceValidationError extends Error {
  readonly code = 'INVALID_EXTERNAL_EXECUTION_EVIDENCE'

  constructor(message: string) {
    super(message)
    this.name = 'ExternalEvidenceValidationError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function fail(message: string): never {
  throw new ExternalEvidenceValidationError(message)
}

function requiredText(value: unknown, location: string): string {
  if (typeof value !== 'string' || !value.trim()) fail(`${location} must be a non-empty string.`)
  return value
}

function optionalText(record: Record<string, unknown>, key: string, location: string): string | undefined {
  if (!Object.prototype.hasOwnProperty.call(record, key)) return undefined
  return requiredText(record[key], `${location}.${key}`)
}

function optionalNonNegativeNumber(
  record: Record<string, unknown>,
  key: string,
  location: string,
): number | undefined {
  if (!Object.prototype.hasOwnProperty.call(record, key)) return undefined
  const value = record[key]
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    fail(`${location}.${key} must be a finite non-negative number.`)
  }
  return value
}

function optionalNonNegativeInteger(
  record: Record<string, unknown>,
  key: string,
  location: string,
): number | undefined {
  const value = optionalNonNegativeNumber(record, key, location)
  if (value !== undefined && !Number.isInteger(value)) fail(`${location}.${key} must be an integer.`)
  return value
}

function rejectEvaluationFields(record: Record<string, unknown>, location: string): void {
  for (const key of ['verdict', 'expectations', 'evaluationResult', 'passed', 'failed']) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      fail(`${location} must not contain behavioral evaluation field "${key}".`)
    }
  }
}

function evidenceValue(value: unknown, location: string, ancestors: Set<object>): JsonEvidenceValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail(`${location} must contain only finite numbers.`)
    return value
  }
  if (!value || typeof value !== 'object') fail(`${location} contains unsupported value type "${typeof value}".`)
  if (ancestors.has(value)) fail(`${location} must not contain cyclic values.`)
  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      return value.map((entry, index) => {
        if (!Object.prototype.hasOwnProperty.call(value, index)) fail(`${location}[${index}] must not be sparse.`)
        return evidenceValue(entry, `${location}[${index}]`, ancestors)
      })
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      fail(`${location} must contain only plain records and arrays.`)
    }
    const result: Record<string, JsonEvidenceValue> = Object.create(null)
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string') fail(`${location} must not contain symbol keys.`)
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!descriptor || descriptor.get || descriptor.set) fail(`${location}.${key} must be a plain data property.`)
      result[key] = evidenceValue(descriptor.value, `${location}.${key}`, ancestors)
    }
    return result
  } finally {
    ancestors.delete(value)
  }
}

function safeError(value: unknown, location: string): { name?: string; message: string } {
  if (!isRecord(value)) fail(`${location} must be a record.`)
  rejectEvaluationFields(value, location)
  const message = requiredText(value.message, `${location}.message`)
  const name = optionalText(value, 'name', location)
  return { ...(name === undefined ? {} : { name }), message }
}

function tokenUsage(value: unknown): ObservedTokenUsage {
  if (value === undefined) return { availability: 'unavailable' }
  if (!isRecord(value)) fail('External execution evidence tokenUsage must be a record.')
  rejectEvaluationFields(value, 'External execution evidence tokenUsage')
  const usage = {
    inputTokens: optionalNonNegativeNumber(value, 'inputTokens', 'External execution evidence tokenUsage'),
    outputTokens: optionalNonNegativeNumber(value, 'outputTokens', 'External execution evidence tokenUsage'),
    totalTokens: optionalNonNegativeNumber(value, 'totalTokens', 'External execution evidence tokenUsage'),
    reasoningTokens: optionalNonNegativeNumber(value, 'reasoningTokens', 'External execution evidence tokenUsage'),
  }
  if (Object.values(usage).every((entry) => entry === undefined)) return { availability: 'unavailable' }
  return {
    availability: 'available',
    ...(usage.inputTokens === undefined ? {} : { inputTokens: usage.inputTokens }),
    ...(usage.outputTokens === undefined ? {} : { outputTokens: usage.outputTokens }),
    ...(usage.totalTokens === undefined ? {} : { totalTokens: usage.totalTokens }),
    ...(usage.reasoningTokens === undefined ? {} : { reasoningTokens: usage.reasoningTokens }),
  }
}

function normalizeToolCall(value: unknown, index: number): ObservedToolCall {
  const location = `External execution evidence toolCalls[${index}]`
  if (!isRecord(value)) fail(`${location} must be a record.`)
  rejectEvaluationFields(value, location)
  const callId = requiredText(value.callId, `${location}.callId`)
  const name = requiredText(value.name, `${location}.name`)
  if (!Object.prototype.hasOwnProperty.call(value, 'input')) fail(`${location}.input is required.`)
  const input = JSON.stringify(evidenceValue(value.input, `${location}.input`, new Set()))
  const sequence = optionalNonNegativeInteger(value, 'sequence', location)
  if (sequence === undefined) fail(`${location}.sequence is required.`)
  optionalNonNegativeInteger(value, 'step', location)
  const startedAt = optionalText(value, 'startedAt', location)
  const endedAt = optionalText(value, 'endedAt', location)
  const durationMs = optionalNonNegativeNumber(value, 'durationMs', location)
  const base = {
    callId,
    name,
    input,
    ...(durationMs === undefined ? {} : { duration: `${durationMs}ms` }),
    ...(startedAt === undefined ? {} : { startedAt }),
    ...(endedAt === undefined ? {} : { endedAt }),
  }

  if (value.status === 'success') {
    if (Object.prototype.hasOwnProperty.call(value, 'error')) fail(`${location}.error is not allowed for a successful call.`)
    if (!Object.prototype.hasOwnProperty.call(value, 'output')) return { ...base, status: 'success' }
    const output = JSON.stringify(evidenceValue(value.output, `${location}.output`, new Set()))
    return { ...base, status: 'success', output }
  }
  if (value.status === 'error') {
    if (Object.prototype.hasOwnProperty.call(value, 'output')) fail(`${location}.output is not allowed for an error call.`)
    if (!Object.prototype.hasOwnProperty.call(value, 'error')) return { ...base, status: 'error' }
    return { ...base, status: 'error', error: safeError(value.error, `${location}.error`) }
  }
  return fail(`${location}.status must be "success" or "error".`)
}

export function normalizeExternalExecutionEvidence(value: unknown): NormalizedExternalEvidence {
  if (!isRecord(value)) fail('External execution evidence must be a record.')
  rejectEvaluationFields(value, 'External execution evidence')
  requiredText(value.source, 'External execution evidence source')
  if (!Array.isArray(value.toolCalls)) fail('External execution evidence toolCalls must be an array.')

  const toolCalls = value.toolCalls.map(normalizeToolCall)
  const callIds = new Set<string>()
  const sequences = new Set<number>()
  value.toolCalls.forEach((rawCall, index) => {
    const call = rawCall as Record<string, unknown>
    const callId = call.callId as string
    const sequence = call.sequence as number
    if (callIds.has(callId)) fail(`External execution evidence contains duplicate callId "${callId}".`)
    if (sequences.has(sequence)) fail(`External execution evidence contains duplicate sequence "${sequence}".`)
    callIds.add(callId)
    sequences.add(sequence)
    if (sequence !== index) fail('External execution evidence sequences must be contiguous and zero-based.')
  })

  const timeline: ObservedTimelineStep[] = toolCalls.map((call) => ({
    label: `Tool completed: ${call.name}`,
    detail: `Operational status: ${call.status}`,
    ...(call.duration === undefined ? {} : { duration: call.duration }),
  }))

  const provider = optionalText(value, 'provider', 'External execution evidence')
  const model = optionalText(value, 'model', 'External execution evidence')
  const startedAt = optionalText(value, 'startedAt', 'External execution evidence')
  const endedAt = optionalText(value, 'endedAt', 'External execution evidence')
  const latencyMs = optionalNonNegativeNumber(value, 'latencyMs', 'External execution evidence')
  const finishReason = optionalText(value, 'finishReason', 'External execution evidence')

  return {
    toolCalls,
    timeline,
    evidence: {
      ...(provider === undefined ? {} : { provider }),
      ...(model === undefined ? {} : { model }),
      ...(startedAt === undefined ? {} : { startedAt }),
      ...(endedAt === undefined ? {} : { endedAt }),
      ...(latencyMs === undefined ? {} : { latencyMs }),
      ...(finishReason === undefined ? {} : { finishReason }),
      tokenUsage: tokenUsage(value.tokenUsage),
    },
  }
}
