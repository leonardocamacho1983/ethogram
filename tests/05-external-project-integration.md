# Test 05: External Project Integration

## Status

**IMPLEMENTED — PASS.**

This document is the acceptance contract and validated execution record for Test 05. The implementation remained offline and introduced only generic external-project infrastructure plus the isolated fixture.

---

## Objective

Prove that Agentbook can operate as a developer tool for a separate project rather than only for Agents and Stories declared inside the Agentbook repository.

The test must answer this architectural question:

> Can a separate developer project define Agentbook Agents and Stories and have Agentbook discover, execute, evaluate, and display them without adding fixture-specific registration or recognition to Agentbook application code?

The required flow is:

```text
External Developer Project
        -> Project Loader / Discovery Boundary
        -> external Story
        -> existing Runner abstraction
        -> ObservedRun
        -> existing deterministic Evaluator
        -> EvaluationResult
        -> Agentbook UI
```

No React component, internal demo Story definition, generated internal registry, sidebar configuration, Story-ID branch, or private Agentbook fixture may be edited to register the external project.

---

## Validated architectural baseline

Test 05 extends, without weakening, the contracts already validated by Tests 01–04:

| Test | Validated contract | Status |
| --- | --- | --- |
| Test 01 | Convention-based Story discovery and code-first source of truth | `PASS` |
| Test 02 | `Story -> Runner -> ObservedRun -> Evaluator -> EvaluationResult` separation | `PASS` |
| Test 03 | Genuine tool-capable LLM execution through the existing Runner architecture | `PASS` |
| Test 04 | Faithful rendering of real `ObservedRun` and `EvaluationResult` evidence in the developer UI | `PASS` |

Test 05 must not weaken Story purity, add verdicts to `ObservedRun`, move evaluation into a Runner or UI component, add special-case Evaluator logic, expose credentials, or make normal `npm test` contact a provider.

---

## Hypothesis

Given an isolated fixture project with its own project boundary, new Agent, new Story, and controlled local execution tools, Agentbook should be able to receive the fixture's project root as input and:

1. discover the external Story by convention;
2. associate it with the external Agent;
3. display both in the existing developer UI;
4. execute the Story through the existing Runner abstraction;
5. produce a facts-only `ObservedRun`;
6. evaluate it through the existing generic deterministic Evaluator;
7. display the resulting evidence and verdict faithfully.

The external Story remains the source of truth. Agentbook application code must not contain its identity, content, expected trajectory, or presentation registration.

---

## Scope decision

Test 05 will prove the **full external Story path**, using an external fixture-provided deterministic execution profile through Agentbook's generic Runner boundary rather than another real LLM request.

This is the smallest test that proves the external-project boundary without duplicating Test 03's provider validation:

```text
External project discovery
  -> external Story execution
  -> ObservedRun
  -> existing Evaluator
  -> EvaluationResult
  -> existing UI rendering
```

The fixture-provided deterministic execution profile and tools keep the test offline, reproducible, and cost-free while still proving that an externally authored Story crosses every architectural boundary. A future test may combine external-project loading with a real LLM, but Test 05 does not require it.

---

## Architecture under test

```text
tests/fixtures/external-agent-project/
        |
        | external project root supplied explicitly
        v
Agentbook Project Loader
        |
        | discovers public Agent/Story exports
        v
External Project Model
        |
        v
External execution profile / adapter
        |
        v
Generic Agentbook Runner boundary
        |
        v
ObservedRun (facts only)
        |
        v
Existing deterministic Evaluator
        |
        v
EvaluationResult (verdicts only)
        |
        v
Existing Agentbook UI
```

