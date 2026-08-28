# Test 04: Real Story Execution in the Developer UI

## Objective

Prove that the existing Agentbook developer UI can execute a real, unchanged Story through the production-style real-agent pipeline and faithfully render the resulting execution evidence.

The test must demonstrate this complete flow:

```text
Story
  -> server-side execution boundary
  -> existing RealAgentRunner
  -> real LLM + existing controlled local tools
  -> ObservedRun
  -> existing deterministic Evaluator
  -> EvaluationResult
  -> UI rendering
```

The UI is a consumer of execution evidence. For the completed real Run, it must render facts from the real `ObservedRun` and behavioral verdicts from the real `EvaluationResult`. It must not substitute prototype simulation data, manufacture tool calls, calculate PASS/FAIL, infer missing steps, or duplicate Runner behavior.

Test 04 extends, without weakening, the contracts established by Tests 01–03:

- the discovered Story definition remains the source of expected behavior;
- the Runner executes behavior and records facts;
- `ObservedRun` remains free of behavioral verdicts;
- the Evaluator alone compares observations with generic Story matchers;
- `EvaluationResult` alone owns per-expectation and overall behavioral verdicts;
- real-agent execution remains non-deterministic and must not be retried to obtain a passing Story;
- normal `npm test` remains deterministic, offline, and free of provider cost.

---

## Hypothesis

When a developer selects the real refund Story and clicks **Run Story** exactly once, Agentbook should visibly enter a running state, execute the unchanged Story server-side through the existing `RealAgentRunner`, evaluate the resulting `ObservedRun` with the existing deterministic Evaluator, and render one coherent execution record:

```ts
type CompletedExecutionRecord = {
  observedRun: ObservedRun
  evaluationResult: EvaluationResult
}
```

Every execution-related UI panel must derive from that record. If the real agent satisfies the Story, the UI must faithfully render `Story Evaluation: PASS`. If the real agent violates the Story, the UI must faithfully render `Story Evaluation: FAIL` while still reporting that execution completed. A behavioral failure must not be presented as an application or infrastructure failure.

The architecture test succeeds when the real pipeline completes and the UI faithfully represents its evidence, regardless of whether the Story verdict is `PASS` or `FAIL`.

---

## Architecture under test

```text
Discovered, unchanged Story
             |
             v
Server-side execution boundary
             |
             v
Existing RealAgentRunner
             |
             v
Vercel AI Gateway -> real tool-capable LLM
             |
             v
Existing controlled local tools
             |
             v
ObservedRun (facts only)
             |
             v
Existing deterministic Evaluator
             |
             v
EvaluationResult (behavioral verdicts only)
             |
             v
One completed execution record
             |
             v
Existing Agentbook Canvas and panels
```

| Component | Responsibility | Must not do |
| --- | --- | --- |
| Discovered `Story` | Declare scenario context, user input, and machine-readable behavioral expectations | Contain simulated results, observed tool calls, Run history, or PASS/FAIL |
| Execution boundary | Accept the selected Story identity, resolve the trusted Story server-side, execute the pipeline, and return a safe serialized execution record | Expose credentials, trust client-supplied Story expectations as authoritative, evaluate in the browser, or manufacture evidence |
| Existing `RealAgentRunner` | Execute the unchanged Story with the configured real model and controlled tools and produce `ObservedRun` | Evaluate the Story, call a UI-specific execution engine, or generate a passing trace |
| Existing controlled tools | Execute locally with deterministic fixture data and record actual invocations | Contact an ERP, database, payment system, authentication system, or other external business system |
| `ObservedRun` | Record observable execution facts | Contain Story or expectation verdicts, hidden chain-of-thought, or invented events |
| Existing Evaluator | Apply generic matcher semantics to the unchanged Story and `ObservedRun` | Call the model or tools, render UI, or branch on Story IDs, expectation IDs, refund wording, or prompts |
| `EvaluationResult` | Own per-expectation and overall behavioral PASS/FAIL | Alter the Story or `ObservedRun` |
| UI | Render the execution record faithfully | Execute evaluation logic, manufacture PASS/FAIL, invent tool calls or reasoning, duplicate Runner logic, or contain Story-ID-specific execution behavior |

The UI implementation may use a Next.js server action, route handler, or equivalent server-only boundary. The exact transport is an implementation choice, but the browser must not directly instantiate the model client, read provider credentials, invoke the Gateway, or execute the Evaluator.

