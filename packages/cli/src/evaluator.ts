import type {
  BehavioralVerdict,
  EvaluationResult,
  ObservedRun,
  StoryDescriptor,
} from './contracts.js'

function evaluateMatcher(
  matcher: StoryDescriptor['expectations'][number]['matcher'],
  observedRun: ObservedRun,
): boolean {
  const called = observedRun.toolCalls.some((toolCall) => toolCall.name === matcher.tool)
  return matcher.kind === 'tool-called' ? called : !called
}

export function evaluateStory(story: StoryDescriptor, observedRun: ObservedRun): EvaluationResult {
  const expectationEntries = story.expectations.map((expectation) => {
    const verdict: BehavioralVerdict = evaluateMatcher(expectation.matcher, observedRun) ? 'PASS' : 'FAIL'
    return [expectation.id, verdict] as const
  })
  const expectations = Object.freeze(Object.fromEntries(expectationEntries))
  const verdict: BehavioralVerdict = Object.values(expectations).every((value) => value === 'PASS')
    ? 'PASS'
    : 'FAIL'
  return Object.freeze({ verdict, expectations })
}
