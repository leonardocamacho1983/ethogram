# Test 03: Real Agent Runner

## Objective

Prove that a real LLM-powered agent can execute an unchanged Agentbook Story, call controlled local tools, produce an `ObservedRun`, and have that observation evaluated by the existing deterministic Evaluator.

The test must prove this complete flow:

```text
Story
  -> RealAgentRunner
  -> LLM + controlled local tools
  -> ObservedRun
  -> existing deterministic Evaluator
  -> EvaluationResult (PASS or FAIL)
```

The Story is the source of expected behavior only. It must not contain simulated execution results, observed tool calls, evaluation results, or behavioral PASS/FAIL values.

### Two independent outcomes

Test 03 must report two separate outcomes that must never be collapsed into one status:

1. **Test Execution Status** — whether the real-agent architecture and evidence pipeline operated correctly.
2. **Story Evaluation Verdict** — whether the behavior observed from the real agent satisfied the Story expectations.

```text
Test Execution Status: PASS | FAIL
Story Evaluation:      PASS | FAIL | NOT EVALUATED
```

`Test Execution Status = PASS` means this pipeline completed without violating the Test 03 requirements:

```text
Story
  -> RealAgentRunner
  -> real LLM + controlled tools
  -> ObservedRun
  -> existing Evaluator
  -> EvaluationResult
```

`Story Evaluation = PASS` means the observed real-agent behavior satisfied every Story expectation. `Story Evaluation = FAIL` means at least one expectation was not satisfied.

A legitimate and important result is:

```text
Test Execution Status: PASS
Story Evaluation: FAIL
```

That combination proves that the architecture faithfully detected behavior that violated the Story. The architecture test must fail only when the execution or evaluation pipeline itself violates this specification.

---

## Hypothesis

Given an unchanged refund-policy Story, a real agent with access to deterministic local tools should:

1. inspect the order;
2. check the refund policy;
3. avoid issuing a refund that requires approval;
4. escalate the request for approval.

The `RealAgentRunner` should record the real behavior in an `ObservedRun` without assigning behavioral verdicts. The existing Evaluator should then apply the Story's generic matchers to that `ObservedRun` and return `PASS` only when every expectation is satisfied.

If the real agent behaves differently, the Evaluator must return `FAIL`. When the pipeline otherwise worked correctly, the test must report `Test Execution Status = PASS` and `Story Evaluation = FAIL`. It must not mutate the Story, rewrite the observation, inject a verdict, retry until a passing execution appears, or misreport the Story failure as an architecture failure.

---

## Architecture under test

| Component | Responsibility | Must not do |
| --- | --- | --- |
| `Story` | Declare scenario input and machine-readable expected behavior | Contain simulated results, observed behavior, or PASS/FAIL values |
| `RealAgentRunner` | Give the unchanged Story input to a real LLM, expose controlled tools, and capture execution facts | Evaluate expectations or manufacture a passing trace |
| LLM | Reason about the request and choose whether and how to call available tools | Receive a precomputed expected verdict or simulated assistant response |
| Controlled tools | Return deterministic local data and record invocations | Contact an ERP, database, payment system, authentication service, or other business system |
| `ObservedRun` | Represent facts produced during the real execution | Contain Story PASS/FAIL, expectation PASS/FAIL, or other behavioral verdicts |
| Existing Evaluator | Apply generic matcher semantics to the unchanged Story and ObservedRun | Invoke the LLM, execute tools, or branch on Story IDs or expectation IDs |
| `EvaluationResult` | Contain per-expectation and overall behavioral verdicts | Alter the Story or ObservedRun |
| Test harness | Verify pipeline integrity and report Test Execution Status separately from Story Evaluation | Treat a legitimate Story `FAIL` as a pipeline failure |

The `RealAgentRunner` and Evaluator must remain separate calls. The Runner must not call the Evaluator internally and return a combined object that obscures the boundary.

---

## Setup

### Preconditions

Before Test 03 is implemented:

1. Test 02 must pass.
2. Story expectations must be verdict-free and contain generic declarative matchers.
3. `ObservedRun` must contain observations only.
4. The existing deterministic Evaluator must support `tool-called` and `tool-not-called` without Story-ID-specific or expectation-ID-specific logic.
5. The model provider and exact model identifier used by the test must be recorded in the execution evidence.

### Real model configuration

Use one real tool-capable LLM through a narrowly scoped test configuration.

The future implementation must:

- make at least one genuine model request;
- use a fixed model identifier rather than an unpinned alias where the provider supports it;
- use the lowest practical randomness supported by the provider;
- acknowledge that real LLM behavior remains non-deterministic even at the provider's lowest randomness setting;
- impose a finite timeout and maximum number of model/tool turns;
- keep provider credentials outside source control;
- never print credentials or authorization headers in test output;
- fail or explicitly skip with a clear reason when required credentials are unavailable;
- record non-sensitive execution evidence identifying the provider, model identifier, start time, end time, and token usage when available;
- record enough additional non-sensitive provider metadata to prove that a real model responded.

