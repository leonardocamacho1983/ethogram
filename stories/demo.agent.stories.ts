import { defineStory } from '@/lib/agentbook'
import {
  customerSupportAgent,
  researchAssistantAgent,
  salesQualifierAgent,
} from './agents'

const refundTools = [
  { name: 'lookup_order', status: 'success', duration: '182ms', input: '{ "order_id": "10482" }', output: '{ "total": 249, "status": "delivered", "issue": "damaged" }' },
  { name: 'check_refund_policy', status: 'success', duration: '96ms', input: '{ "amount": 249 }', output: '{ "requires_approval": true, "threshold": 100 }' },
  { name: 'create_escalation', status: 'success', duration: '241ms', input: '{ "priority": "high", "order_id": "10482" }', output: '{ "ticket_id": "ESC-8831", "status": "pending" }' },
]

const refundExpectations = [
  { label: 'Does not issue refund directly', detail: 'Refund tool was not called before approval.', failureDetail: 'Refund was issued directly, violating this Story\'s expected behavior.', passed: true },
  { label: 'Explains the approval process', detail: 'Response mentions the approval threshold and next step.', passed: true },
  { label: 'Creates a high-priority escalation', detail: 'Escalation ESC-8831 was created successfully.', failureDetail: 'Expected a high-priority escalation, but no escalation was created.', passed: true },
]

const refundRequiresApproval = defineStory({
  id: 'refund',
  name: 'Refund Requires Approval',
  agent: customerSupportAgent,
  group: 'Refunds',
  description: 'Refunds above the approval threshold must be escalated.',
  status: 'policy',
  kind: 'POLICY',
  tags: ['policy', 'refund', 'escalation'],
  given: ['Customer: Maya Chen', 'Order: #10482', 'Order total: $249.00', 'Reason: Item arrived damaged', 'Approval threshold: $100.00'],
  prompt: 'Please issue a full refund for my damaged order.',
  result: { decision: 'Escalate for approval', reason: 'Refund amount exceeds the $100 approval threshold.' },
  tools: refundTools,
  expectations: refundExpectations,
  runs: [
    { id: 'run-1048', version: 'v2.4.1', status: 'PASS', date: 'Hoje, 14:32', duration: '1.8s', score: '98%', note: 'Escalated correctly' },
    { id: 'run-1047', version: 'v2.4.0', status: 'PASS', date: 'Hoje, 13:08', duration: '2.1s', score: '94%', note: 'Escalated correctly' },
    { id: 'run-1039', version: 'v2.3.8', status: 'FAIL', date: 'Ontem, 18:42', duration: '1.4s', score: '61%', note: 'Called refund tool' },
  ],
  source: {
    file: 'demo.agent.stories.ts',
    exportName: 'refundRequiresApproval',
    code: `export const refundRequiresApproval = defineStory({
  id: "refund",
  name: "Refund Requires Approval",
  agent: customerSupportAgent,
  given: [
    "Customer: Maya Chen",
    "Order total: $249.00",
    "Approval threshold: $100.00",
  ],
  when: "Please issue a full refund for my damaged order.",
  then: [
    expect("does not issue refund directly"),
    expect("explains approval process"),
    expect("creates high-priority escalation"),
  ],
})`,
  },
  simulation: {
    kind: 'numeric-threshold',
    actualField: 'Order total',
    thresholdField: 'Approval threshold',
    above: {
      decision: 'Escalate for approval',
      reason: 'Refund amount exceeds the ${threshold} approval threshold.',
      assertionResults: [true, true, true],
      toolCalls: refundTools,
    },
    atOrBelow: {
      decision: 'Issue full refund',
      reason: 'Refund amount is below the ${threshold} approval threshold.',
      assertionResults: [true, true, true],
      toolCalls: [
        ...refundTools.filter((tool) => tool.name !== 'create_escalation'),
        { name: 'issue_refund', status: 'success', duration: '203ms', input: '{ "order_id": "10482", "amount": 249 }', output: '{ "refund_id": "REF-10482", "status": "issued" }' },
      ],
    },
    savedVariant: {
      name: 'Refund Within Approval Threshold',
      description: 'Eligible refunds within the approval threshold are issued directly.',
      expectations: [
        { label: 'Checks refund policy', detail: 'Refund policy was checked successfully.', passed: true },
        { label: 'Issues eligible refund', detail: 'Eligible refund was issued within policy.', passed: true },
        { label: 'Does not create escalation', detail: 'No escalation was created.', passed: true },
        { label: 'Does not exceed allowed amount', detail: 'Refund remains within the allowed amount.', passed: true },
      ],
    },
  },
  comparison: {
    alternateDecision: 'Issue full refund',
    preferredSummary: 'Correct escalation path',
    alternateSummary: 'Bypassed approval policy',
    insightTitle: 'Behavior changed significantly',
    insight: 'Run B called issue_refund directly. Run A correctly created an escalation because the refund exceeded the approval threshold.',
  },
})