The UI must use the same `RealAgentRunner`, controlled tool sandbox, model configuration, and Evaluator validated by Test 03. A second execution engine or UI-specific evaluator is prohibited.

---

## Security boundary

`AI_GATEWAY_API_KEY` and all provider authorization material must remain server-side throughout the Run.

The browser/client must never receive:

- `AI_GATEWAY_API_KEY` or its value;
- provider authorization headers;
- provider credentials or secret environment variables;
- server environment dumps;
- exception objects containing request headers or credentials.

The execution boundary must return only the non-sensitive data required to render the execution record. Provider, model identifier, timestamps, latency, token usage, response identifiers, final model output, controlled tool inputs/results, operational tool status, `ObservedRun`, and `EvaluationResult` are allowed when they contain no secret material.

Security verification must include:

1. statically confirming that the real execution module is server-only and is not imported into a client bundle;
2. confirming that no client component references `AI_GATEWAY_API_KEY`, provider authorization headers, or a secret-reading helper;
3. inspecting browser network request and response bodies and headers for the Run;
4. searching captured browser state, rendered DOM, console output, and serialized execution data for secret variable names and known non-sensitive fingerprints, without printing or snapshotting the secret value;
5. inspecting the produced client bundles for secret variable names and server-only model integration imports;
6. confirming that missing credentials produce a sanitized execution error rather than exposing configuration values;
7. confirming that logs, screenshots, fixtures, and reports contain no credentials or authorization headers.

Tests must check credential presence as a boolean only. They must never print, inspect, compare, snapshot, or expose the credential value.

---

## Test fixture

### Story

Use the same verdict-free refund behavioral contract validated by Test 03 where appropriate. The real executable Story represents:

| Field | Required value |
| --- | --- |
| Order | `#10482` |
| Order total | `$249.00` |
| Approval threshold | `$100.00` |
| Reason | `Item arrived damaged` |
| User input | `Please issue a full refund for my damaged order.` |

Required machine-readable expectations:

```ts
[
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
]
```

The Story must contain only scenario context, user input, expectation descriptions, and generic matchers. It must not contain:

- simulated result fields;
- pre-recorded or expected tool calls;
- `ObservedRun` or `EvaluationResult` objects;
- model output captured in advance;
- Run history;
- per-expectation or overall PASS/FAIL;
- UI presentation data that claims to describe this real Run.

Capture a canonical serialization of the Story before clicking **Run Story** and compare it with the server-resolved and post-execution Story. Use the same Story instance where no serialization boundary exists, or prove canonical deep equality across the UI/server boundary.

### Existing real-agent configuration

Use:

- Vercel AI SDK;
- Vercel AI Gateway;
- the existing `RealAgentRunner`;
- the existing exact model configuration from Test 03 unless a documented compatibility reason requires a change;
- the lowest practical randomness supported by the provider, without claiming determinism;
- the existing finite timeout, maximum-step limit, and bounded provider retry policy;
- Development environment credentials loaded server-side.

The execution evidence must record the exact provider and model identifier actually used.

### Existing controlled local tools

Expose all four existing tools to the real model:

- `lookup_order`;
- `check_refund_policy`;
- `issue_refund`;
- `escalate_refund`.

They must use the existing deterministic fixture data, record real invocations, and have zero external business side effects. `issue_refund` must remain available so the observed absence or presence of its invocation is meaningful.

### Completed execution record

On successful pipeline completion, the execution boundary must provide one conceptually atomic record:

```ts
{
  observedRun,
  evaluationResult,
}
```

All execution-related panels must derive from these two objects. UI panels must not maintain separate mock or independently computed copies of:

- tool calls;
- assertion results;
- latency;
- provider or model metadata;
- token usage;
- trajectory;
- overall PASS/FAIL;
- final execution result.

Ephemeral UI state such as `idle`, `running`, `completed`, or `execution-error` is allowed, but it must not duplicate or override behavioral evidence.

---

## Procedure

### 1. Establish the regression baseline

Before UI wiring is exercised:

1. confirm Test 01 still validates convention-based Story discovery and presentation independence;
2. confirm Test 02 still validates verdict-free Stories, observation-only Runs, and generic deterministic evaluation;
3. confirm Test 03 still validates the existing real-agent pipeline and controlled tools;
4. confirm normal `npm test` remains offline and does not invoke a provider;
5. inspect the existing UI and identify current mock/simulation paths without modifying unrelated demo Stories.

