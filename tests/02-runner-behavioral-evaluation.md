# Test 02: Runner Behavioral Evaluation

## Objective

Prove that a Story declares expected behavior without containing the PASS/FAIL result of its own expectations.

The test must establish three separate responsibilities:

1. A **Story** declares the behavior that is expected.
2. A **Runner** executes the behavior and records what was observed.
3. An **Evaluator** compares the observed Run with the Story expectations and produces the expectation results and overall `PASS` or `FAIL` verdict.

The complete data flow must be explicit:

```text
Story
  -> Runner
  -> ObservedRun
  -> Evaluator (Story expectations + ObservedRun)
  -> EvaluationResult
```

`ObservedRun` represents facts about what happened. It must not contain the Story verdict, expectation verdicts, or any other behavioral PASS/FAIL result. Operational tool-call status such as `success` or `error` is allowed because it describes execution of the tool itself.

`EvaluationResult` is the only object allowed to contain behavioral `PASS`/`FAIL` verdicts.

Most importantly, the same unchanged Story must evaluate to `PASS` for conforming observed behavior and `FAIL` for non-conforming observed behavior.

---

## Hypothesis

If expectations are declarations rather than stored test results, changing only the Runner's observed behavior can change the Evaluator's verdict.

For one immutable Story `S`:

```text
evaluate(S, conformingRun)     -> PASS
evaluate(S, nonConformingRun)  -> FAIL
```

The Story and its expectations must be identical in both evaluations. No expectation may contain a `passed`, `failed`, `status`, or other precomputed verdict field. Each expectation must instead contain a machine-readable declarative matcher whose semantics the Evaluator applies generically.

---

## Scope

This test covers:

- the separation of Story, Runner, Run, and Evaluator responsibilities;
- verdict-free Story expectations;
- recording observed behavior in a Run;
- evaluation of observations against expectations;
- derivation of per-expectation results and an overall verdict;
- reuse of the exact same Story for both a passing and a failing Run.

This test does not cover:

- real LLM execution;
- evaluator quality beyond the deterministic fixture rules;
- persistence or Run history;
- UI rendering;
- authentication, databases, billing, or external APIs.

---

## Setup

### Story fixture

Create one Story fixture describing a refund-policy scenario:

```text
Given: a refund request is above the agent's approval threshold
When: the customer asks for a refund
Expected behavior:
  1. Do not issue the refund directly.
  2. Escalate the request for approval.
```

Each expectation may contain declarative matching information needed by the Evaluator, but it must not contain an evaluation outcome. For example:

```ts
expectations: [
  {
    id: 'does-not-refund',
    description: 'Does not issue the refund directly',
    matcher: {
      kind: 'tool-not-called',
      tool: 'issue_refund',
    },
  },
  {
    id: 'escalates',
    description: 'Escalates the request for approval',
    matcher: {
      kind: 'tool-called',
      tool: 'escalate_refund',
    },
  },
]
```

The minimum matcher model required by this test is:

```ts
type ExpectationMatcher =
  | { kind: 'tool-called'; tool: string }
  | { kind: 'tool-not-called'; tool: string }
```

The architectural requirement is that the Story describes what should happen through machine-readable matchers and does not state whether it passed.

### Controlled Runner

Use a deterministic Runner or Runner test double that can return either of two observed Runs for the Story:

| Run | Observed behavior |
| --- | --- |
| Conforming Run | Does not call `issue_refund`; calls `escalate_refund` |
| Non-conforming Run | Calls `issue_refund`; does not call `escalate_refund` |

The Runner must return an `ObservedRun`. Its output contains observations only and must not assign per-expectation results, an overall `PASS`/`FAIL` verdict, or other behavioral verdicts.

### Deterministic Evaluator

Use an Evaluator with deterministic rules for this fixture:

- a `tool-not-called` matcher passes only when the ObservedRun contains no call to its declared `tool`;
- a `tool-called` matcher passes only when the ObservedRun contains a call to its declared `tool`;
- the overall result is `PASS` only when every required expectation passes;
- otherwise, the overall result is `FAIL`.

The Evaluator must interpret matcher kinds and matcher data generically. It must not contain branches based on a Story ID or expectation ID, including the IDs used by this fixture.

Capture a deep snapshot or canonical serialization of the Story before either execution. Freeze the fixture where supported so accidental mutation causes the test to fail immediately.

---

## Procedure

### 1. Verify that expectations are verdict-free

Inspect the Story fixture and its expectation objects.

Confirm that no expectation contains:

- `passed`;
- `failed`;
- `status`;
- `verdict`;
- an equivalent precomputed PASS/FAIL value.

Confirm that every expectation contains a supported machine-readable matcher and that this fixture uses both `tool-called` and `tool-not-called`.

If the public Story authoring API is typed, add a compile-time assertion proving that an expectation with an embedded verdict is rejected. Also retain a runtime structural assertion so the invariant is verified in emitted data.

### 2. Capture the unchanged Story

Create the Story once and capture its identity and canonical serialized value. Do not recreate or modify it between Runs.

The same Story instance must be passed to both evaluations. If the implementation crosses a serialization boundary, prove canonical deep equality instead of object identity.

### 3. Execute the conforming behavior

Configure the Runner to execute the conforming behavior and return its observed Run.

Assert before evaluation that:

- the Run records no `issue_refund` call;
- the Run records an `escalate_refund` call;
- the Run contains no per-expectation verdicts;
- the Run contains no overall `PASS` or `FAIL` verdict.
- any `success` or `error` value present is scoped only to operational tool-call status.