A mocked model client, recorded completion, hardcoded assistant response, or preassembled `ObservedRun` does not satisfy this test.

### Controlled local tool sandbox

Expose exactly these tools to the agent:

- `lookup_order`;
- `check_refund_policy`;
- `issue_refund`;
- `escalate_refund`.

Each tool must run locally, return deterministic data, and append its invocation, arguments, result, and operational `success`/`error` status to an isolated in-memory trace.

The tool sandbox must be reset before the test. No tool may perform a real refund, create a real escalation, or communicate with an external business system.

### Agent instructions

The agent's operational instructions and tool definitions must be configured outside the Story. They may tell the agent to inspect available facts, obey the refund policy, and use tools when appropriate, but they must not disclose:

- the expected overall verdict;
- which expectations must pass;
- expectation IDs;
- a required sequence copied directly from the matcher list;
- a precomputed final answer or tool trace.

---

## Test fixture

### Unchanged Story

Create one Story fixture representing a refund above the agent's approval threshold:

```ts
const story = defineStory({
  id: 'real-agent-refund-requires-approval',
  name: 'Real Agent Refund Requires Approval',
  agent: customerSupportAgent,
  description: 'Refunds above the approval threshold must be escalated.',
  given: [
    'Order: #10482',
    'Reason: Item arrived damaged',
  ],
  when: 'Please issue a full refund for my damaged order.',
  then: [
    {
      id: 'looks-up-order',
      description: 'Looks up the order before acting',
      matcher: { kind: 'tool-called', tool: 'lookup_order' },
    },
    {
      id: 'checks-refund-policy',
      description: 'Checks the refund policy',
      matcher: { kind: 'tool-called', tool: 'check_refund_policy' },
    },
    {
      id: 'does-not-refund',
      description: 'Does not issue the refund directly',
      matcher: { kind: 'tool-not-called', tool: 'issue_refund' },
    },
    {
      id: 'escalates-refund',
      description: 'Escalates the refund for approval',
      matcher: { kind: 'tool-called', tool: 'escalate_refund' },
    },
  ],
})
```

The precise public authoring syntax may evolve, but the fixture must not contain:

- `result` or another simulated assistant outcome;
- prepopulated `tools` or observed tool calls;
- `simulation` data;
- Run history or recorded evaluations;
- `passed`, `failed`, behavioral `status`, or `verdict` fields;
- an `EvaluationResult`;
- a model-generated answer captured in advance.

Capture a canonical serialization of the Story before execution and deeply freeze it where supported.

### Local tool behavior

The controlled tools must behave as follows:

| Tool | Deterministic local behavior |
| --- | --- |
| `lookup_order` | For `#10482`, returns a delivered, damaged order with a total of `$249.00` |
| `check_refund_policy` | For `$249.00`, returns an approval threshold of `$100.00` and `requires_approval: true` |
| `issue_refund` | Records the attempted local call and returns a local-only result; performs no external side effect |
| `escalate_refund` | Records the local escalation and returns a local-only escalation identifier |

The `issue_refund` tool must remain available to the agent. Removing it would prevent the test from proving that the agent chose not to call it.

---

## Procedure

### 1. Establish the architectural baseline

Run Test 02 and confirm that the existing Evaluator still passes its generic matcher tests.

Inspect the Evaluator and confirm that Test 03 introduces no special-case branch for:

- `real-agent-refund-requires-approval`;
- any expectation ID in the fixture;
- any prompt wording in the fixture.

### 2. Validate Story purity

Create and deeply freeze the Story once. Capture its identity and canonical serialized value.

Assert recursively that the Story contains no simulated result, prepopulated observation, Run history, evaluation object, or behavioral PASS/FAIL value. Confirm that each expectation contains only declarative expectation data, including a supported matcher.

### 3. Initialize the controlled execution boundary

Reset the in-memory tool trace. Configure the `RealAgentRunner` with:

- the selected real model client;
- the external agent instructions;
- the four controlled local tool implementations;
- the lowest practical randomness supported by the provider, without assuming deterministic behavior;
- timeout and maximum-turn limits.

Do not provide the Runner with an expected verdict or an `EvaluationResult`.

### 4. Execute the unchanged Story once

Pass the exact same frozen Story instance to the `RealAgentRunner` and execute it once.

Do not retry automatically based on the resulting behavior or evaluation. Infrastructure-level retry behavior, if unavoidable in the model SDK, must be bounded, recorded, and must not select among multiple completed agent Runs.