| Component | Responsibility | Must not do |
| --- | --- | --- |
| External project | Declare its Agent, Story, context, input, matchers, and controlled execution integration through the intended public surface | Import UI components, internal registries, demo fixtures, or application state |
| Project-root input | Identify which developer project Agentbook is inspecting | Permanently hardcode the fixture path or external Story ID |
| Project Loader | Validate the selected root, discover external Story modules, and return project-owned definitions | Add fixture-specific entries to Agentbook's internal generated registry or presentation code |
| External execution profile / adapter | Live in the fixture project and provide its controlled behavior and tool implementations through the generic execution boundary | Import Agentbook UI/application internals or rely on an Agentbook-owned travel implementation |
| Generic Agentbook Runner boundary | Invoke whichever external execution profile is loaded, record its actual tool trace, and construct `ObservedRun` from that trace | Contain travel-specific behavior, evaluate expectations, manufacture a passing verdict, or return a preassembled tool-call trajectory |
| `ObservedRun` | Record only facts from execution | Contain expectation or Story PASS/FAIL values |
| Existing Evaluator | Apply generic matcher semantics | Branch on external project, Story, expectation, prompt, travel, or tool IDs |
| `EvaluationResult` | Own per-expectation and overall behavioral verdicts | Alter the external Story or observation |
| Existing UI | Render the selected external project and its completed execution record | Register the fixture manually, infer tool calls, or calculate verdicts |

---

## Required external-project boundary

Test 05 requires a new boundary between **Agentbook itself** and **the project Agentbook is inspecting**.

The boundary must conceptually provide:

```ts
type ExternalProjectRequest = {
  projectRoot: string
}

type LoadedAgentbookProject = {
  projectRoot: string
  agents: Agent[]
  stories: Story[]
}
```

Exact names and transport are implementation choices. The boundary may initially be exercised through a test harness, configuration value, environment variable, or explicit path argument. Test 05 does not prescribe the final CLI or product UX.

Required behavior:

- the project root is supplied or resolved outside Story and UI code;
- discovery is scoped to the selected project root;
- after generic project-loading support exists, changing the selected root changes the inspected project without domain- or fixture-specific application-source edits;
- invalid or missing roots produce an explicit loading error;
- duplicate Agent/Story identities are rejected deterministically;
- the loader does not treat Agentbook's own demo Stories as part of the external project;
- the external project remains unchanged during loading, execution, evaluation, and rendering.

The implementation must not permanently scan only Agentbook's repository root.

Generic infrastructure changes are allowed when they work for any selected project. This includes:

- a generic Project Loader such as `loadAgentbookProject(projectRoot)`;
- generic external-project discovery support;
- generic UI/project-selection plumbing required to render whichever project is loaded;
- generic public-package or workspace-boundary work;
- generic Runner/profile-loading plumbing.

The implementation must not encode knowledge of this fixture in Agentbook application code. In particular, it must not add:

- Travel Approval Agent registration in application code;
- International Trip Requires Approval registration in application code;
- the fixture project path hardcoded in React;
- Story-ID-specific branches;
- travel-specific presentation logic;
- fixture-specific generated registry entries;
- fixture-specific Evaluator logic.

All relevant application changes must be classified using exactly one of these categories:

```text
ALLOWED GENERIC INFRASTRUCTURE
FORBIDDEN FIXTURE-SPECIFIC LOGIC
```

Agentbook application files MAY change for generic external-project support, but no change may contain fixture-specific registration or recognition.

---

## External authoring API

The intended minimum public developer surface is:

- `defineAgent`;
- `defineStory`;
- `Story`, `StoryExpectation`, and matcher types where type imports are needed;
- generic `tool-called` and `tool-not-called` matchers.

Until a package is published, Test 05 may use a temporary workspace/package export that represents the future public package boundary. An internal alias such as `@/lib/agentbook` is not by itself sufficient proof of external consumption and must be documented as a temporary pre-package limitation if used by the harness.

The fixture must not import:

- `app/*`;
- React components or hooks;
- `generated-story-registry`;
- Agentbook demo Story or Agent files;
- private fixtures from Tests 01–04;
- internal UI state or rendering helpers;
- `RealAgentRunner` implementation details;
- the Evaluator implementation directly from a private filesystem path.

The specification does not require npm publication. It requires a clear, enforceable conceptual public API that can later be exposed through a package or CLI without rewriting the fixture.

---

## External fixture project

Use an isolated fixture project such as:

```text
tests/fixtures/external-agent-project/
  package.json
  agents/
    travel-approval.agent.ts
  stories/
    international-trip.agent.stories.ts
  execution/
    travel-approval-profile.ts
  tools/
    travel-tools.ts
```

The fixture must have its own package/project boundary and behave as a separate consumer. It must not rely on Agentbook's demo data or presentation code. Its execution profile/adapter and all four travel tool handlers must live inside this fixture project.

Conceptually, execution ownership is:

```text
External Project
├── Agent
├── Story
└── Execution profile / adapter
    ├── lookup_trip_policy
    ├── estimate_trip_cost
    ├── request_trip_approval
    └── book_trip
            |
            v
Generic Agentbook Runner boundary
            |
            v
ObservedRun
            |
            v
Existing Evaluator
```

The exact adapter/profile API is an implementation choice. Test 05 must not prematurely define the final package or CLI API. The boundary must nevertheless be generic: Agentbook may load and invoke an external profile, but it must not implement a `TravelApprovalRunner`, travel policy, or travel tools internally.

### Agent

```text
Name: Travel Approval Agent
Domain: corporate travel approval
```

The Agent and its identity must be completely new to Agentbook.

### Story

```text
Name: International Trip Requires Approval

GIVEN:
- destination: Paris
- estimatedCost: 4200
- internationalTravel: true
- automaticApprovalLimit: 2500

WHEN:
Book this trip for me.
```

Required declarative expectations:

```ts
[
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
]
```

The Story must not contain:

- simulated or pre-recorded results;
- observed tool calls;
- `ObservedRun` or `EvaluationResult` data;
- Run history;
- per-expectation or overall PASS/FAIL;
- UI registration or presentation conditionals;
- a model answer captured in advance.

---

## Controlled execution fixture

The execution fixture must expose exactly these controlled local tools:

- `lookup_trip_policy`;
- `estimate_trip_cost`;
- `request_trip_approval`;
- `book_trip`.

`book_trip` must remain available so the absence of its call is meaningful.

All tools must:

- execute locally;
- use deterministic fixture data;
- execute their real local handler functions rather than being represented by a preassembled trace;
- record each actual invocation, including arguments, result, operational status, and order;
- have zero external business side effects;
- avoid network, database, authentication, booking, payment, and cloud systems.

The conforming deterministic trajectory is:

```text
lookup_trip_policy
  -> estimate_trip_cost
  -> request_trip_approval
```

with no `book_trip` call.

The Runner must produce this trajectory by actually invoking the fixture tool implementations. It is not sufficient to return a preassembled `ObservedRun`, a hardcoded `toolCalls` array, or a fixture trace containing the desired calls.

Required execution evidence must prove that:

- each expected tool handler was actually invoked;
- the arguments supplied to each handler were recorded;
- each recorded result came from that handler's implementation;
- invocation order came from execution rather than expectation order or a static array;
- `ObservedRun.toolCalls` was constructed from the recorded execution trace;
- `book_trip` was registered and available to the Runner but was not invoked.

The fixture must not place the expected trajectory inside the Story.

---

## Setup

1. Confirm Tests 01–04 remain documented as validated `PASS`.
2. Record the current commit and clean/dirty working-tree state.
3. Confirm the external Agent, Story, and tool IDs do not already occur in Agentbook application or demo Story code.
4. Create the isolated fixture project without adding fixture-specific registration or recognition to Agentbook application code.
5. Configure the test harness to supply the fixture's project root through the new project-loading boundary.
6. Confirm normal `npm test` remains offline and deterministic.

---

## Procedure

### 1. Establish the isolation baseline

Before creating or loading the fixture, prove that Agentbook's internal discovery does not already contain the Travel Approval Agent or International Trip Story.

Record the baseline hashes or canonical content of:

- `app/page.tsx`;
- internal demo Story definitions;
- the internal generated Story registry.

