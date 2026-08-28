import type { StoryExpectation } from '../lib/agentbook/domain'

const validExpectation: StoryExpectation = {
  id: 'valid-expectation',
  description: 'Calls the expected tool',
  matcher: { kind: 'tool-called', tool: 'expected_tool' },
}

const invalidExpectation: StoryExpectation = {
  id: 'invalid-expectation',
  description: 'Must not embed its own result',
  matcher: { kind: 'tool-not-called', tool: 'forbidden_tool' },
  // @ts-expect-error Story expectations cannot contain behavioral verdicts.
  passed: true,
}

void validExpectation
void invalidExpectation