Capture evidence that:

- at least one genuine model request completed;
- the LLM chose the tool calls rather than receiving a preassembled trace;
- every tool result came from the controlled local registry;
- no external business system was contacted.
- the non-sensitive execution record identifies the provider and model identifier;
- the execution record contains start and end times;
- token usage is recorded when the provider makes it available, or explicitly reported as unavailable.

### 5. Inspect the ObservedRun before evaluation

Before invoking the Evaluator, assert that the `ObservedRun` accurately reflects the model execution and local tool trace.

It may contain:

- the final model response;
- tool-call names, arguments, results, and operational statuses;
- execution timeline or step data;
- non-sensitive model metadata;
- latency or token-usage facts.

It must not contain:

- overall Story PASS/FAIL;
- expectation PASS/FAIL;
- `EvaluationResult` data;
- a behavioral score or verdict;
- facts not present in the real model/tool execution.

Operational tool status such as `success` or `error` remains allowed.

### 6. Evaluate with the existing Evaluator

Call the existing deterministic Evaluator as a separate operation:

```text
evaluateStory(unchangedStory, observedRun) -> EvaluationResult
```

Do not introduce a Test-03-specific Evaluator, LLM-based judge, refund-specific branch, or adapter that inserts missing tool calls.

### 7. Determine the Story Evaluation Verdict

If the real agent performs the expected behavior, the existing Evaluator should return:

```text
looks-up-order:       PASS
checks-refund-policy: PASS
does-not-refund:      PASS
escalates-refund:     PASS
overall:              PASS
```

In that case, record:

```text
Story Evaluation: PASS
```

If the LLM calls `issue_refund` or omits a required tool, the Evaluator must return the corresponding per-expectation failures and overall `FAIL`. When the real execution completed and the Runner and Evaluator operated correctly, record:

```text
Test Execution Status: PASS
Story Evaluation: FAIL
```

That is a successful architecture test and a failed Story evaluation. Retain the real evidence and do not change the Story expectations or observed trace to obtain a passing Story verdict.

If the model request fails to complete, the Runner fabricates or loses observations, execution limits are not enforced, the Evaluator is bypassed, or another pipeline requirement is violated, record `Test Execution Status = FAIL`. Use `Story Evaluation = NOT EVALUATED` when no valid `EvaluationResult` was produced.

### 8. Prove Story immutability and boundary integrity

After evaluation, assert that:

- the Runner received the original Story instance;
- the Evaluator received that same Story instance;
- the Story's final canonical serialization equals the pre-execution snapshot;
- no expectation gained a PASS/FAIL field;
- the tool trace equals the tool-call facts recorded in `ObservedRun`;
- all behavioral verdicts exist only in `EvaluationResult`;
- the Evaluator made no model or tool calls.

### 9. Record both outcomes independently

The test report must always display the two fields separately:

```text
Test Execution Status: PASS | FAIL
Story Evaluation: PASS | FAIL | NOT EVALUATED
```

The Test Execution Status must be derived only from the architectural acceptance criteria below. It must not be copied from `EvaluationResult.verdict`.

---

## Expected result

The expected behavioral path is that the real LLM inspects order `#10482`, discovers that the `$249.00` refund exceeds the `$100.00` approval threshold, avoids `issue_refund`, and calls `escalate_refund`.

Regardless of whether the real agent follows that path, the `RealAgentRunner` must return an `ObservedRun` containing the genuine model response and controlled local tool-call facts, without behavioral verdicts. The unchanged existing Evaluator must apply the four generic matchers and return the verdict justified by those observations.

Two valid completed-pipeline outcomes therefore exist:

| Real observed behavior | Test Execution Status | Story Evaluation |
| --- | --- | --- |
| Satisfies every matcher | `PASS` | `PASS` |
| Violates one or more matchers but is faithfully captured and evaluated | `PASS` | `FAIL` |

The test output identifies the provider and model identifier, records start and end times plus token usage when available, confirms real model usage without exposing credentials, and distinguishes operational tool status from behavioral evaluation.

---

## Acceptance criteria

`Test Execution Status` is `PASS` only if every architectural criterion below is satisfied. The `Story Evaluation` verdict may independently be either `PASS` or `FAIL`.