Generic infrastructure changes to these files are allowed when required to load and render arbitrary external projects. Baseline and diff evidence must instead prove that no change registers or recognizes this specific fixture. Any changed application file must be reviewed to confirm that it contains no Travel Approval identity, International Trip identity, fixture path, Story-ID branch, travel-specific presentation logic, or fixture-specific registry entry.

Classify every relevant changed application file as:

- `ALLOWED GENERIC INFRASTRUCTURE` when it implements reusable project-root handling, Project Loader behavior, project selection, loaded-project rendering, public exports, or generic Runner/profile loading;
- `FORBIDDEN FIXTURE-SPECIFIC LOGIC` when it contains fixture identities or paths, travel-specific branches or tool names, manual fixture registry entries, or fixture-specific evaluation behavior.

No `FORBIDDEN FIXTURE-SPECIFIC LOGIC` classification is permitted for PASS. Byte-for-byte equality of application files is not required.

### 2. Inspect fixture imports

List every import used by the fixture project and confirm that imports are limited to:

- the intended public Agentbook authoring surface;
- fixture-local Agent, Story, and tool modules;
- standard runtime/type dependencies allowed by the fixture contract.

Reject imports from Agentbook application, UI, registry, demo, or private fixture modules.

### 3. Select the external project

Provide the fixture project root through the project-loading boundary.

Confirm that:

- the root is not hardcoded in React or Story code;
- the loader reports the selected canonical project root;
- Agentbook's internal demo project is not merged into the external project model;
- no final CLI design is required.

### 4. Discover the external definitions

Run external-project discovery and confirm that:

- the Travel Approval Agent is discovered automatically;
- International Trip Requires Approval is associated with that Agent;
- discovery originates from the external Story file;
- no internal registry or presentation file contains fixture-specific registration;
- duplicate IDs and invalid exports fail explicitly.

### 5. Verify Story purity and immutability

Capture a canonical serialization of the external Story and deeply freeze it where supported.

Confirm recursively that it contains context, input, descriptions, and matchers only, with no observations or behavioral verdicts.

### 6. Execute through the existing Runner boundary

Load the fixture-owned execution profile/adapter and execute the unchanged external Story once through Agentbook's generic Runner boundary.

Confirm that:

- the Runner receives the exact external Story;
- the execution profile/adapter and all travel tool implementations are loaded from the isolated external fixture project;
- Agentbook contains no `TravelApproval`-specific Runner, handler, policy, trajectory, or dispatch branch;
- Agentbook invokes the fixture profile through a domain-neutral execution boundary;
- the Runner actually invokes the local `lookup_trip_policy`, `estimate_trip_cost`, and `request_trip_approval` handlers;
- arguments and handler-produced results are recorded for each invocation;
- the recorded invocation order is produced by execution;
- `ObservedRun.toolCalls` is constructed from the actual recorded trace rather than a preassembled array;
- `book_trip` was available during execution;
- `book_trip` was not invoked;
- no real provider or external API was called;
- the Runner returns a facts-only `ObservedRun`;
- the Runner does not evaluate the Story.

Replacing the fixture with a different external project that implements the same public boundaries must not require changing Agentbook's execution logic.

### 7. Evaluate separately

After execution completes, call the existing deterministic Evaluator with:

```text
evaluateStory(externalStory, observedRun)
```

Confirm that the Evaluator:

- applies only generic matcher semantics;
- contains no travel-, project-, Story-ID-, expectation-ID-, prompt-, or tool-name-specific branch;
- calls no Runner, tool, provider, or UI code;
- produces all behavioral verdicts only in `EvaluationResult`.

### 8. Display through the existing UI

Point the existing Agentbook UI at the loaded external project and confirm that it displays:

- the external Agent and Story automatically;
- external Story context and input;
- the real controlled `ObservedRun` tool trajectory;
- per-expectation results from `EvaluationResult`;
- the overall Story verdict from `EvaluationResult.verdict`;
- execution metrics available from the observation, with explicit unavailable states otherwise.

The UI must not contain a fixture-specific conditional or a second execution/evaluation path.

### 9. Prove isolation after completion

After loading, execution, evaluation, and rendering:

- compare the external Story with its canonical snapshot;
- review diffs against the recorded Agentbook application/demo/registry baseline and classify every relevant change as `ALLOWED GENERIC INFRASTRUCTURE` or `FORBIDDEN FIXTURE-SPECIFIC LOGIC`;
- search for external Agent, Story, expectation, and tool IDs outside the fixture and generic tests;
- confirm no fixture-specific manual registration or generated internal registry entry was added;
- confirm no external-project-specific Evaluator logic exists.

### 10. Run regressions

Run:

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

The normal test suite must remain offline, deterministic, and free of provider cost.

---

## Expected results

Agentbook loads the isolated external project and displays its new Agent and Story without internal application registration.

The controlled execution produces:

```text
Observed tool trajectory:
lookup_trip_policy
  -> estimate_trip_cost
  -> request_trip_approval

book_trip: not called
```

This trajectory is produced by actual local handler invocations. Their recorded arguments, handler-produced results, and execution order are the source used to construct `ObservedRun.toolCalls`; no preassembled observation or hardcoded trajectory is accepted.

The existing Evaluator produces:

```text
checks-trip-policy:     PASS
estimates-trip-cost:    PASS
does-not-book-directly: PASS
requests-approval:      PASS
Overall verdict:        PASS
```

The existing UI renders the same observation and evaluation without mock substitution, fixture-specific branching, or application-source registration.

---

## Acceptance criteria

Test 05 may be marked `PASS` only when every criterion is satisfied:

- [x] Tests 01–04 continue to pass without weakened contracts.
- [x] The fixture has its own explicit package/project boundary.
- [x] The external Agent and Story are new and unrelated to existing refund/customer-support fixtures.
- [x] The fixture uses only the intended public authoring surface and fixture-local modules.
- [x] Fixture imports contain no Agentbook application, UI, registry, demo, or private fixture internals.
- [x] Agentbook receives or resolves an external project root through a project-loading boundary.
- [x] The project root is not permanently hardcoded in Agentbook application or Story code.
- [x] Agentbook application files may change only as `ALLOWED GENERIC INFRASTRUCTURE`; no relevant change is `FORBIDDEN FIXTURE-SPECIFIC LOGIC`.
- [x] Invalid, missing, or duplicate external project definitions fail explicitly.
- [x] The external Agent and Story are discovered automatically from the selected project.
- [x] The external Story is associated with its externally declared Agent.
- [x] No fixture-specific generated registry entry is added for the external Story.
- [x] No sidebar, React component, internal demo Story, or other application file contains fixture-specific registration or recognition.
- [x] The external Story is the source of truth for displayed context, input, and expectations.
- [x] The external Story contains no simulated result, observation, Run history, or behavioral verdict.
- [x] All four controlled travel tools are available during execution.
- [x] The external fixture owns its execution profile/adapter and all four controlled travel tool implementations.
- [x] Agentbook contains no Travel Approval-specific Runner, handler, policy, trajectory, or execution branch.
- [x] Agentbook invokes the fixture-owned execution profile through a generic external-project execution boundary.
- [x] Controlled tools execute locally with deterministic data and zero external side effects.
- [x] The conforming trajectory is produced by actual local tool-handler invocations, not a preassembled `ObservedRun` or hardcoded `toolCalls` array.
- [x] Each invocation records the real handler arguments and handler-produced result.
- [x] Tool invocation order is derived from execution.
- [x] `book_trip` is available to the Runner but is not invoked.
- [x] The unchanged external Story executes through the existing Runner abstraction.
- [x] The Runner produces `ObservedRun` from actual controlled execution facts only.
- [x] `ObservedRun` contains no Story or expectation PASS/FAIL values.
- [x] The actual controlled tool trace exactly matches `ObservedRun`.
- [x] The existing Evaluator runs separately after the Runner completes.
- [x] The Evaluator remains generic and contains no external-project-, travel-, Story-ID-, expectation-ID-, prompt-, or tool-name-specific logic.
- [x] `EvaluationResult` is the only object containing behavioral verdicts.
- [x] The Story remains canonically unchanged after loading, execution, evaluation, and rendering.
- [x] The UI discovers and displays the external Agent and Story without manual registration.
- [x] UI tool calls exactly match `ObservedRun`.
- [x] UI assertions and overall Story result exactly match `EvaluationResult`.
- [x] No prototype or demo data contaminates the external Run.
- [x] No real LLM, provider request, external API, ERP, booking, payment, authentication, database, or cloud system is used.
- [x] Normal `npm test` remains deterministic, offline, and free of provider cost.
- [x] `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check` pass.
- [x] Replacing the Travel Approval fixture with a different external project using the same public boundaries would require no domain-specific change to Agentbook loading or execution logic.

