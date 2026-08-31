import type { ExternalToolSet } from '@ethogram/core'

export const travelTools = {
  lookup_trip_policy: {
    description: 'Look up the fixture policy for international travel.',
    execute: ({ internationalTravel, automaticApprovalLimit }) => ({
      internationalTravel,
      automaticApprovalLimit,
      approvalRequiredForInternationalTravel: true,
    }),
  },
  estimate_trip_cost: {
    description: 'Return the deterministic fixture estimate for a destination.',
    execute: ({ destination, estimatedCost }) => ({
      destination,
      estimatedCost,
      currency: 'USD',
    }),
  },
  request_trip_approval: {
    description: 'Record a local-only approval request.',
    execute: ({ destination, estimatedCost }) => ({
      approvalRequestId: 'LOCAL-TRIP-APPROVAL-001',
      destination,
      estimatedCost,
      status: 'pending-local-approval',
      externalSideEffect: false,
    }),
  },
  book_trip: {
    description: 'Record a local-only booking when policy permits it.',
    execute: ({ destination, estimatedCost }) => ({
      bookingId: 'LOCAL-TRIP-BOOKING-001',
      destination,
      estimatedCost,
      status: 'recorded-locally',
      externalSideEffect: false,
    }),
  },
} satisfies ExternalToolSet
