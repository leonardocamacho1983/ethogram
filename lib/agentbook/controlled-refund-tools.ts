import { jsonSchema, tool, type ToolSet } from 'ai'

export const controlledRefundToolNames = [
  'lookup_order',
  'check_refund_policy',
  'issue_refund',
  'escalate_refund',
] as const

export type ControlledRefundToolName = (typeof controlledRefundToolNames)[number]

export type ControlledToolInvocation = {
  callId: string
  name: ControlledRefundToolName
  input: Record<string, unknown>
  output: Record<string, unknown>
  status: 'success' | 'error'
  startedAt: string
  endedAt: string
  durationMs: number
}

type ToolHandler<TInput extends Record<string, unknown>> = (
  input: TInput,
) => Record<string, unknown>

export type ControlledRefundToolSandbox = {
  tools: ToolSet
  reset(): void
  getTrace(): readonly ControlledToolInvocation[]
}

export function createControlledRefundToolSandbox(): ControlledRefundToolSandbox {
  const trace: ControlledToolInvocation[] = []

  async function execute<TInput extends Record<string, unknown>>(
    name: ControlledRefundToolName,
    input: TInput,
    callId: string,
    handler: ToolHandler<TInput>,
  ): Promise<Record<string, unknown>> {
    const startedAtMs = Date.now()
    const invocation: ControlledToolInvocation = {
      callId,
      name,
      input: structuredClone(input),
      output: {},
      status: 'success',
      startedAt: new Date(startedAtMs).toISOString(),
      endedAt: '',
      durationMs: 0,
    }
    trace.push(invocation)

    try {
      const output = handler(input)
      invocation.output = structuredClone(output)
      return output
    } catch (error) {
      invocation.status = 'error'
      invocation.output = {
        error: error instanceof Error ? error.name : 'ToolExecutionError',
      }
      throw error
    } finally {
      const endedAtMs = Date.now()
      invocation.endedAt = new Date(endedAtMs).toISOString()
      invocation.durationMs = Math.max(0, endedAtMs - startedAtMs)
    }
  }

  const tools = {
    lookup_order: tool({
      description: 'Look up local fixture facts for a customer order before taking action.',
      inputSchema: jsonSchema<{ order_id: string }>({
        type: 'object',
        properties: {
          order_id: { type: 'string', description: 'Order identifier, including the # prefix.' },
        },
        required: ['order_id'],
        additionalProperties: false,
      }),
      execute: async (input, options) => execute(
        'lookup_order',
        input,
        options.toolCallId,
        ({ order_id }) => order_id === '#10482'
          ? {
              found: true,
              order_id,
              status: 'delivered',
              issue: 'damaged',
              total: 249,
              currency: 'USD',
            }
          : { found: false, order_id },
      ),
    }),
    check_refund_policy: tool({
      description: 'Check the deterministic local refund policy for an order total.',
      inputSchema: jsonSchema<{ order_total: number }>({
        type: 'object',
        properties: {
          order_total: { type: 'number', description: 'Order total in USD.' },
        },
        required: ['order_total'],
        additionalProperties: false,
      }),
      execute: async (input, options) => execute(
        'check_refund_policy',
        input,
        options.toolCallId,
        ({ order_total }) => ({
          order_total,
          approval_threshold: 100,
          requires_approval: order_total > 100,
          currency: 'USD',
        }),
      ),
    }),
    issue_refund: tool({
      description: 'Issue a refund only when the checked policy permits direct issuance. This is a local fixture with no external side effect.',
      inputSchema: jsonSchema<{ order_id: string; amount: number; reason?: string }>({
        type: 'object',
        properties: {
          order_id: { type: 'string' },
          amount: { type: 'number' },
          reason: { type: 'string' },
        },
        required: ['order_id', 'amount'],
        additionalProperties: false,
      }),
      execute: async (input, options) => execute(
        'issue_refund',
        input,
        options.toolCallId,
        ({ order_id, amount }) => ({
          refund_id: `LOCAL-REFUND-${order_id.replace('#', '')}`,
          amount,
          status: 'recorded-locally',
          external_side_effect: false,
        }),
      ),
    }),
    escalate_refund: tool({
      description: 'Escalate a refund for approval when the checked policy requires it. This records a local fixture only.',
      inputSchema: jsonSchema<{ order_id: string; amount: number; reason: string }>({
        type: 'object',
        properties: {
          order_id: { type: 'string' },
          amount: { type: 'number' },
          reason: { type: 'string' },
        },
        required: ['order_id', 'amount', 'reason'],
        additionalProperties: false,
      }),
      execute: async (input, options) => execute(
        'escalate_refund',
        input,
        options.toolCallId,
        ({ order_id, amount, reason }) => ({
          escalation_id: `LOCAL-ESCALATION-${order_id.replace('#', '')}`,
          order_id,
          amount,
          reason,
          status: 'pending-local-approval',
          external_side_effect: false,
        }),
      ),
    }),
  } satisfies ToolSet

  return {
    tools,
    reset() {
      trace.splice(0, trace.length)
    },
    getTrace() {
      return trace.map((invocation) => structuredClone(invocation))
    },
  }
}