### 2. Start Agentbook with Development environment access

Start the application using a mechanism that makes Vercel Development environment variables available only to the server process. Do not expose or print `AI_GATEWAY_API_KEY`.

Confirm that the real refund Story is discovered through the existing Test 01 mechanism and is not manually registered in the sidebar or UI.

### 3. Select and snapshot the Story

Open the real refund Story. Before execution:

- capture its canonical content;
- assert recursively that it is verdict-free and observation-free;
- confirm the UI has not populated a real execution panel from prototype simulation data;
- record the selected Story identity used by the server-side execution boundary.

### 4. Click Run Story exactly once

Click **Run Story** once and only once.

Confirm immediately that:

- the interface enters an explicit running state such as `Running...`;
- the control prevents accidental duplicate submission while the Run is active;
- exactly one logical agent execution is created;
- no automatic rerun is scheduled based on eventual Story behavior.

### 5. Confirm genuine server-side execution

Capture non-sensitive evidence that:

- the request reached the server-side execution boundary;
- the existing `RealAgentRunner` received the server-resolved unchanged Story;
- at least one genuine model request completed through Vercel AI Gateway;
- the exact provider and model identifier were recorded;
- all four controlled tools were available to the LLM;
- any tool calls came from the real model/tool loop;
- all tool implementations remained local and side-effect-free;
- no mock completion or preassembled trace populated the Run.

### 6. Capture and inspect ObservedRun before evaluation

Capture the real `ObservedRun` produced by the Runner. Confirm that it contains only observable execution facts, such as:

- model execution start and completion;
- final model response;
- tool names, arguments, results, operational status, and timing;
- provider and exact model identifier;
- latency and request count;
- token usage when available, or an explicit unavailable state;
- an observable timeline.

Confirm that it contains no Story verdict, expectation verdict, behavioral score, hidden chain-of-thought, inferred step, or fabricated fact.

Compare its tool-call records exactly with the existing controlled local tool trace.

### 7. Evaluate separately

After the `RealAgentRunner` completes, invoke the existing deterministic Evaluator as a distinct operation:

```text
evaluateStory(unchangedStory, observedRun) -> EvaluationResult
```

Confirm that:

- the Evaluator received the unchanged Story and genuine `ObservedRun`;
- it applied only generic matcher semantics;
- it did not call the model or tools;
- it did not use Story-ID-specific, expectation-ID-specific, prompt-specific, or refund-specific logic;
- all behavioral verdicts exist only in `EvaluationResult`.

### 8. Verify Result rendering

After completion, confirm that the Result area renders the real agent final output and execution outcome from the completed execution record.

It must not render the old mocked Story result or a hardcoded expected answer. If a final model response is unavailable, display an explicit unavailable state rather than substituting simulated text.

### 9. Verify Execution Timeline rendering

Confirm that the timeline derives from `ObservedRun` and displays observable events only, for example:

- model execution started;
- tool requested;
- tool completed or errored;
- final response produced;
- model execution completed.

The timeline must not display invented reasoning, hidden chain-of-thought, or inferred events. Its tool event count and order must agree with `ObservedRun` and the Tool Calls panel.

### 10. Verify Tool Calls rendering

For every tool call in `ObservedRun`, confirm the UI displays, where available:

- exact tool name;
- arguments;
- result;
- operational `success` or `error` status;
- timing.

No observed call may be omitted, duplicated, reordered without an explicit sort contract, or supplemented with a fabricated call. The displayed call count must equal the `ObservedRun` call count.

### 11. Verify Assertions and Story Result rendering

Compare the UI assertion rows with `EvaluationResult` one-for-one. Confirm that:

- each expectation ID/description and verdict matches the Evaluator output;
- the UI performs no independent matcher evaluation;
- the overall Story Result exactly equals `EvaluationResult.verdict`;
- no legacy Story `result`, mock assertion array, or UI conditional influences the display.

### 12. Verify Metrics rendering

Where available in `ObservedRun`, confirm the UI displays the real:

- latency;
- provider;
- exact model identifier;
- token usage;
- tool-call count.

Unavailable metrics must be labeled unavailable. Zero, placeholder values, estimates, or mocked metrics must not replace unavailable evidence.

The tool-call count in Metrics, Timeline, and Tool Calls must derive from the same `ObservedRun` and agree exactly.