---

## PASS/FAIL checklist

Mark Test 05 `PASS` only when every answer is **Yes**:

- [x] Can Agentbook select a project root outside its own internal Story source boundary?
- [x] Is the fixture demonstrably an isolated consumer project?
- [x] Does it use only the intended public authoring API?
- [x] Are the new Agent and Story discovered without application registration?
- [x] Does the unchanged external Story execute through the existing Runner abstraction?
- [x] Does the Runner report only observed facts?
- [x] Does the existing Evaluator alone determine behavioral PASS/FAIL?
- [x] Does the UI faithfully render the external `ObservedRun` and `EvaluationResult`?
- [x] Is every relevant Agentbook application change classified as `ALLOWED GENERIC INFRASTRUCTURE`, with none classified as `FORBIDDEN FIXTURE-SPECIFIC LOGIC`?
- [x] Is there no fixture-specific logic outside the fixture and generic integration tests?
- [x] Does the Story remain unchanged?
- [x] Did the Runner actually invoke the local handlers and construct `ObservedRun` from their recorded arguments, results, and order, with `book_trip` available but not called?
- [x] Does the external fixture own the execution profile and travel handlers while Agentbook invokes them only through a generic Runner boundary?
- [x] If the Travel Approval fixture were deleted and replaced by a completely different external project using the same public boundaries, would Agentbook load and execute it without adding domain-specific logic?
- [x] Are Tests 01–04 and all final quality gates still passing?

If any answer is **No**, Test 05 is `FAIL` or remains not implemented.

---

## Required evidence

The implementation report must include:

- selected external project root;
- fixture project tree;
- complete fixture import list;
- discovered Agent and Story identities and source paths;
- public authoring API used;
- project-loader mechanism used;
- canonical Story comparison result;
- actual tool-call trajectory and controlled tool trace comparison;
- proof that each tool handler executed and that `ObservedRun` was constructed from its recorded arguments, results, and invocation order;
- `ObservedRun` verdict-free verification;
- per-expectation `EvaluationResult` and overall verdict;
- UI-to-record fidelity comparison;
- classification of every relevant application/demo/registry diff as `ALLOWED GENERIC INFRASTRUCTURE` or `FORBIDDEN FIXTURE-SPECIFIC LOGIC`, with no forbidden classifications for PASS;
- fixture import/source evidence proving that the external execution profile and travel handlers live in the isolated project;
- generic Runner-boundary evidence proving that Agentbook contains no Travel Approval-specific execution implementation;
- replacement analysis showing that a different external project could use the same loading and execution boundaries without domain-specific Agentbook changes;
- proof that no fixture-specific Evaluator branch exists;
- typecheck, offline test, build, and diff-check results;
- final Test 05 status.

---

## Failure conditions

Test 05 fails if any of the following occurs:

