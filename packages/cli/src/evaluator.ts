import type {
  BehavioralVerdict,
  EvaluationResult,
  ObservedRun,
  StoryDescriptor,
} from './contracts.js'

function matchingCalls(
  matcher: StoryDescriptor['expectations'][number]['matcher'],
  observedRun: ObservedRun,
): ObservedRun['toolCalls'] {
  switch (matcher.kind) {
    case 'tool-called':
    case 'tool-not-called':
      return observedRun.toolCalls.filter((toolCall) => toolCall.name === matcher.tool)
    default: {
      const unsupported: never = matcher
      throw new Error(`UNSUPPORTED_MATCHER: ${JSON.stringify(unsupported)}`)
    }
  }
}

export function evaluateStory(story: StoryDescriptor, observedRun: ObservedRun): EvaluationResult {
  const expectationResults = story.expectations.map((expectation) => {
    const calls = matchingCalls(expectation.matcher, observedRun)
    const matched = expectation.matcher.kind === 'tool-called' ? calls.length > 0 : calls.length === 0
    const verdict: BehavioralVerdict = matched ? 'PASS' : 'FAIL'
    return Object.freeze({
      id: expectation.id,
      description: expectation.description,
      matcher: expectation.matcher,
      verdict,
      observedCallCount: calls.length,
      matchingCallIds: Object.freeze(calls.map(({ callId }) => callId)),
    })
  })
  const expectations = Object.freeze(Object.fromEntries(expectationResults.map(({ id, verdict }) => [id, verdict])))
  const verdict: BehavioralVerdict = expectationResults.every(({ verdict: value }) => value === 'PASS')
    ? 'PASS'
    : 'FAIL'
  return Object.freeze({ verdict, expectations, expectationResults: Object.freeze(expectationResults) })
}