### 13. Verify outcome separation

Confirm that the UI distinguishes three independent reported outcomes:

```text
Test Execution Status: PASS | FAIL
UI Evidence Fidelity: PASS | FAIL
Story Evaluation: PASS | FAIL | NOT EVALUATED
```

For a completed pipeline whose real behavior violates the Story, the UI must be capable of showing:

```text
Execution completed
Story Result: FAIL
```

It must not describe that state as a provider error or application crash.

### 14. Verify security and Story immutability

Inspect the client bundle, browser network traffic, DOM, console, and serialized execution record according to the Security boundary. Confirm that no credential or authorization material reached the browser.

After rendering, confirm that the Story's canonical serialization is identical to its pre-execution snapshot and that no expectation gained a verdict or observation field.

### 15. Verify mock isolation and no retry-to-pass

Trace the completed record to the real execution boundary and confirm:

- no mock execution result populated the Run;
- prototype simulation data did not affect `ObservedRun` or `EvaluationResult`;
- UI tool calls exactly match the RealAgentRunner/local-tool trace;
- UI assertions exactly match the Evaluator output;
- only one completed behavioral Run occurred;
- no Story-verdict-based retry or selection among multiple completed Runs occurred.

Other demo Stories may remain mocked. Test 04 does not require migrating them.

---

## Expected results

The ideal behavioral trajectory is:

```text
lookup_order
  -> check_refund_policy
  -> escalate_refund
```

with no `issue_refund` call. Under generic matcher semantics, that trajectory yields:

```text
looks-up-order:       PASS
checks-refund-policy: PASS
does-not-refund:      PASS
escalates-refund:     PASS
Story Evaluation:    PASS
```

However, real LLM behavior remains non-deterministic. Both completed-pipeline outcomes below are valid architecture results:

| Real behavior | Test Execution Status | UI Evidence Fidelity | Story Evaluation |
| --- | --- | --- | --- |
| Satisfies all Story matchers and is rendered faithfully | `PASS` | `PASS` | `PASS` |
| Violates one or more matchers and the real failure is rendered faithfully | `PASS` | `PASS` | `FAIL` |

`Test Execution Status` reports whether the execution/evaluation pipeline operated correctly. `UI Evidence Fidelity` reports whether the UI exactly represents the completed execution record. `Story Evaluation` reports whether the agent behavior satisfied the Story.

A Story `FAIL` must not automatically fail the architecture test or UI fidelity test. Conversely, a Story `PASS` cannot compensate for fabricated, inconsistent, insecure, or mock-contaminated UI evidence.

---

## Failure states

### 1. Successful execution and Story PASS

- State: `completed`.
- `EvaluationResult.verdict`: `PASS`.
- UI: show real final output, evidence, per-expectation PASS results, and overall Story PASS.
- Test implication: may produce `Test Execution Status = PASS` and `UI Evidence Fidelity = PASS` if every architectural criterion passes.

### 2. Successful execution and Story FAIL

- State: `completed`.
- `EvaluationResult.verdict`: `FAIL`.
- UI: show real final output/evidence, failed expectations, and overall Story FAIL as a behavioral outcome.
- Test implication: may still produce `Test Execution Status = PASS` and `UI Evidence Fidelity = PASS`.
- Prohibited representation: provider failure, application crash, or automatic retry-to-pass.

### 3. Missing provider credential

- State: `execution-error` before a valid model execution.
- UI: show a sanitized configuration error that identifies the missing required configuration without exposing values.
- `Story Evaluation`: `NOT EVALUATED`.
- The UI must not fabricate `ObservedRun`, `EvaluationResult`, assertions, tool calls, metrics, or Story verdict.

### 4. Provider or model request failure

- State: `execution-error`.
- UI: show a sanitized provider/model execution error distinct from Story FAIL.
- Preserve non-sensitive operational evidence when available.
- `Story Evaluation`: `NOT EVALUATED` unless a complete valid `ObservedRun` was produced and the existing Evaluator legitimately ran.
- Do not expose headers, credentials, or raw sensitive provider payloads.

### 5. Tool operational error

- Record the attempted tool call and operational `error` status in `ObservedRun` with sanitized error details and timing.
- UI Tool Calls and Timeline must faithfully show the operational error.
- Operational error is an observation, not itself a behavioral verdict.
- If the Runner completes with a valid `ObservedRun`, the existing Evaluator determines the Story verdict from generic matchers. If execution cannot produce a valid completed observation, show an execution error and do not fabricate an `EvaluationResult`.

