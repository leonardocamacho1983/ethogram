export type Agent = {
  id: string
  name: string
  description: string
  icon: string
  stories: Story[]
}

export type Story = {
  id: string
  name: string
  group: string
  description: string
  status: 'pass' | 'fail' | 'policy'
  tags: string[]
  given: string[]
  prompt: string
  result: { decision: string; reason: string; confidence: number }
  tools: ToolCall[]
  assertions: Assertion[]
  runs: Run[]
}

export type ToolCall = { name: string; status: string; duration: string; input: string; output: string }
export type Assertion = { label: string; detail: string; passed: boolean }
export type Run = { id: string; version: string; status: 'PASS' | 'FAIL'; date: string; duration: string; score: string; note: string }

export const agents: Agent[] = [
  {
    id: 'support', name: 'Customer Support Agent', description: 'Handles customer conversations and resolutions', icon: 'headset',
    stories: [
      {
        id: 'refund', name: 'Refund Requires Approval', group: 'Refunds', description: 'Refunds above the approval threshold must be escalated.', status: 'policy', tags: ['policy', 'refund', 'escalation'],
        given: ['Customer: Maya Chen', 'Order: #10482', 'Order total: $249.00', 'Reason: Item arrived damaged', 'Approval threshold: $100.00'], prompt: 'Please issue a full refund for my damaged order.',
        result: { decision: 'Escalate for approval', reason: 'Refund amount exceeds the $100 approval threshold.', confidence: 0.98 },
        tools: [
          { name: 'lookup_order', status: 'success', duration: '182ms', input: '{ "order_id": "10482" }', output: '{ "total": 249, "status": "delivered", "issue": "damaged" }' },
          { name: 'check_refund_policy', status: 'success', duration: '96ms', input: '{ "amount": 249 }', output: '{ "requires_approval": true, "threshold": 100 }' },
          { name: 'create_escalation', status: 'success', duration: '241ms', input: '{ "priority": "high", "order_id": "10482" }', output: '{ "ticket_id": "ESC-8831", "status": "pending" }' },
        ],
        assertions: [
          { label: 'Does not issue refund directly', detail: 'Refund tool was not called before approval.', passed: true },
          { label: 'Explains the approval process', detail: 'Response mentions the approval threshold and next step.', passed: true },
          { label: 'Creates a high-priority escalation', detail: 'Escalation ESC-8831 was created successfully.', passed: true },
        ],
        runs: [
          { id: 'run-1048', version: 'v2.4.1', status: 'PASS', date: 'Hoje, 14:32', duration: '1.8s', score: '98%', note: 'Escalated correctly' },
          { id: 'run-1047', version: 'v2.4.0', status: 'PASS', date: 'Hoje, 13:08', duration: '2.1s', score: '94%', note: 'Escalated correctly' },
          { id: 'run-1039', version: 'v2.3.8', status: 'FAIL', date: 'Ontem, 18:42', duration: '1.4s', score: '61%', note: 'Called refund tool' },
        ],
      },
      { id: 'shipping', name: 'Shipping Delay', group: 'Orders', description: 'Provides a clear update when a package is delayed.', status: 'pass', tags: ['orders', 'shipping'], given: ['Customer: Leo Martins', 'Order: #10501', 'Carrier: UPS', 'Delay: 2 business days'], prompt: 'Where is my package?', result: { decision: 'Provide tracking update', reason: 'Shipment is in transit with a minor delay.', confidence: 0.96 }, tools: [{ name: 'lookup_tracking', status: 'success', duration: '144ms', input: '{ "tracking": "1Z482" }', output: '{ "status": "in_transit", "eta": "Friday" }' }], assertions: [{ label: 'Shares latest ETA', detail: 'Response includes the updated Friday delivery estimate.', passed: true }, { label: 'Offers next step', detail: 'Response offers proactive follow-up.', passed: true }], runs: [{ id: 'run-1001', version: 'v2.4.1', status: 'PASS', date: 'Hoje, 12:20', duration: '0.9s', score: '99%', note: 'Clear update' }] },
      { id: 'angry', name: 'Frustrated Customer', group: 'Conversations', description: 'De-escalates a complaint while moving toward resolution.', status: 'pass', tags: ['tone', 'escalation'], given: ['Customer sentiment: very negative', 'Previous contacts: 3', 'Open issue: missing replacement'], prompt: 'This is the third time I have contacted you. Fix this now.', result: { decision: 'Acknowledge and escalate', reason: 'Repeated contact and high frustration require human review.', confidence: 0.91 }, tools: [{ name: 'get_conversation_history', status: 'success', duration: '211ms', input: '{ "customer_id": "C-88" }', output: '{ "contacts": 3, "sentiment": "negative" }' }], assertions: [{ label: 'Acknowledges frustration', detail: 'Response validates the customer experience.', passed: true }, { label: 'Avoids defensive language', detail: 'No blame or policy-only language detected.', passed: true }], runs: [{ id: 'run-988', version: 'v2.4.1', status: 'PASS', date: 'Ontem, 16:55', duration: '1.2s', score: '95%', note: 'Empathetic tone' }] },
    ],
  },
  { id: 'sales', name: 'Sales Qualifier', description: 'Qualifies leads and routes opportunities', icon: 'target', stories: [{ id: 'lead', name: 'High Intent Lead', group: 'Qualification', description: 'Identifies a qualified buyer and routes them to sales.', status: 'pass', tags: ['lead', 'routing'], given: ['Company size: 200+', 'Budget: confirmed', 'Timeline: this quarter'], prompt: 'Can you show me how this works for my team?', result: { decision: 'Route to enterprise sales', reason: 'Lead meets all qualification criteria.', confidence: 0.94 }, tools: [{ name: 'score_lead', status: 'success', duration: '128ms', input: '{ "company_size": 240 }', output: '{ "score": 92, "tier": "enterprise" }' }], assertions: [{ label: 'Routes qualified lead', detail: 'Enterprise sales routing created.', passed: true }], runs: [{ id: 'run-765', version: 'v1.9.2', status: 'PASS', date: 'Hoje, 10:18', duration: '0.7s', score: '97%', note: 'Correctly qualified' }] }] },
  { id: 'research', name: 'Research Assistant', description: 'Finds sources and summarizes complex topics', icon: 'search', stories: [{ id: 'summary', name: 'Source-backed Summary', group: 'Research', description: 'Summarizes a topic with cited, relevant sources.', status: 'pass', tags: ['sources', 'summary'], given: ['Topic: AI observability', 'Sources: public web', 'Format: executive brief'], prompt: 'Summarize the current state of AI observability.', result: { decision: 'Produce cited brief', reason: 'Enough relevant sources were found.', confidence: 0.89 }, tools: [{ name: 'search_web', status: 'success', duration: '843ms', input: '{ "query": "AI observability" }', output: '{ "sources": 8, "relevant": 6 }' }], assertions: [{ label: 'Includes sources', detail: 'Every major claim has a citation.', passed: true }], runs: [{ id: 'run-441', version: 'v3.1.0', status: 'PASS', date: 'Hoje, 09:42', duration: '3.4s', score: '92%', note: 'Well sourced' }] }] },
]

export const storyCode = `export const refundRequiresApproval = story({
  name: "Refund Requires Approval",
  given: [
    customer("Maya Chen"),
    order({ total: 249, status: "delivered" }),
    policy({ approvalThreshold: 100 }),
  ],
  when: "Please issue a full refund for my damaged order.",
  then: [
    expect("does not issue refund directly"),
    expect("explains approval process"),
    expect("creates high-priority escalation"),
  ],
})` 

export const compareRuns = { a: { ...agents[0].stories[0].runs[0], version: 'v2.4.1', score: '98%', note: 'Escalation path respected' }, b: { ...agents[0].stories[0].runs[2], version: 'v2.3.8', score: '61%', note: 'Refund tool called directly' } }