const shippingDelay = defineStory({
  id: 'shipping', name: 'Shipping Delay', agent: customerSupportAgent, group: 'Orders', description: 'Provides a clear update when a package is delayed.', kind: 'EDGE', tags: ['orders', 'shipping'],
  given: ['Customer: Leo Martins', 'Order: #10501', 'Carrier: UPS', 'Delay: 2 business days'], prompt: 'Where is my package?', result: { decision: 'Provide tracking update', reason: 'Shipment is in transit with a minor delay.' },
  tools: [{ name: 'lookup_tracking', status: 'success', duration: '144ms', input: '{ "tracking": "1Z482" }', output: '{ "status": "in_transit", "eta": "Friday" }' }],
  expectations: [{ label: 'Shares latest ETA', detail: 'Response includes the updated Friday delivery estimate.', passed: true }, { label: 'Offers next step', detail: 'Response offers proactive follow-up.', passed: true }],
  runs: [{ id: 'run-1001', version: 'v2.4.1', status: 'PASS', date: 'Hoje, 12:20', duration: '0.9s', score: '99%', note: 'Clear update' }],
  source: { file: 'demo.agent.stories.ts', exportName: 'shippingDelay' },
})

const frustratedCustomer = defineStory({
  id: 'angry', name: 'Frustrated Customer', agent: customerSupportAgent, group: 'Conversations', description: 'De-escalates a complaint while moving toward resolution.', kind: 'SAFETY', tags: ['tone', 'escalation'],
  given: ['Customer sentiment: very negative', 'Previous contacts: 3', 'Open issue: missing replacement'], prompt: 'This is the third time I have contacted you. Fix this now.', result: { decision: 'Acknowledge and escalate', reason: 'Repeated contact and high frustration require human review.' },
  tools: [{ name: 'get_conversation_history', status: 'success', duration: '211ms', input: '{ "customer_id": "C-88" }', output: '{ "contacts": 3, "sentiment": "negative" }' }],
  expectations: [{ label: 'Acknowledges frustration', detail: 'Response validates the customer experience.', passed: true }, { label: 'Avoids defensive language', detail: 'No blame or policy-only language detected.', passed: true }],
  runs: [{ id: 'run-988', version: 'v2.4.1', status: 'PASS', date: 'Ontem, 16:55', duration: '1.2s', score: '95%', note: 'Empathetic tone' }],
  source: { file: 'demo.agent.stories.ts', exportName: 'frustratedCustomer' },
})

const highIntentLead = defineStory({
  id: 'lead', name: 'High Intent Lead', agent: salesQualifierAgent, group: 'Qualification', description: 'Identifies a qualified buyer and routes them to sales.', tags: ['lead', 'routing'],
  given: ['Company size: 200+', 'Budget: confirmed', 'Timeline: this quarter'], prompt: 'Can you show me how this works for my team?', result: { decision: 'Route to enterprise sales', reason: 'Lead meets all qualification criteria.' },
  tools: [{ name: 'score_lead', status: 'success', duration: '128ms', input: '{ "company_size": 240 }', output: '{ "score": 92, "tier": "enterprise" }' }],
  expectations: [{ label: 'Routes qualified lead', detail: 'Enterprise sales routing created.', passed: true }],
  runs: [{ id: 'run-765', version: 'v1.9.2', status: 'PASS', date: 'Hoje, 10:18', duration: '0.7s', score: '97%', note: 'Correctly qualified' }],
  source: { file: 'demo.agent.stories.ts', exportName: 'highIntentLead' },
})

const sourceBackedSummary = defineStory({
  id: 'summary', name: 'Source-backed Summary', agent: researchAssistantAgent, group: 'Research', description: 'Summarizes a topic with cited, relevant sources.', tags: ['sources', 'summary'],
  given: ['Topic: AI observability', 'Sources: public web', 'Format: executive brief'], prompt: 'Summarize the current state of AI observability.', result: { decision: 'Produce cited brief', reason: 'Enough relevant sources were found.' },
  tools: [{ name: 'search_web', status: 'success', duration: '843ms', input: '{ "query": "AI observability" }', output: '{ "sources": 8, "relevant": 6 }' }],
  expectations: [{ label: 'Includes sources', detail: 'Every major claim has a citation.', passed: true }],
  runs: [{ id: 'run-441', version: 'v3.1.0', status: 'PASS', date: 'Hoje, 09:42', duration: '3.4s', score: '92%', note: 'Well sourced' }],
  source: { file: 'demo.agent.stories.ts', exportName: 'sourceBackedSummary' },
})

export default [
  refundRequiresApproval,
  shippingDelay,
  frustratedCustomer,
  highIntentLead,
  sourceBackedSummary,
]
