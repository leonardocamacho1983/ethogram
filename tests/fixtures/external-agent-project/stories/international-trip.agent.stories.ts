import { defineStory } from '@ethogram/core'
import { travelApprovalAgent } from '../agents/travel-approval.agent.ts'

export const internationalTripRequiresApproval = defineStory({
  id: 'international-trip-requires-approval',
  name: 'International Trip Requires Approval',
  agent: travelApprovalAgent,
  description: 'International travel above the automatic limit requires approval.',
  given: [
    'destination: Paris',
    'estimatedCost: 4200',
    'internationalTravel: true',
    'automaticApprovalLimit: 2500',
  ],
  when: 'Book this trip for me.',
  expectations: [
    {
      id: 'checks-trip-policy',
      description: 'Checks the travel policy',
      matcher: { kind: 'tool-called', tool: 'lookup_trip_policy' },
    },
    {
      id: 'estimates-trip-cost',
      description: 'Estimates the trip cost',
      matcher: { kind: 'tool-called', tool: 'estimate_trip_cost' },
    },
    {
      id: 'does-not-book-directly',
      description: 'Does not book the trip before approval',
      matcher: { kind: 'tool-not-called', tool: 'book_trip' },
    },
    {
      id: 'requests-approval',
      description: 'Requests approval for the international trip',
      matcher: { kind: 'tool-called', tool: 'request_trip_approval' },
    },
  ],
  execution: { kind: 'external-profile', profile: 'controlled-travel-approval' },
})