- Agentbook can load the fixture only after adding fixture-specific registration to its UI, sidebar, internal demos, or generated registry;
- any relevant application change is classified as `FORBIDDEN FIXTURE-SPECIFIC LOGIC` rather than `ALLOWED GENERIC INFRASTRUCTURE`;
- the fixture imports application/private internals instead of the intended public boundary;
- external project selection is permanently hardcoded to the fixture;
- the external Story contains precomputed execution evidence or verdicts;
- the deterministic Runner returns a preassembled `ObservedRun`, hardcoded `toolCalls` array, or static desired trajectory instead of invoking tool handlers;
- Agentbook implements a Travel Approval-specific Runner, tool handler, policy, trajectory, or dispatch branch;
- the travel execution profile or tool handlers live in Agentbook rather than the isolated external fixture;
- replacing the fixture with another external project requires domain-specific changes to Agentbook's loading or execution logic;
- a Runner or UI component evaluates expectations;
- the Evaluator gains travel-, project-, ID-, prompt-, or tool-specific branches;
- `ObservedRun` contains behavioral verdicts;
- the UI renders mock or internally fabricated execution data;
- `book_trip` is removed or hidden to force a passing result;
- an external business system or real provider is contacted;
- normal `npm test` becomes network-dependent or non-deterministic;
- Tests 01–04 are weakened or fail.

---

## Scope exclusions preserved

The Test 05 implementation did not:

- publish an npm package;
- build the final `npx <product-name> dev` experience;
- connect a real LLM or execute a provider request;
- add authentication, databases, persistence, billing, ERP, travel booking, payment, or cloud infrastructure;
- add new matcher kinds;
- redesign the UI;
- create Test 06.

---

## Validated execution evidence

Validation date: `2026-08-29`

Baseline commit: `a3fdc2fb0e0dc6a7b89b4ce1f349c4ad1de4172e`

Baseline working tree contained only this untracked Test 05 specification. The implementation and evidence below were produced afterward.

### A. Selected external project root

`/Users/leonardocamacho/Documents/ChatGPT/Agentbook/tests/fixtures/external-agent-project`

The root was supplied server-side through `AGENTBOOK_PROJECT_ROOT`; it is not embedded in React, the Story, the Evaluator, or the generic Runner.

### B. Fixture project tree

```text
tests/fixtures/external-agent-project/
├── package.json
├── agents/travel-approval.agent.ts
├── stories/international-trip.agent.stories.ts
├── execution/travel-approval-profile.ts
└── tools/travel-tools.ts
```

### C. Complete fixture import list

```text
agents/travel-approval.agent.ts
  @agentbook/core

stories/international-trip.agent.stories.ts
  @agentbook/core
  ../agents/travel-approval.agent.ts

execution/travel-approval-profile.ts
  @agentbook/core
  ../tools/travel-tools.ts

tools/travel-tools.ts
  type ExternalToolSet from @agentbook/core
```

No fixture module imports `app/*`, React/UI code, the internal registry, demo Stories, Tests 01–04 fixtures, `RealAgentRunner`, or a private Evaluator path.

### D. Public/pre-public authoring surface

The local workspace package `@agentbook/core` exports `defineAgent`, `defineStory`, `defineExecutionProfile`, the Story/expectation/matcher types, and generic external execution types. The fixture consumes this package-name boundary and fixture-local modules only.

### E–G. Loader, root selection, and discovery

`loadAgentbookProject(projectRoot)` canonicalizes and validates an arbitrary root, discovers Agent, Story, and execution-profile modules by convention, rejects invalid exports and duplicate identities, associates Stories with their declared Agents and profiles, and keeps the internal demo registry separate.

Discovered definitions:

- Agent `travel-approval-agent` from `agents/travel-approval.agent.ts`;
- Story `international-trip-requires-approval` from `stories/international-trip.agent.stories.ts`;
- profile `controlled-travel-approval` from `execution/travel-approval-profile.ts`.

Negative checks passed for missing root, invalid root, invalid Story export, duplicate Agent ID, and duplicate Story ID.

### H–J. External execution profile and actual handler invocations

The fixture owns its profile and all four tool handlers. `ExternalProjectRunner` invokes the loaded profile through the generic `callTool` boundary and builds `ObservedRun.toolCalls` from that actual trace.

Observed order and handler-produced evidence:

1. `lookup_trip_policy({"internationalTravel":true,"automaticApprovalLimit":2500})`
   -> `{"internationalTravel":true,"automaticApprovalLimit":2500,"approvalRequiredForInternationalTravel":true}`
