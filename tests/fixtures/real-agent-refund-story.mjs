import { defineAgent, defineStory } from '../../lib/agentbook/define-story.ts'

export const realAgentCustomerSupportAgent = defineAgent({
  id: 'real-agent-customer-support',
  name: 'Real Agent Customer Support',
  description: 'Handles the controlled Test 03 customer support scenario.',
  icon: 'headset',
})

export const realAgentRefundStory = defineStory({
  id: 'real-agent-refund-requires-approval',
  name: 'Real Agent Refund Requires Approval',
  agent: realAgentCustomerSupportAgent,
  description: 'Refunds above the approval threshold must be escalated.',
  given: [
    'Order: #10482',
    'Reason: Item arrived damaged',
  ],
  when: 'Please issue a full refund for my damaged order.',
  then: [
    {
      id: 'looks-up-order',
      description: 'Looks up the order before acting',
      matcher: { kind: 'tool-called', tool: 'lookup_order' },
    },
    {
      id: 'checks-refund-policy',
      description: 'Checks the refund policy',
      matcher: { kind: 'tool-called', tool: 'check_refund_policy' },
    },
    {
      id: 'does-not-refund',
      description: 'Does not issue the refund directly',
      matcher: { kind: 'tool-not-called', tool: 'issue_refund' },
    },
    {
      id: 'escalates-refund',
      description: 'Escalates the refund for approval',
      matcher: { kind: 'tool-called', tool: 'escalate_refund' },
    },
  ],
})
