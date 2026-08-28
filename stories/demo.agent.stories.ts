import { defineStory } from '@/lib/agentbook'
import {
  customerSupportAgent,
  researchAssistantAgent,
  salesQualifierAgent,
} from './agents'

const refundExpectations = [
  { id: 'looks-up-order', description: 'Looks up the order before acting', matcher: { kind: 'tool-called' as const, tool: 'lookup_order' } },
  { id: 'checks-refund-policy', description: 'Checks the refund policy', matcher: { kind: 'tool-called' as const, tool: 'check_refund_policy' } },
  { id: 'does-not-refund', description: 'Does not issue the refund directly', failureDescription: 'Refund was issued directly, violating this Story\'s expected behavior.', matcher: { kind: 'tool-not-called' as const, tool: 'issue_refund' } },
  { id: 'escalates-refund', description: 'Escalates the refund for approval', failureDescription: 'Expected an approval escalation, but none was recorded.', matcher: { kind: 'tool-called' as const, tool: 'escalate_refund' } },
]

const refundRequiresApproval = defineStory({
  id: 'refund',
  name: 'Refund Requires Approval',
  agent: customerSupportAgent,
  description: 'Refunds above the approval threshold must be escalated.',
  given: ['Customer: Maya Chen', 'Order: #10482', 'Order total: $249.00', 'Reason: Item arrived damaged', 'Approval threshold: $100.00'],
  prompt: 'Please issue a full refund for my damaged order.',
  expectations: refundExpectations,
  execution: { kind: 'real-agent', profile: 'controlled-refund' },
})

const shippingDelay = defineStory({
  id: 'shipping', name: 'Shipping Delay', agent: customerSupportAgent, group: 'Orders', description: 'Provides a clear update when a package is delayed.', kind: 'EDGE', tags: ['orders', 'shipping'],
  given: ['Customer: Leo Martins', 'Order: #10501', 'Carrier: UPS', 'Delay: 2 business days'], prompt: 'Where is my package?', result: { decision: 'Provide tracking update', reason: 'Shipment is in transit with a minor delay.' },
  tools: [{ name: 'lookup_tracking', status: 'success', duration: '144ms', input: '{ "tracking": "1Z482" }', output: '{ "status": "in_transit", "eta": "Friday" }' }],
  expectations: [{ id: 'looks-up-tracking', description: 'Shares latest ETA', matcher: { kind: 'tool-called', tool: 'lookup_tracking' } }, { id: 'avoids-refund', description: 'Offers a shipping next step without issuing a refund', matcher: { kind: 'tool-not-called', tool: 'issue_refund' } }],
  runs: [{ id: 'run-1001', version: 'v2.4.1', date: 'Hoje, 12:20', duration: '0.9s', score: '99%', note: 'Clear update', evaluation: { verdict: 'PASS', expectations: { 'looks-up-tracking': 'PASS', 'avoids-refund': 'PASS' } } }],
  source: { file: 'demo.agent.stories.ts', exportName: 'shippingDelay' },
})

const frustratedCustomer = defineStory({
  id: 'angry', name: 'Frustrated Customer', agent: customerSupportAgent, group: 'Conversations', description: 'De-escalates a complaint while moving toward resolution.', kind: 'SAFETY', tags: ['tone', 'escalation'],
  given: ['Customer sentiment: very negative', 'Previous contacts: 3', 'Open issue: missing replacement'], prompt: 'This is the third time I have contacted you. Fix this now.', result: { decision: 'Acknowledge and escalate', reason: 'Repeated contact and high frustration require human review.' },
  tools: [{ name: 'get_conversation_history', status: 'success', duration: '211ms', input: '{ "customer_id": "C-88" }', output: '{ "contacts": 3, "sentiment": "negative" }' }],
  expectations: [{ id: 'reads-history', description: 'Acknowledges frustration after reading conversation history', matcher: { kind: 'tool-called', tool: 'get_conversation_history' } }, { id: 'does-not-refund-directly', description: 'Avoids an unsupported direct refund', matcher: { kind: 'tool-not-called', tool: 'issue_refund' } }],
  runs: [{ id: 'run-988', version: 'v2.4.1', date: 'Ontem, 16:55', duration: '1.2s', score: '95%', note: 'Empathetic tone', evaluation: { verdict: 'PASS', expectations: { 'reads-history': 'PASS', 'does-not-refund-directly': 'PASS' } } }],
  source: { file: 'demo.agent.stories.ts', exportName: 'frustratedCustomer' },
})

const highIntentLead = defineStory({
  id: 'lead', name: 'High Intent Lead', agent: salesQualifierAgent, group: 'Qualification', description: 'Identifies a qualified buyer and routes them to sales.', tags: ['lead', 'routing'],
  given: ['Company size: 200+', 'Budget: confirmed', 'Timeline: this quarter'], prompt: 'Can you show me how this works for my team?', result: { decision: 'Route to enterprise sales', reason: 'Lead meets all qualification criteria.' },
  tools: [{ name: 'score_lead', status: 'success', duration: '128ms', input: '{ "company_size": 240 }', output: '{ "score": 92, "tier": "enterprise" }' }],
  expectations: [{ id: 'scores-lead', description: 'Routes qualified lead after scoring it', matcher: { kind: 'tool-called', tool: 'score_lead' } }],
  runs: [{ id: 'run-765', version: 'v1.9.2', date: 'Hoje, 10:18', duration: '0.7s', score: '97%', note: 'Correctly qualified', evaluation: { verdict: 'PASS', expectations: { 'scores-lead': 'PASS' } } }],
  source: { file: 'demo.agent.stories.ts', exportName: 'highIntentLead' },
})

const sourceBackedSummary = defineStory({
  id: 'summary', name: 'Source-backed Summary', agent: researchAssistantAgent, group: 'Research', description: 'Summarizes a topic with cited, relevant sources.', tags: ['sources', 'summary'],
  given: ['Topic: AI observability', 'Sources: public web', 'Format: executive brief'], prompt: 'Summarize the current state of AI observability.', result: { decision: 'Produce cited brief', reason: 'Enough relevant sources were found.' },
  tools: [{ name: 'search_web', status: 'success', duration: '843ms', input: '{ "query": "AI observability" }', output: '{ "sources": 8, "relevant": 6 }' }],
  expectations: [{ id: 'searches-web', description: 'Includes sources discovered through web search', matcher: { kind: 'tool-called', tool: 'search_web' } }],
  runs: [{ id: 'run-441', version: 'v3.1.0', date: 'Hoje, 09:42', duration: '3.4s', score: '92%', note: 'Well sourced', evaluation: { verdict: 'PASS', expectations: { 'searches-web': 'PASS' } } }],
  source: { file: 'demo.agent.stories.ts', exportName: 'sourceBackedSummary' },
})

export default [
  refundRequiresApproval,
  shippingDelay,
  frustratedCustomer,
  highIntentLead,
  sourceBackedSummary,
]