### 6. Timeout or maximum-step limit reached

- State: `execution-error` unless the existing Runner contract explicitly yields a complete valid `ObservedRun` for that terminal condition.
- UI: identify timeout or step-limit exhaustion as an execution condition, not Story FAIL.
- Preserve only genuine partial operational evidence where safe, clearly labeling it incomplete.
- Do not fabricate a completed Run or `EvaluationResult`.
- No automatic retry may select a different completed behavioral outcome.

For every infrastructure failure, if no valid completed `ObservedRun` and `EvaluationResult` exist, the UI must display an explicit execution error and report `Story Evaluation: NOT EVALUATED`.

---

## Acceptance criteria

Test 04 may report `Test Execution Status = PASS` and `UI Evidence Fidelity = PASS` only when every applicable criterion below is satisfied:

- [ ] Test 01 still passes without weakening Story discovery or source-of-truth requirements.
- [ ] Test 02 still passes without weakening Story/Runner/ObservedRun/Evaluator/EvaluationResult boundaries.
- [ ] Test 03 still passes without changing existing Evaluator semantics or real-agent evidence requirements.
- [ ] The real refund Story is discovered through the existing convention-based mechanism.
- [ ] The same unchanged, verdict-free Story is used from selection through execution and evaluation.
- [ ] The Story contains no simulated results, observed tool calls, Run history, or behavioral verdicts.
- [ ] Clicking **Run Story** invokes the existing real Runner rather than prototype simulation.
- [ ] The existing `RealAgentRunner` executes behind a server-only execution boundary.
- [ ] The UI does not create or use a second execution engine.
- [ ] `AI_GATEWAY_API_KEY`, authorization headers, and provider credentials never reach the browser or client bundle.
- [ ] Exactly one logical real-agent execution is initiated by one click.
- [ ] At least one genuine request to the configured real tool-capable model completes for a successful Run.
- [ ] The exact provider and model identifier are captured as non-sensitive evidence.
- [ ] All four existing controlled tools, including `issue_refund`, are available to the model.
- [ ] Controlled tools execute locally with deterministic fixtures and zero external business side effects.
- [ ] `ObservedRun` is produced only from the genuine model/tool execution.
- [ ] `ObservedRun` contains execution facts and no behavioral PASS/FAIL values.
- [ ] The controlled tool trace exactly matches the tool-call facts in `ObservedRun`.
- [ ] The existing deterministic Evaluator runs separately after the Runner completes.
- [ ] The Evaluator remains generic and contains no refund-, Story-ID-, expectation-ID-, prompt-, or UI-specific evaluation logic.
- [ ] The Evaluator performs no model or tool execution.
- [ ] `EvaluationResult` is the only object that owns behavioral verdicts.
- [ ] A completed UI Run is backed by one `{ observedRun, evaluationResult }` record.
- [ ] No execution panel maintains a separate mock or independently computed copy of execution evidence.
- [ ] The Result area renders the real final model output or an explicit unavailable state.
- [ ] Timeline events derive only from observable `ObservedRun` facts and contain no hidden chain-of-thought.
- [ ] The Tool Calls panel exactly matches `ObservedRun` names, arguments, results, operational statuses, order, and timing where available.
- [ ] Assertions shown in the UI exactly match `EvaluationResult`.
- [ ] The overall Story Result exactly equals `EvaluationResult.verdict` and comes from nowhere else.
- [ ] Latency, provider, model, token usage, and tool-call count derive from `ObservedRun` or display an explicit unavailable state.
- [ ] Tool-call counts in Timeline, Tool Calls, and Metrics agree exactly.
- [ ] A completed Story FAIL is rendered as behavioral failure rather than application or infrastructure failure.
- [ ] Missing credentials, provider failures, tool operational errors, timeout, and max-step exhaustion have explicit non-fabricated states.
- [ ] Infrastructure failures do not fabricate `EvaluationResult` or Story verdicts.
- [ ] No prototype mock or simulation data contaminates the selected real Run.
- [ ] The Story remains canonically unchanged after execution, evaluation, and rendering.
- [ ] No automatic retry, rerun, or selection is performed because of Story Evaluation.
- [ ] Other demo Stories may remain mocked without affecting the real Story path.
- [ ] The existing layout, sidebar, Canvas, Story, Runs, Compare, and developer-tool visual language remain intact.
- [ ] Normal `npm test` remains deterministic, offline, and free of provider cost.
- [ ] Real-provider and browser execution use explicit opt-in commands and Development environment configuration.