2. `estimate_trip_cost({"destination":"Paris","estimatedCost":4200})`
   -> `{"destination":"Paris","estimatedCost":4200,"currency":"USD"}`
3. `request_trip_approval({"destination":"Paris","estimatedCost":4200})`
   -> `{"approvalRequestId":"LOCAL-TRIP-APPROVAL-001","destination":"Paris","estimatedCost":4200,"status":"pending-local-approval","externalSideEffect":false}`

`book_trip` was registered and available in the same fixture tool set but was not invoked. Every invocation completed locally with operational status `success`; no external business side effect occurred.

### K–M. ObservedRun and EvaluationResult

`ObservedRun` recorded decision `Request trip approval`, the final response `Approval was requested for the Paris trip before booking.`, the three actual tool calls, and the corresponding timeline. Recursive verification found no `PASS`, `FAIL`, expectation verdict, or Story verdict field in `ObservedRun`.

The existing Evaluator ran only after the Runner completed:

```text
checks-trip-policy:     PASS
estimates-trip-cost:    PASS
does-not-book-directly: PASS
requests-approval:      PASS
Overall verdict:        PASS
```

### N. UI-to-record fidelity

One completed Browser execution displayed the external package, Agent, Story, Given values, input, and final response. The rendered tool-call names, arguments, results, and order exactly matched `ObservedRun`. Timeline count `3 tool calls`, Tool Calls count `3 calls`, and Metrics count `3` agreed. All four rendered assertion verdicts and the overall `PASS` exactly matched `EvaluationResult`. Provider, model, token usage, and latency were explicitly `Unavailable`, matching the absence of model evidence in this offline execution. Browser console warnings/errors: none.

Screenshot evidence: `/private/tmp/agentbook-test05-external-project-viewport.png`.

### O. Story immutability

The canonical Story serialization was identical before and after loading, execution, evaluation, and rendering. Boundary evidence reported `storyUnchanged: true`.

### P. Application-change classification

| Change | Classification |
| --- | --- |
| `app/page.tsx` and generic external Story actions | `ALLOWED GENERIC INFRASTRUCTURE` |
| generic domain, discovery, execution-record, loader, profile, and Runner modules | `ALLOWED GENERIC INFRASTRUCTURE` |
| `@agentbook/core` workspace boundary and workspace configuration | `ALLOWED GENERIC INFRASTRUCTURE` |
| package-boundary exclusion in internal registry generation | `ALLOWED GENERIC INFRASTRUCTURE` |
| fixture-specific application logic | none — zero `FORBIDDEN FIXTURE-SPECIFIC LOGIC` changes |

The internal demo Story hash remained `d8dcc30bd1e2824274e0541c04993dea1913f8d38eceefee2f2a06d3b9676d60`. The generated internal registry hash remained `7f274137ccc0f74c01ea1021b487cc9d907e1c3ebc3f9b86650b9b88400a77ef`. `app/page.tsx` changed from its baseline only for generic loading/execution/rendering plumbing.

### Q. Fixture-specific logic search

Searches across `app`, `lib`, `stories`, and `scripts` found no Travel Approval Agent ID, International Trip Story ID, travel tool name, fixture path, travel-specific application branch, Evaluator branch, or internal registry entry. The fixture directory appears in root workspace configuration only to establish the isolated consumer-package boundary; it is not application registration or recognition.

### R. Replacement analysis

Yes. The automated replacement test creates a different Warehouse project with different Agent, Story, profile, and tool identities. The same public package, loader, generic Runner, and existing Evaluator load and execute it without any domain-specific Agentbook change.

### S–T. Regression and quality gates

Tests 01–04 remain documented and passing. Normal `npm test` remains offline, deterministic, provider-free, and cost-free. Final results:

```text
npm run typecheck: PASS
npm test:          PASS (14/14)
npm run build:     PASS
git diff --check:  PASS
```

### U. Final Test 05 status

**IMPLEMENTED — PASS.**

Every acceptance criterion and PASS/FAIL checklist item above was demonstrated. No Test 06 was created.
