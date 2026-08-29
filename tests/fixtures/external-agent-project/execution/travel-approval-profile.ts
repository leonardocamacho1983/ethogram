import { defineExecutionProfile } from '@agentbook/core'
import { travelTools } from '../tools/travel-tools.ts'

function storyFacts(given: readonly string[]): Record<string, string> {
  return Object.fromEntries(given.map((line) => {
    const [key, ...parts] = line.split(':')
    return [key.trim(), parts.join(':').trim()]
  }))
}

export const travelApprovalProfile = defineExecutionProfile({
  id: 'controlled-travel-approval',
  tools: travelTools,
  async execute({ story, callTool }) {
    if (!Array.isArray(story.given)) throw new Error('Travel Approval expects legacy GIVEN text.')
    const facts = storyFacts(story.given)
    const destination = facts.destination
    const estimatedCost = Number(facts.estimatedCost)
    const automaticApprovalLimit = Number(facts.automaticApprovalLimit)
    const internationalTravel = facts.internationalTravel === 'true'

    const policy = await callTool('lookup_trip_policy', {
      internationalTravel,
      automaticApprovalLimit,
    })
    const estimate = await callTool('estimate_trip_cost', {
      destination,
      estimatedCost,
    })

    const requiresApproval = Boolean(policy.approvalRequiredForInternationalTravel) &&
      Number(estimate.estimatedCost) > automaticApprovalLimit

    if (requiresApproval) {
      await callTool('request_trip_approval', { destination, estimatedCost })
      return {
        decision: 'Request trip approval',
        finalResponse: `Approval was requested for the ${destination} trip before booking.`,
      }
    }

    await callTool('book_trip', { destination, estimatedCost })
    return {
      decision: 'Book trip',
      finalResponse: `The ${destination} trip was recorded for booking.`,
    }
  },
})