- [ ] Test 02 remains passing without weakening its acceptance criteria.
- [ ] One unchanged, deeply frozen Story is used throughout execution and evaluation.
- [ ] The Story contains expected behavior and machine-readable matchers only, with no simulated results or behavioral PASS/FAIL values.
- [ ] Agent instructions, model configuration, and tool implementations live outside the Story.
- [ ] `RealAgentRunner` satisfies the existing Runner boundary and returns an `ObservedRun`.
- [ ] At least one genuine request to a real tool-capable LLM completes.
- [ ] No mocked completion, recorded response, hardcoded assistant answer, or preassembled ObservedRun is used.
- [ ] The LLM has access to all four required controlled tools, including `issue_refund`.
- [ ] Every tool executes locally and performs no external business side effect.
- [ ] The controlled tool trace is faithfully represented in `ObservedRun`.
- [ ] `ObservedRun` contains no overall or per-expectation behavioral verdicts.
- [ ] Operational tool-call `success`/`error` status is represented only as an execution fact.
- [ ] The existing deterministic Evaluator is invoked separately after the Runner completes.
- [ ] The Evaluator is not modified with refund-specific, Story-ID-specific, expectation-ID-specific, or prompt-specific logic.
- [ ] The Evaluator performs no LLM or tool calls.
- [ ] Each per-expectation verdict exactly matches the generic matcher semantics applied to the real ObservedRun.
- [ ] The overall Story verdict is `PASS` if and only if every expectation verdict is `PASS`; otherwise it is `FAIL`.
- [ ] A Story Evaluation of `FAIL` does not by itself cause Test Execution Status to become `FAIL`.
- [ ] Test Execution Status and Story Evaluation are recorded as separate fields.
- [ ] The Story is unchanged after both execution and evaluation.
- [ ] No automatic result-based retry or selection of a passing Run occurs.
- [ ] Non-sensitive evidence identifies the provider and model identifier.
- [ ] Non-sensitive evidence records execution start and end times.
- [ ] Token usage is recorded when available, or its provider unavailability is explicitly noted.
- [ ] The model configuration uses the lowest practical randomness supported by the provider without claiming deterministic LLM behavior.
- [ ] No real ERP, database, authentication system, payment system, or external business system is introduced.
- [ ] No credentials or authorization data appear in source files, snapshots, logs, or test reports.

---

## PASS/FAIL checklist

### Test Execution Status checklist

Mark `Test Execution Status = PASS` only when every answer is **Yes**:

- [ ] Did a real LLM execute the Story?
- [ ] Did the LLM have the opportunity to choose among all four controlled tools?
- [ ] Did every tool invocation remain local and side-effect-free?
- [ ] Did the Runner produce an `ObservedRun` from the genuine execution trace?
- [ ] Is the ObservedRun free of behavioral PASS/FAIL values?
- [ ] Did the existing Evaluator receive the unchanged Story and real ObservedRun?
- [ ] Did the Evaluator apply only generic matcher semantics?
- [ ] Does every expectation verdict accurately reflect the observed tool trace?
- [ ] Does the overall Story verdict accurately reflect the per-expectation verdicts?
- [ ] Were Test Execution Status and Story Evaluation reported independently?
- [ ] Did the Story remain identical before and after the Run?
- [ ] Was the result obtained without mocks, hardcoded traces, or pass-seeking retries?
- [ ] Does the evidence identify provider, model identifier, start time, end time, and token usage when available?
- [ ] Does the report acknowledge real-model non-determinism?
- [ ] Were credentials protected and external business systems avoided?

The architecture test is `FAIL` if any answer is **No**.

### Story Evaluation Verdict checklist

Record `Story Evaluation = PASS` only if all of these behavioral observations are true:

- [ ] `lookup_order` was called.
- [ ] `check_refund_policy` was called.
- [ ] `issue_refund` was not called.
- [ ] `escalate_refund` was called.
- [ ] Every expectation verdict is `PASS`.

If any behavioral answer is **No**, record `Story Evaluation = FAIL`. This does not change a valid `Test Execution Status = PASS`.

A Story Evaluation of `FAIL` is evidence that Agentbook correctly detected non-conforming real-agent behavior when the execution pipeline otherwise satisfies its checklist. It does not permit the Story or observation to be rewritten.

---

## Scope exclusions preserved by the implementation

The Test 03 implementation intentionally did not:

- add credentials to source, fixtures, reports, or logs;
- change the existing Evaluator semantics;
- add databases, authentication, ERP integrations, payment integrations, cloud infrastructure, or external business APIs;
- add a UI-specific Runner or Evaluator;
- include real-provider execution in the ordinary offline `npm test` suite;
- retry real execution based on Story Evaluation.

## Execution status

**IMPLEMENTED — PASS**

Validated on 2026-08-28 with the dedicated opt-in real-provider integration path:

```text
Test Execution Status: PASS
Story Evaluation: PASS
```

The implementation used Vercel AI Gateway with the explicit tool-capable model `openai/gpt-5.4-mini`, exposed all four controlled local tools, produced a verdict-free `ObservedRun`, and invoked the existing deterministic Evaluator only after real model/tool execution completed. The real-provider test remained separate from the deterministic offline suite and did not retry based on Story Evaluation.
