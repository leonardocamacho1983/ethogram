import { defineAgent } from '@ethogram/core'

export const travelApprovalAgent = defineAgent({
  id: 'travel-approval-agent',
  name: 'Travel Approval Agent',
  description: 'Applies an external project travel approval policy.',
  icon: 'target',
})