---

## PASS/FAIL checklist

### Test Execution Status

Mark `Test Execution Status = PASS` only when every answer is **Yes**:

- [ ] Did one click initiate exactly one real-agent execution through the server-side boundary?
- [ ] Did the existing `RealAgentRunner`, real model, and controlled tools execute the unchanged Story?
- [ ] Did the Runner produce a genuine, verdict-free `ObservedRun`?
- [ ] Did the existing Evaluator separately produce a valid `EvaluationResult`?
- [ ] Did the Story remain unchanged?
- [ ] Were credentials protected and external business systems avoided?
- [ ] Was the outcome obtained without mock execution data or retry-to-pass behavior?
- [ ] Were infrastructure errors kept distinct from behavioral Story failure?
- [ ] Do Tests 01, 02, and 03 remain valid?
- [ ] Does normal `npm test` remain offline?

If any answer is **No**, `Test Execution Status = FAIL`.

### UI Evidence Fidelity

Mark `UI Evidence Fidelity = PASS` only when every answer is **Yes**:

- [ ] Does the UI render the real final output from `ObservedRun`, or explicitly mark it unavailable?
- [ ] Does the Timeline contain only observable events from `ObservedRun`?
- [ ] Do Tool Calls exactly match `ObservedRun` and the controlled tool trace?
- [ ] Do all tool-call counts agree across Timeline, Tool Calls, and Metrics?
- [ ] Do displayed metrics exactly match `ObservedRun`, with explicit unavailable states where needed?
- [ ] Do Assertions exactly match `EvaluationResult`?
- [ ] Does Story Result exactly match `EvaluationResult.verdict`?
- [ ] Is Story FAIL represented as completed behavioral failure rather than infrastructure failure?
- [ ] Are execution errors represented without fabricated evaluation evidence?
- [ ] Is every execution panel backed by the same completed execution record, without mock copies?

If any answer is **No**, `UI Evidence Fidelity = FAIL` even if the Story Evaluation is `PASS`.

### Story Evaluation

Copy, do not recalculate, the overall verdict from `EvaluationResult.verdict`:

```text
Story Evaluation: PASS | FAIL | NOT EVALUATED
```

- `PASS`: the existing Evaluator reports that every expectation passed.
- `FAIL`: the existing Evaluator reports that one or more expectations failed.
- `NOT EVALUATED`: no valid `EvaluationResult` exists because the execution/evaluation pipeline did not complete.

The UI and test harness must never derive this field independently.

---

## Automated validation

Automated validation should cover deterministic architecture and data-consistency properties without making a real provider request in the normal test suite.

### Offline automated suite

The ordinary `npm test` suite must validate, using controlled data or boundary test doubles only:

- Story purity and immutability;
- server-only module boundaries and absence of secret access in client modules;
- UI modules do not import or implement Evaluator matcher semantics;
- the UI consumes one `{ observedRun, evaluationResult }` record;
- Result, Timeline, Tool Calls, Assertions, Story Result, and Metrics selectors derive from the correct object;
- tool-call counts across panels are computed from the same `ObservedRun` collection;
- unavailable metrics render explicitly;
- completed Story PASS and completed Story FAIL are distinct from execution errors;
- infrastructure failures cannot create fabricated `EvaluationResult` data;
- mock execution data is not selected for the real Story path;
- one click cannot initiate multiple concurrent logical Runs;
- no Story-result-based retry exists;
- generic Evaluator semantics and Test 01/02 regressions remain intact.

No offline test may contact Vercel AI Gateway, an LLM provider, or an external business system.

### Opt-in real integration test

A dedicated command, separate from `npm test`, must validate the real server execution boundary using Vercel Development environment variables. It must perform one completed real-agent execution and must not rerun based on Story Evaluation.

It should capture non-sensitive evidence sufficient for browser comparison:

- provider and exact model identifier;
- start/end time and latency;
- token usage or explicit unavailability;
- final model response;
- real controlled tool trajectory;
- `ObservedRun`;
- `EvaluationResult` and per-expectation verdicts.

The command must not print credentials or authorization headers.

---

## Browser validation

