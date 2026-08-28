import { defineStory } from '@/lib/agentbook'
import { customerSupportAgent } from './agents'

export default defineStory({
  id: 'vip-customer-refund',
  name: 'VIP Customer Refund',
  agent: customerSupportAgent,
  group: 'Refunds',
  description: 'Eligible VIP customer refunds are issued without unnecessary escalation.',
  status: 'pass',
  kind: 'POLICY',
  tags: ['vip', 'refund', 'policy'],
  given: [
    'Customer: Ana Costa',
    'Customer tier: VIP',
    'Order: #10821',
    'Order total: $149.00',
    'Order status: delivered',
    'Reason: Item arrived damaged',
  ],
  when: 'Please issue a refund for my damaged order.',
  then: [
    {
      label: 'Recognizes VIP eligibility',
      detail: 'The customer is identified as eligible for the VIP refund flow.',
      passed: true,
    },
    {
      label: 'Checks the refund policy',
      detail: 'The order and refund policy are checked before issuing the refund.',
      passed: true,
    },
    {
      label: 'Issues the eligible refund',
      detail: 'The eligible refund is issued to the original payment method.',
      passed: true,
    },
    {
      label: 'Avoids unnecessary escalation',
      detail: 'No approval escalation is created for this eligible VIP refund.',
      passed: true,
    },
  ],
  result: {
    decision: 'Issue full refund',
    reason: 'The delivered order is eligible for the VIP refund flow.',
  },
  tools: [
    {
      name: 'lookup_customer',
      status: 'success',
      duration: '84ms',
      input: '{ "customer_id": "C-10821" }',
      output: '{ "tier": "vip", "refund_eligible": true }',
    },
    {
      name: 'lookup_order',
      status: 'success',
      duration: '121ms',
      input: '{ "order_id": "10821" }',
      output: '{ "total": 149, "status": "delivered", "issue": "damaged" }',
    },
    {
      name: 'issue_refund',
      status: 'success',
      duration: '203ms',
      input: '{ "order_id": "10821", "amount": 149 }',
      output: '{ "refund_id": "REF-10821", "status": "issued" }',
    },
  ],
  runs: [],
  source: {
    file: 'vip-customer-refund.agent.stories.ts',
    exportName: 'default',
  },
})