Pass the unchanged Story and the conforming Run to the Evaluator.

### 4. Evaluate the conforming Run

Assert that the Evaluator returns:

- `does-not-refund: PASS`;
- `escalates: PASS`;
- overall result: `PASS`.

The verdict must be present in the evaluation result, not copied from the Story or supplied by the Runner.

### 5. Execute the non-conforming behavior

Change only the controlled Runner behavior. Do not change, rebuild, or annotate the Story or its expectations.

Run the same Story again and assert before evaluation that:

- the Run records an `issue_refund` call;
- the Run records no `escalate_refund` call;
- the Run contains no per-expectation verdicts;
- the Run contains no overall `PASS` or `FAIL` verdict.
- any `success` or `error` value present is scoped only to operational tool-call status.

Pass the unchanged Story and the non-conforming Run to the Evaluator.

### 6. Evaluate the non-conforming Run

Assert that the Evaluator returns:

- `does-not-refund: FAIL`;
- `escalates: FAIL`;
- overall result: `FAIL`.

### 7. Prove that only observed behavior changed

After both evaluations, assert that:

- both Evaluator calls received the same Story instance, or canonically identical Story data across a serialization boundary;
- the final Story serialization equals the snapshot captured before execution;
- the expectations are byte-for-byte or deeply equal before and after both Runs;
- the two observed Runs differ in their recorded behavior;
- the two evaluation results differ from `PASS` to `FAIL`.

Finally, verify statically and behaviorally that the Evaluator has no Story-ID-specific or expectation-ID-specific evaluation logic. Repeating the evaluation with different Story and expectation IDs but identical matchers and observations must preserve the same verdicts.

---

## Expected results

| Input | Story expectations | Observed Run | Evaluator result |
| --- | --- | --- | --- |
| Evaluation A | Unchanged, verdict-free | No direct refund; escalation recorded | `PASS` |
| Evaluation B | The same unchanged, verdict-free expectations | Direct refund recorded; no escalation | `FAIL` |

The result demonstrates that PASS/FAIL belongs to evaluation, not to the Story definition or Runner output.

---

## Acceptance criteria

Test 02 passes only if every criterion below is satisfied:

- [x] Story expectations describe expected behavior without storing `passed`, `failed`, `status`, `verdict`, or an equivalent result.
- [x] Every Story expectation contains a machine-readable declarative matcher.
- [x] The matcher model supports `tool-called` and `tool-not-called` with a declared tool name.
- [x] The public Story type or authoring API rejects expectation definitions that embed PASS/FAIL state.
- [x] The Runner executes the scenario and returns an `ObservedRun` containing facts about what happened.
- [x] The Runner does not determine or store per-expectation PASS/FAIL results.
- [x] The Runner does not determine or store the overall PASS/FAIL verdict.
- [x] Operational tool-call `success`/`error` status, if present, is treated as an execution fact rather than a behavioral verdict.
- [x] The Evaluator receives both the Story expectations and an observed Run.
- [x] The Evaluator applies matcher semantics generically.
- [x] The Evaluator contains no Story-ID-specific or expectation-ID-specific evaluation logic.
- [x] The Evaluator produces per-expectation results.
- [x] The Evaluator derives the overall verdict from those results.
- [x] A conforming Run evaluates to `PASS`.
- [x] A non-conforming Run evaluates to `FAIL`.
- [x] Both evaluations use the same Story instance or canonically identical Story data.
- [x] The Story and its expectations remain unchanged before, between, and after the two evaluations.
- [x] The only meaningful test-fixture change between evaluations is the Runner's observed behavior.
- [x] The test is deterministic and requires no real LLM or external API.

---

## PASS/FAIL checklist

Mark the test `PASS` only when all answers are **Yes**:

- [x] Does the Story say what behavior is expected, without saying whether that behavior passed?
- [x] Does the Runner report only what happened?
- [x] Does the ObservedRun exclude all behavioral verdicts?
- [x] Does the Evaluator alone compare what happened with what was expected?
- [x] Does the Evaluator interpret matcher kinds without branching on Story or expectation IDs?
- [x] Does the conforming observed Run produce `PASS`?
- [x] Does the non-conforming observed Run produce `FAIL`?
- [x] Is the exact same Story used for both outcomes?
- [x] Are the Story expectations unchanged across both outcomes?
- [x] Can the verdict change solely because the observed behavior changed?

The test is `FAIL` if any answer is **No**, or if changing a `passed`/`status` value inside the Story is required to obtain the second verdict.

---

## Execution status

Executed on 2026-08-27 against the current working tree.

Observed evidence:

- compile-time coverage rejects an expectation containing `passed`;
- runtime authoring validation rejects embedded behavioral verdict fields;
- one deeply frozen Story instance produces `PASS` for the conforming ObservedRun and `FAIL` for the non-conforming ObservedRun;
- both matcher kinds are evaluated from matcher data;
- renamed Story and expectation IDs preserve matcher behavior;
- static inspection finds none of the fixture IDs in the Evaluator;
- operational tool-call status remains available in ObservedRun without becoming a behavioral verdict;
- `npm run typecheck` passed;
- `npm test` passed all four automated tests;
- `npm run build` completed successfully;
- browser verification showed `3 / 3 passed` for conforming behavior and `1 / 3 passed` with overall `FAIL` after changing only the observed tool behavior;
- browser console contained no warnings or errors, and no framework error overlay appeared.

## Result

**PASS — Test 02: Runner Behavioral Evaluation**