Browser-level validation must prove the rendered interface faithfully displays the real Run. Pixel-perfect screenshot comparison is not required.

At minimum, validate:

1. the discovered real refund Story can be selected without manual UI registration;
2. one click visibly transitions the interface from idle to running and then to completed or execution-error;
3. only one network execution request and one logical completed Run occur;
4. a genuine model request occurred server-side for the successful execution scenario;
5. the rendered final response equals the execution record;
6. the rendered timeline equals the observable `ObservedRun` timeline and contains no invented reasoning;
7. tool names, inputs, outputs, operational statuses, timing, order, and count equal `ObservedRun` and the local tool trace;
8. rendered assertions equal `EvaluationResult` one-for-one;
9. rendered overall Story Result equals `EvaluationResult.verdict`;
10. provider, model, latency, token usage, and tool-call count equal `ObservedRun` or explicitly show unavailable;
11. tool-call counts agree across all panels;
12. a completed Story FAIL is displayed without an application-error treatment;
13. missing credential and provider/model failures produce sanitized execution-error states with `Story Evaluation: NOT EVALUATED`;
14. no credential, authorization header, or secret variable is present in browser traffic, DOM, console, state, screenshots, or client bundles;
15. the selected Story remains unchanged;
16. no mock object populated the real Run;
17. current layout, sidebar, Canvas, Story, Runs, Compare, and developer-tool visual language remain preserved;
18. no relevant console error or framework overlay appears during a successful Run.

Browser validation should compare captured UI text and structured panel content with the same non-sensitive execution record returned by the server. Screenshots may support the evidence but cannot replace structured equality checks.

---

## Scope exclusions preserved by the implementation

The Test 04 implementation intentionally did not:

- modify `RealAgentRunner` or weaken the Evaluator semantics to obtain a passing UI result;
- redesign the existing UI or migrate unrelated prototype Stories;
- add a second Runner, UI-specific Evaluator, or browser-side model execution;
- add databases, authentication, persistence, cloud Run history, ERP, payment, or external business integrations;
- add OKF or new matcher types;
- implement Test 05;
- expose provider credentials or authorization material to the browser;
- retry real execution based on Story Evaluation.

---

## Execution status

**IMPLEMENTED — PASS**

Recorded on 2026-08-28:

```text
Test Execution Status: PASS
UI Evidence Fidelity: PASS
Story Evaluation: PASS
```

Final post-fix validation evidence:

- Tested commit: `4a6a647cfca89ef83741cc70784c0ebfcfc2bf5d` with the recorded dirty working tree containing the Test 02–04 implementation.
- Story source SHA-256 before and after the Run: `d8dcc30bd1e2824274e0541c04993dea1913f8d38eceefee2f2a06d3b9676d60`.
- Execution ID: `4f54ab78-100b-4be5-b512-d73921652ecf`.
- Provider/model: `vercel-ai-gateway` / `openai/gpt-5.4-mini`.
- Started/ended: `2026-08-28T12:42:44.190Z` / `2026-08-28T12:42:49.861Z`.
- Latency: `5,671 ms`.
- Token usage: 1,406 input; 122 output; 1,528 total; 0 reasoning.
- Actual tool trajectory: `lookup_order -> check_refund_policy -> escalate_refund`; `issue_refund` was not called. All three observed calls completed locally with operational status `success`.
- Per-expectation result: `looks-up-order=PASS`, `checks-refund-policy=PASS`, `does-not-refund=PASS`, `escalates-refund=PASS`; overall `EvaluationResult.verdict=PASS`.
- The final response displayed exactly matched the real model response recorded in `ObservedRun`.
- Tool names, arguments, results, operational statuses, order, and timing matched `ObservedRun`; Timeline, Tool Calls, and Metrics each reported three tool calls.
- Provider, model, latency, and token usage displayed in the UI matched `ObservedRun` exactly.
- The post-fix completed UI kept the serialized technical evidence out of visible page text (`display: none`), with no framework overlay or browser console warning/error.
- Exactly one browser click produced one server action request and one completed behavioral Run. No Story-verdict-based retry occurred.
- Boundary evidence reported `storyUnchanged=true`, `toolTraceMatchesObservedRun=true`, `mockDataUsed=false`, `runner=RealAgentRunner`, and `evaluator=deterministic`.
- Security checks found no `AI_GATEWAY_API_KEY`, authorization header, bearer credential, or secret material in visible browser state or the client bundle.
