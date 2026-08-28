import type {
  BehavioralVerdict,
  EvaluationResult,
  ExpectationMatcher,
  ObservedRun,
  Story,
} from './domain'

export function evaluateMatcher(matcher: ExpectationMatcher, observedRun: ObservedRun): boolean {
  const toolWasCalled = observedRun.toolCalls.some((toolCall) => toolCall.name === matcher.tool)

  switch (matcher.kind) {
    case 'tool-called':
      return toolWasCalled
    case 'tool-not-called':
      return !toolWasCalled
  }
}

export function evaluateStory(story: Story, observedRun: ObservedRun): EvaluationResult {
  const expectationEntries = story.expectations.map((expectation) => {
    const verdict: BehavioralVerdict = evaluateMatcher(expectation.matcher, observedRun) ? 'PASS' : 'FAIL'
    return [expectation.id, verdict] as const
  })
  const expectations = Object.freeze(Object.fromEntries(expectationEntries))
  const verdict: BehavioralVerdict = Object.values(expectations).every((result) => result === 'PASS')
    ? 'PASS'
    : 'FAIL'

  return Object.freeze({ verdict, expectations })
}
