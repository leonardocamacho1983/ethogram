# Test 08: Bring Your Own Agent

## Execution status

**IMPLEMENTED — PASS (2026-08-29).**

This document remains the acceptance contract for Test 08 and now also records the validated implementation evidence. The complete lifecycle and regression suite described below were executed from packed artifacts against an isolated pre-existing TypeScript agent project before this status was changed to `PASS`.

The two pre-implementation architecture gates are resolved by this specification:

1. GIVEN remains the sole scenario/context boundary and accepts either the existing `string[]` form or a new structured record form. No parallel `scenario` property is introduced.
2. `agentbook init --existing` is the accepted minimal initialization path for an existing agent project.

No architecture decision remains unresolved for the specified Test 08 implementation. Any discovery that requires a materially different public contract must stop implementation and revise this specification first.

---

## Objective

Prove that a developer can add Agentbook behavioral testing to an ordinary TypeScript agent that existed before Agentbook, without rewriting that agent or duplicating its business behavior inside Agentbook.

The required flow is:

```text
pre-existing TypeScript agent
  -> install packed Agentbook artifacts
  -> add minimal Agentbook-owned integration files
  -> discover Agent and Stories
  -> Story-authored GIVEN/WHEN
  -> thin execution profile
  -> existing agent public entry point
  -> existing tool implementations through observable wrappers
  -> canonical verdict-free ObservedRun
  -> generic deterministic Evaluator
  -> EvaluationResult
  -> existing developer UI
```

The implementation must prove that the existing agent remains the behavior under test. Agentbook integration may adapt inputs, instrument tool calls, invoke the agent, and translate its output. It must not become a second implementation of the agent.

---

## Why this test matters

Tests 01–07 prove code-first Story discovery, honest execution/evaluation separation, real-agent execution, UI evidence fidelity, external project ownership, installable package boundaries, and five-minute zero-config onboarding with a generated deterministic starter.

That starter was designed for first use, not adoption into an existing codebase. Its execution profile owns the sample behavior and hardcodes the scenario input. A developer bringing an existing agent needs a different proof: their agent already owns its decisions and tools, and the Story must drive that existing implementation without Agentbook reproducing its policy.

Test 08 therefore validates an adoption boundary rather than another starter. It answers whether Agentbook can be attached to existing agent software as a behavioral test harness while preserving source ownership and causal evidence.

---

## Scope and claim limitation

Test 08 proves zero-touch Agentbook integration for an existing TypeScript/Node agent that already exposes:

- a callable execution boundary through which a normal consumer can invoke the agent; and
- an injectable or otherwise instrumentable tool boundary through which actual tool calls can be observed without changing the agent's original source.

The Purchase Approval fixture must possess both properties in its recorded pre-Agentbook baseline. They are ordinary architectural characteristics of that pre-existing agent, not hooks added for Agentbook.

Passing Test 08 does **not** prove zero-touch compatibility with every possible TypeScript agent architecture. In particular, it does not claim that Agentbook can integrate without source changes when an agent tightly encapsulates execution, hides tool dispatch behind inaccessible framework internals, exposes no callable entry point, or provides no safe instrumentation boundary.

Test 08 must not expand into framework-specific adapters, monkey-patching infrastructure, source rewriting, runtime interception, or a generalized solution for tightly encapsulated agents. If the selected fixture unexpectedly lacks the required callable or instrumentable boundaries, implementation must stop under the existing source-immutability rule rather than broaden the test.

---

## Product question

> Can a developer add Agentbook behavioral testing to an existing TypeScript agent that was not originally written for Agentbook, without rewriting the agent or duplicating its business behavior inside Agentbook?

For Test 08 to pass, the answer must be **Yes**.

The stronger replacement question is:

> If only the pre-existing agent project and packed Agentbook artifacts were copied to another machine, could a developer add thin integration, run Story-authored scenarios through the existing agent, observe its real tool behavior, and see an honest verdict in the UI without the Agentbook repository?

For Test 08 to pass, the answer must also be **Yes**.

---

## Existing-agent definition

Use a separate ordinary TypeScript/Node project in the **Purchase Approval Agent** domain. It must exist and be proven functional before Agentbook packages or files are added.

The pre-existing project must own at least:

```text
purchase-approval-agent/
  package.json
  src/
    agent.ts
    tools.ts
    cli.ts                 # or an equivalent ordinary entry point
  test/                    # optional pre-existing tests
```

Exact filenames are not contractual. The ownership and behavior are.

The agent must expose an ordinary public invocation boundary conceptually equivalent to:

```ts
runPurchaseApprovalAgent({
  instruction,
  purchaseAmount,
  requesterLevel,
  approvalThreshold,
}, tools)
```

Dependency injection for the tool set is permitted because it is a normal pre-existing agent design and enables zero-touch observation. It must exist in the recorded pre-Agentbook baseline; it must not be added after the fact merely to satisfy Agentbook.

The existing agent must:

- have its own source code and executable entry point;
- run successfully without Agentbook installed;
- import nothing from `@agentbook/core` or `@agentbook/cli`;
- contain no Agentbook vocabulary or conditional behavior;
- expose all three actions `lookup_purchase_policy`, `create_purchase_order`, and `request_purchase_approval` through its normal tool boundary;
- make the approval-versus-purchase decision inside the existing agent implementation;
- return an ordinary domain outcome suitable for its own non-Agentbook caller.

Required correct behavior:

```text
always lookup_purchase_policy

if purchaseAmount > approvalThreshold:
  request_purchase_approval
  do not create_purchase_order
else:
  create_purchase_order
```

`requesterLevel` must be accepted and propagated as real scenario context even if the minimum deterministic policy does not branch on it. The fixture must not add an artificial branch solely to make that field appear meaningful.

The original agent source must contain no `Story`, `ObservedRun`, `EvaluationResult`, matcher, Agentbook-specific import, Agentbook-specific environment check, or `if (runningUnderAgentbook)` behavior.

---

## Pre-Agentbook baseline

The baseline must be captured before installing either Agentbook artifact or creating any Agentbook file.

Required baseline procedure:

1. Create or copy the ordinary purchase-approval project to a canonical directory outside the Agentbook repository.
2. Record the project tree, package manifest, lockfile state, TypeScript/runtime configuration, and complete imports from original agent source files.
3. Record SHA-256 hashes and line counts for every original agent source file.
4. Search the project and prove that no Agentbook package, file, type, identifier, or configuration is present.
5. Run the agent through its ordinary pre-Agentbook entry point for both scenarios:
   - `purchaseAmount = 500`, `approvalThreshold = 100` produces the approval path;
   - `purchaseAmount = 50`, `approvalThreshold = 100` produces the purchase path.
6. Capture the actual tool invocations, inputs, outputs, order, final domain result, exit status, and absence of external side effects for both baseline executions.
7. Prove that all three tools were available in both executions, including the tool that should not be called in each branch.
8. Preserve a byte-for-byte copy or cryptographic manifest of the original source before Agentbook integration.

The pre-Agentbook proof must not use Agentbook helpers, Agentbook wrappers, an Agentbook test harness, or a preassembled tool trace.

---

## Architecture under test

```text
Story A or Story B
  |  structured authored GIVEN + authored prompt
  v
TypeScript adapter binds the native Story to one profile
  |
  v
thin consumer-owned integration profile
  |  map Story.given -> existing agent input
  |  map existing tool interface -> callTool instrumentation
  v
pre-existing runPurchaseApprovalAgent(...)
  |
  |  existing branching and policy
  v
actual calls to pre-existing tool handlers
  |
  v
TypeScript adapter trace -> canonical ObservedRun
  |
  v
unchanged generic Evaluator -> EvaluationResult
  |
  v
unchanged generic UI
```

The current public core boundary is intentionally reused:

```ts
profile.execute({
  story,
  callTool,
})
```

The TypeScript adapter already owns native module loading, binding of a Story to an execution profile, tool invocation recording, and canonical `ObservedRun` construction. Test 08 must use that boundary where sufficient. It must not introduce a new Runner architecture, a second execution engine, a new transport, or a domain-specific adapter.

Responsibility remains separated as follows:

| Component | Owns | Must not own |
| --- | --- | --- |
| Story | Authored GIVEN context, user instruction, and declarative expectations | Agent decisions, expected trajectory, observations, or verdicts |
| Existing agent | Purchase policy flow and the decision to approve or create | Agentbook types, matchers, instrumentation, or verdicts |
| Existing tools | Actual deterministic local action behavior | Expected Story result or fabricated trace |
| Integration profile | Input translation, tool adaptation/instrumentation, agent invocation, output translation | Purchase threshold branching, expected call order, policy decisions, or fixture-specific pass logic |
| TypeScript adapter | Load native files, invoke profile/tools, record actual calls, construct canonical `ObservedRun` | Evaluate matchers or reimplement the agent |
| Generic engine | Orchestrate `ExecutionRequest -> Runner -> ObservedRun -> Evaluator` | Understand native agent functions or purchase policy |
| Evaluator | Apply generic matcher semantics | Execute the agent/tools or branch on fixture identity |
| UI | Render project, Story, `ObservedRun`, and `EvaluationResult` | Execute policy, infer missing evidence, or calculate verdicts |

---

## Existing-agent ownership boundary

The original project owns all domain behavior before and after integration:

- purchase threshold comparison;
- selection of approval versus purchase path;
- ordering of tool calls;
- tool argument construction;
- domain-specific final response/decision;
- deterministic local tool implementations.

Agentbook-specific files may import the existing agent's documented public entry point and tool types/registry. Original agent files must not import Agentbook-specific files.

The integration profile may name and expose existing tools because instrumentation requires a stable mapping. This mapping is glue only if each profile tool delegates to the corresponding original tool implementation and the agent decides when to invoke it.

The following are allowed:

```text
Story.given -> distinguish structured form -> validate known fields -> existing agent input
Story prompt -> existing agent instruction/message
existing tool interface -> callTool(name, input)
profile tool definition -> existing tool handler
existing agent outcome -> { decision, finalResponse }
```

The following are forbidden:

```text
if purchaseAmount > approvalThreshold inside the profile
calling approval tools because the Story expects them
calling purchase tools because a particular Story ID was selected
a static expected tool list or preassembled ObservedRun
separate profile implementations for the high and low scenarios
an Agentbook-owned copy of purchase policy or tool business behavior
```

Static source inspection and mutation testing must prove that removing or bypassing the existing agent invocation makes the Test 08 integration fail rather than silently preserving the expected behavior.

---

## Story-driven input requirement

**The Story's authored GIVEN is the sole source of scenario data supplied to the existing agent.**

No parallel `scenario` property or profile-side copy of GIVEN values may exist.

Use two Stories bound to the same profile:

| Story | Structured `given` | Expected existing-agent branch |
| --- | --- | --- |
| High-value purchase | `purchaseAmount: 500`, `requesterLevel: "employee"`, `approvalThreshold: 100` | approval |
| Low-value purchase | `purchaseAmount: 50`, `requesterLevel: "employee"`, `approvalThreshold: 100` | purchase |

Both Stories use the same WHEN value or another clearly recorded instruction accepted by the existing agent, such as `Purchase this item.` Both must use the same integration profile ID.

The test must prove causality, not just differing outcomes:

- capture each Story's structured `given` before execution;
- capture the exact input received by the existing agent entry point;
- prove field-for-field equality after the documented mapping;
- change only Story GIVEN data between the two authored Stories;
- do not edit or select a different profile;
- observe the existing agent take different branches;
- prove the profile contains no independent copies of `500`, `50`, or `100` and no Story-ID branch.

A separate manual copy of GIVEN values in a `scenario` property, profile, environment, tool fixture, test harness, or CLI arguments fails this requirement.

---

## GIVEN representation decision

### Evaluation of legacy-only `given: string[]`

The current public `Story` contract exposes `given: string[]`. It is sufficient for display and human-readable context, but it is not sufficient as the only safe typed input boundary for Test 08.

Using strings such as:

```text
purchaseAmount: 500
requesterLevel: employee
approvalThreshold: 100
```

would require the integration profile to parse arbitrary human-authored strings, invent rules for delimiters, whitespace, duplicate keys, numbers, booleans, quoting, and invalid values, and then cast the result to the existing agent input. That parsing would be fragile and would silently turn presentation text into business-critical typed input. A fixture-specific parser would also make the profile thicker and easier to cheat.

Therefore the legacy-only representation is insufficient for Test 08. The implementation must not split strings on `:` or use another undocumented convention merely to pass the fixture.

### Accepted architecture decision — extend GIVEN additively

GIVEN remains the product's single scenario/context boundary. The public authoring API must accept either the existing legacy string list or a structured record directly on `given`. A separate `scenario`, `input`, `givenData`, or equivalent competing scenario property must not be introduced.

After inspecting the current public API, the smallest accepted public type delta is:

```ts
export type StoryGivenValue =
  | string
  | number
  | boolean
  | null
  | readonly StoryGivenValue[]
  | { readonly [key: string]: StoryGivenValue }

export type StoryGiven =
  | string[]
  | Readonly<Record<string, StoryGivenValue>>

type StoryInput = {
  // existing fields
  given?: StoryGiven
}

type Story = {
  // existing fields
  given: StoryGiven
}
```

`StoryGivenValue` and `StoryGiven` are the selected names because they align the new capability with the existing public `Story`/`StoryInput` vocabulary and add only the types required by consumers and integration profiles.

The exact root-package API delta is therefore:

1. add public type exports `StoryGivenValue` and `StoryGiven` from `@agentbook/core`;
2. widen `StoryInput.given` from `string[] | undefined` to `StoryGiven | undefined`;
3. widen `Story.given` from `string[]` to `StoryGiven`;
4. leave `defineStory()` name, call shape, prompt/WHEN union, expectation/`then` union, execution capability, and all other public exports unchanged;
5. add no `scenario` property and no new Runner, Evaluator, adapter, or UI type to the core package.

The CLI's internal native Story and `StoryDescriptor` representations must mirror the widened GIVEN union so structured data is not erased at discovery. Those are internal propagation changes, not additional public core exports.

The only field widening is:

```text
StoryInput.given: string[] | structured GIVEN
Story.given:      string[] | structured GIVEN
```

No normalization may replace structured GIVEN with display strings before execution. The bound native Story passed to `profile.execute({ story, callTool })` must retain the structured record so the profile can narrow, validate, and map it without parsing. Generic project descriptors must likewise preserve enough typed structure for Story immutability checks and deterministic UI rendering.

Required runtime behavior:

- `defineStory()` continues to default omitted `given` to `[]`;
- `Array.isArray(story.given)` distinguishes the legacy form from the structured form;
- a structured GIVEN must be a non-null, non-array plain record;
- structured values are recursively validated before the Story is accepted;
- functions, symbols, `undefined`, `bigint`, `NaN`, positive or negative infinity, cyclic objects, class instances, dates, maps, sets, and other non-JSON values are rejected with an actionable error;
- structured GIVEN remains structurally cloneable, serializable, and unchanged through discovery, execution, evaluation, and UI rendering;
- the profile must explicitly reject the legacy array form when the Purchase Approval integration requires structured GIVEN, rather than attempting to parse it;
- legacy arrays continue to be rendered in authored order with unchanged text;
- structured records are rendered as key/value GIVEN rows in authored object key order wherever JavaScript object semantics preserve that order, without mutating the authored object;
- canonical evidence, hashing, and equality checks may use a separate deterministic canonical key ordering internally, but that ordering must not reorder the developer-facing GIVEN panel;
- nested arrays and records render through deterministic JSON-compatible serialization, with strings rendered as values rather than reparsed syntax.

The public type and runtime implementation must preserve:

- serializable, cloneable Story data;
- deterministic display ordering;
- Story immutability;
- Test 01–07 Story compatibility;
- safe rejection of unsupported values such as functions, symbols, cyclic objects, `undefined`, `NaN`, and infinities;
- no automatic natural-language parsing;
- availability of structured GIVEN on the existing bound `story.given` passed to `profile.execute({ story, callTool })`;
- no export of Runner/Evaluator/UI internals from `@agentbook/core`.

Both Purchase Approval Stories must author the accepted form directly:

```ts
given: {
  purchaseAmount: 500,
  requesterLevel: 'employee',
  approvalThreshold: 100,
}
```

and:

```ts
given: {
  purchaseAmount: 50,
  requesterLevel: 'employee',
  approvalThreshold: 100,
}
```

The same profile consumes `story.given` in both cases. No parallel scenario object, derived fixture constant, or duplicate profile-side values are permitted.

---

## WHEN propagation

The Story's authored `prompt`/`when` value must be passed unchanged to the existing agent's user-instruction/message input.

Required evidence:

- canonical Story prompt before execution;
- the exact instruction received by the existing agent entry point;
- equality between those values;
- source inspection proving the profile contains no separate hardcoded `Purchase this item.` copy;
- a negative proof in which changing only the Story WHEN changes the instruction received by the existing agent without editing the profile.

The negative proof need not change the agent's branch if the deterministic agent policy does not depend on wording. It exists to prove propagation, not to invent prompt-sensitive behavior.

---

## Thin integration-profile contract

Use one consumer-owned profile for both purchase Stories. Conceptually it may perform only the following operations:

```ts
async execute({ story, callTool }) {
  if (Array.isArray(story.given)) {
    throw new Error('Purchase Approval Stories require structured GIVEN.')
  }
  const input = mapAndValidateGiven(story.given, story.prompt)

  const outcome = await runPurchaseApprovalAgent(input, {
    lookupPurchasePolicy: (args) => callTool('lookup_purchase_policy', args),
    createPurchaseOrder: (args) => callTool('create_purchase_order', args),
    requestPurchaseApproval: (args) => callTool('request_purchase_approval', args),
  })

  return translateOutcome(outcome)
}
```

Its `tools` definitions must delegate to the original project-owned handlers. The code above is illustrative, not a required naming convention.

The profile may:

- distinguish legacy and structured GIVEN and require the structured form for this integration;
- validate that required structured GIVEN fields exist and have the expected primitive types;
- rename fields where the Story schema and existing public agent API use different neutral names;
- pass the Story prompt as the agent instruction;
- adapt camelCase function names to stable Agentbook tool names;
- delegate profile tool execution to original handlers;
- adapt the original agent's ordinary result into `decision` and `finalResponse` strings.

The profile must not:

- compare `purchaseAmount` with `approvalThreshold`;
- decide which tool to call;
- encode expected order, required calls, or prohibited calls;
- inspect Story or expectation IDs to select behavior;
- inspect matchers or descriptions;
- contain high/low fixture values;
- read a parallel `scenario` property or another copy of GIVEN values;
- catch a behavioral regression and suppress its tool call;
- fabricate tool results, tool traces, `ObservedRun`, or verdicts;
- replace the existing agent's tool handlers with no-op handlers that only generate evidence.

### Thin-glue review rule

Every Agentbook-specific executable line must be classified as exactly one of:

```text
INPUT TRANSLATION
INPUT VALIDATION
TOOL ADAPTATION
TOOL INSTRUMENTATION
AGENT INVOCATION
OUTPUT TRANSLATION
```

Any executable line that cannot be honestly classified into one of those categories is presumptively domain logic and fails the thin-glue criterion unless this specification is revised before implementation.

LOC is evidence, not the verdict. A short profile that hides duplicated policy in a helper still fails; a slightly longer profile containing explicit safe validation may pass.

---

## Tool instrumentation

Agentbook must observe actual tool behavior selected by the existing agent.

The profile must expose all three tools:

- `lookup_purchase_policy`;
- `create_purchase_order`;
- `request_purchase_approval`.

All three must remain available in every Run. The prohibited tool must never be removed or disabled to force a passing `tool-not-called` matcher.

Each instrumented tool must:

1. receive the arguments selected by the existing agent;
2. invoke the corresponding original tool handler exactly once;
3. return that handler's actual result to the existing agent;
4. allow the TypeScript adapter's existing `callTool` boundary to record name, arguments, result, operational status, timestamps, and order;
5. perform no network, database, payment, purchasing, approval, or other external side effect.

The adapter must construct `ObservedRun.toolCalls` from the actual invocation trace. Neither the Story, profile, agentbook runtime, nor test harness may provide a preassembled expected trajectory.

The high-value Story must include:

```ts
{
  id: 'does-not-create-purchase-order',
  description: 'Does not create a purchase order before approval',
  matcher: { kind: 'tool-not-called', tool: 'create_purchase_order' },
}
```

It must also require `lookup_purchase_policy` and `request_purchase_approval` with generic `tool-called` matchers.

The low-value Story must require `lookup_purchase_policy` and `create_purchase_order`. It may include `tool-not-called: request_purchase_approval` to prove the opposite branch through the same profile.

---

## PASS regression/fix lifecycle

The authoritative high-value Story must remain byte-for-byte unchanged across all three lifecycle Runs.

### Run 1 — correct existing agent

With the original correct agent implementation:

```text
actual calls:
lookup_purchase_policy
request_purchase_approval

create_purchase_order: available, not called
```

Expected EvaluationResult:

```text
checks-purchase-policy: PASS
requests-purchase-approval: PASS
does-not-create-purchase-order: PASS
overall: PASS
```

### Run 2 — realistic regression in the existing agent only

Modify only the existing agent's behavioral implementation so the high-value branch accidentally calls `create_purchase_order` before requesting approval.

Do not modify:

- either Story;
- the integration profile;
- tool adapters or original tool handler implementations;
- Agentbook packages, Evaluator, or UI;
- authored GIVEN values or prompt.

Expected actual trace:

```text
lookup_purchase_policy
create_purchase_order
request_purchase_approval
```

Expected EvaluationResult:

```text
checks-purchase-policy: PASS
requests-purchase-approval: PASS
does-not-create-purchase-order: FAIL
overall: FAIL
```

The completed Run remains an execution success. The Story evaluation is `FAIL` because observed behavior violates the unchanged expectation.

### Run 3 — fix the existing agent

Restore or correct only the existing agent's behavioral implementation. Run the same unchanged high-value Story again through the same profile.

Expected result: the original conforming trace returns and EvaluationResult is `PASS`.

### Lifecycle invariants

Required lifecycle:

```text
existing agent correct -> PASS
agent implementation regression -> FAIL
agent implementation fixed -> PASS
```

For every Run, separately record:

```text
Test 08 Pipeline Status: PASS | FAIL
Story Evaluation: PASS | FAIL | NOT EVALUATED
```

A faithful middle `Story Evaluation: FAIL` is required evidence and must not make the pipeline status fail. A pipeline failure, fabricated observation, modified Story, or bypassed existing agent must not be reported as a legitimate behavioral regression.

---

## Existing-agent source immutability

The preferred integration result is:

```text
Existing agent source changes during Agentbook integration: 0 lines
```

Measure immutability in two distinct windows:

1. **Integration window:** pre-Agentbook baseline to the first correct Agentbook PASS. Original source should remain byte-for-byte identical.
2. **Regression window:** the deliberate behavioral regression and subsequent fix. These intentional test mutations must be recorded separately and must not be misreported as integration changes.

For the integration window, record:

- every original source path;
- before and after hashes;
- before and after line counts;
- a zero-context or equivalent exact diff;
- total lines added, removed, and modified;
- a direct answer: `Existing agent source changed for integration: YES | NO`.

The fixture should be chosen so its ordinary public entry point and tool dependency boundary permit zero-touch integration. Do not alter original agent source to make Agentbook convenient.

If zero-touch integration proves impossible during implementation:

1. stop before editing an original source file;
2. record the exact blocking source/API boundary;
3. explain why profile-side adaptation cannot safely solve it;
4. propose the smallest generic instrumentation hook with exact lines and ownership;
5. obtain an explicit architecture decision by revising this specification before proceeding.

Silent modification of original source is a Test 08 failure.

---

## Integration-effort measurement

Measure Agentbook adoption honestly from immediately before Agentbook installation until the first completed behavioral Run is validated in the UI.

Record:

- number and paths of Agentbook-specific files added;
- Agentbook-specific physical LOC and logical LOC per file;
- generated versus manually authored LOC;
- all imports added for Agentbook integration;
- original agent LOC modified during integration;
- every manual command, file creation/edit, browser navigation, and click;
- elapsed monotonic time from installation start to first successful completed behavioral Run;
- any documentation consulted or implicit knowledge required;
- whether a process restart was required after edits;
- the thin-glue classification for every executable integration line.

Do not hide required integration code in test utilities, generated artifacts, package scripts, symlinked files, unpublished helpers, or the Agentbook repository. Generated/configuration code counts when it is required in the consumer.

Test 08 does not set an arbitrary maximum LOC or time target. Its qualitative pass criterion is:

> All Agentbook-specific executable code translates, validates, instruments, invokes, or translates output; none of it decides purchase behavior already owned by the existing agent.

The final report must include:

```text
Agentbook-specific files: <number>
Agentbook-specific LOC: <number>
Original agent LOC modified for integration: <number>
Manual integration steps: <number>
Install-to-first-successful-Run time: <milliseconds and human-readable duration>
Thin glue criterion: PASS | FAIL
```

---

## Package/project isolation

The consumer must live outside the Agentbook repository and install only packed npm-compatible artifacts for:

- `@agentbook/core`;
- `@agentbook/cli`.

It must not use workspace aliases, source-checkout imports, repository-relative paths, private fixtures, the internal generated demo registry, a global `agentbook` binary, or symlinks into Agentbook source.

### Existing-project initialization decision

The current Test 07 `agentbook init` always creates the Access Request starter. Running it unchanged would contaminate the existing purchase-agent project and violate Test 08's no-starter requirement.

**Accepted architecture decision: add one minimal non-interactive existing-project mode:**

```text
agentbook init --existing
```

This mode should:

- resolve and validate the current project exactly as current `init` does;
- preflight all intended writes;
- create only `agentbook.config.mjs` with the standard Agent, Story, and execution directories;
- create no Access Request Agent, Story, profile, or tools;
- modify no existing `package.json`, source, TypeScript, loader, or module-system configuration;
- preserve current atomic conflict safety and actionable errors;
- be idempotent when the generated config is unchanged;
- print concise next steps explaining that the developer must add an Agentbook Agent descriptor, Story, and thin execution profile for their existing agent.

It must not inspect or rewrite the existing agent, infer tools, generate policy code, ask the developer to choose an adapter, or create a broad project-migration framework.

The ordinary starter-producing `agentbook init` remains unchanged and must continue to satisfy Test 07. The two modes are explicit and non-overlapping:

| Command | Required output |
| --- | --- |
| `agentbook init` | Existing Test 07 configuration plus Access Request starter files |
| `agentbook init --existing` | Minimal configuration only; no Agent, Story, profile, tools, or application-source edits |

The ordinary starter-producing command must not be run and then cleaned up as part of Test 08; that would manipulate effort metrics and obscure product behavior.

The Agentbook-specific consumer files are expected to be conceptually:

```text
agentbook.config.mjs
agents/purchase-approval.agent.ts
stories/purchase-approval.agent.stories.ts
execution/purchase-approval.profile.ts
```

This expected set is not a hard file-count target. Any additional required integration file must be counted and justified.

The TypeScript adapter must load the project through the packed CLI's declared capability, with no consumer loader configuration or repository access. Both Stories must bind to the same profile.

---

## UI validation

Start the packed CLI from the existing consumer project and validate the current developer UI without redesigning it.

The UI must show:

- the existing consumer project's configured name;
- only the Purchase Approval Agent and its Stories for this project;
- no Access Request starter, refund, travel, invoice, or internal demo project;
- the high- and low-value Story names and source paths;
- authored GIVEN data in a deterministic readable form;
- the authored WHEN prompt;
- every expectation description;
- actual tool calls from `ObservedRun`, including arguments, results, operational status, count, and order;
- assertion verdicts and overall result exactly from `EvaluationResult`;
- `PASS`, then `FAIL`, then `PASS` for the unchanged high-value Story across the required lifecycle when each completed record is viewed immediately after its Run.

The UI is code-first and read-only in Test 08. Because manual dogfooding showed that this is not sufficiently explicit, the test report must record the finding, but Test 08 must not redesign the UI unless a minimal clarification becomes strictly necessary to perform the acceptance flow.

Browser validation must compare structured UI evidence with the API execution record. Screenshots may support but cannot replace equality checks.

Because the current server does not hot-reload authoring/profile code and a previously open tab may show stale evidence after restart, the lifecycle harness must avoid ambiguous evidence by:

- stopping and restarting `agentbook dev` when required by current behavior;
- loading a fresh page after each restart;
- recording the process/port and execution ID for every Run;
- validating the current `/api/project` and `/api/run` payloads before accepting visible evidence.

These are test-control measures, not fixes. Hot reload, stale-run invalidation, and Run history remain out of scope.

---

## Security/offline requirements

Test 08 must be deterministic, local, offline, and side-effect-free.

It must not require or contact:

- an LLM provider or gateway;
- an API key or provider credential;
- npm registry after local artifact inputs are available;
- a purchasing, approval, ERP, payment, database, authentication, telemetry, or cloud service.

The existing tools must be realistic local implementations that return deterministic fixture results. They must never create a real purchase order or approval request.

The server must bind to loopback by default. Browser traffic must remain same-origin and contain no secrets. Packed artifacts and consumer integration files must be scanned for repository paths, credentials, environment files, private fixtures, prohibited endpoints, and unexpected source leakage without printing any real secret value.

Normal repository tests must remain offline and provider-free. Test 03–04's opt-in real-provider capability must remain intact but is not invoked as part of Test 08.

---

## Regression requirements

Tests 01–07 must remain passing without weakened assertions.

In particular, preserve:

- convention-based Story discovery and code-first source of truth;
- verdict-free Story expectations;
- `Story -> Runner -> ObservedRun -> Evaluator -> EvaluationResult` separation;
- generic `tool-called` and `tool-not-called` matcher semantics;
- Story identity and canonical immutability across execution/evaluation;
- real-provider capability and server-only credentials from Tests 03–04;
- UI fidelity to one completed execution record;
- external consumer ownership from Test 05;
- packed `@agentbook/core` isolation and deliberate public exports from Test 06;
- the language-adapter boundary and zero-config TypeScript loading from Test 07;
- current Test 07 starter onboarding and `agentbook init` behavior when `--existing` is absent;
- deterministic offline normal tests.

The structured GIVEN capability must be covered by compatibility tests proving existing `given: string[]` Stories remain unchanged. The accepted existing-project init mode must be covered independently from the Test 07 starter mode so neither path weakens the other.

Required final gates include the repository's standard equivalents of:

```bash
npm run typecheck
npm test
npm run test:package
npm run test:onboarding
npm run build
git diff --check
```

The Test 08 artifact-only integration and browser lifecycle must have its own dedicated command or clearly isolated test phase. It must not make ordinary `npm test` network-dependent.

---

## Acceptance criteria

Test 08 may be marked `PASS` only when every criterion is satisfied:

- [x] The status was changed from specification-only only after implementation and evidence collection completed.
- [x] Tests 01–07 remain passing without weakened contracts.
- [x] The purchase-approval project existed outside the Agentbook repository before Agentbook installation.
- [x] The pre-Agentbook project had its own source, public invocation boundary, behavior, and at least three available tools/actions.
- [x] The pre-Agentbook agent ran both high- and low-value scenarios successfully without Agentbook.
- [x] Original agent source contained no Agentbook imports, types, vocabulary, conditionals, or configuration.
- [x] Pre-integration hashes, LOC, imports, project tree, and execution traces were recorded.
- [x] Only packed `@agentbook/core` and `@agentbook/cli` artifacts were installed.
- [x] No workspace, source checkout, symlink, private fixture, generated demo registry, repository-relative import, or global binary was used.
- [x] `agentbook init --existing` created only the minimal Agentbook configuration and printed concise integration next steps.
- [x] Existing-project initialization created no Test 07 Access Request starter content.
- [x] Normal `agentbook init` preserved the Test 07 starter behavior unchanged.
- [x] Both init modes preserved atomic preflight, idempotency, conflict safety, and existing project/package/module/TypeScript files.
- [x] The accepted structured GIVEN union was implemented explicitly and safely on the existing `given` field.
- [x] No parallel `scenario`, `input`, `givenData`, or equivalent competing scenario property exists.
- [x] No arbitrary human GIVEN string parsing supplies typed business input.
- [x] Existing `given: string[]` Stories remain backward compatible.
- [x] Structured GIVEN data remains serializable, cloneable, immutable, and safely validated.
- [x] Unsupported structured GIVEN values are rejected recursively with actionable errors.
- [x] The UI renders both legacy and structured GIVEN deterministically.
- [x] Two Stories with different structured GIVEN values use one thin execution profile.
- [x] The Story's authored GIVEN is the sole source of scenario data supplied to the existing agent.
- [x] Changing only Story GIVEN changes the exact input received by the existing agent without editing the profile.
- [x] Story WHEN is passed unchanged to the existing agent instruction/message input.
- [x] Changing only WHEN changes the received instruction without editing the profile.
- [x] The profile invokes the existing agent's public entry point.
- [x] The profile contains no purchase-threshold comparison, branch selection, policy decision, expected trajectory, or Story-ID/expectation-ID behavior.
- [x] Every Agentbook-specific executable line passes the thin-glue classification.
- [x] The original project owns every purchase-domain decision and tool implementation.
- [x] All three tools remain available in every execution.
- [x] The adapter observes calls selected by the existing agent through actual original tool-handler invocation.
- [x] Tool arguments, handler-produced results, statuses, count, and order exactly match `ObservedRun`.
- [x] No expected trace, preassembled `ObservedRun`, fabricated call, or no-op evidence handler is used.
- [x] `ObservedRun` contains execution facts and no behavioral verdicts.
- [x] The unchanged generic Evaluator alone creates per-expectation and overall verdicts.
- [x] The UI displays the external Purchase Approval Agent and Stories without starter/demo contamination.
- [x] The UI renders actual `ObservedRun` and `EvaluationResult` evidence faithfully.
- [x] The first unchanged high-value Story Run evaluates to `PASS`.
- [x] A regression introduced only in existing agent behavior makes the unchanged Story evaluate to `FAIL`.
- [x] The failing `ObservedRun` contains the prohibited `create_purchase_order` call.
- [x] Fixing only existing agent behavior makes the same unchanged Story evaluate to `PASS` again.
- [x] The high-value Story remains byte-for-byte and canonically unchanged across all three lifecycle Runs.
- [x] The profile, tools, authored GIVEN, expectations, Evaluator, and UI remain unchanged across the lifecycle.
- [x] Each lifecycle Run reports pipeline status separately from Story evaluation.
- [x] Integration changes to original agent source total zero lines.
- [x] If zero-touch integration was impossible, implementation stopped and this specification was explicitly revised before any original-source change.
- [x] Agentbook-specific file count, LOC, original LOC modified, manual steps, and elapsed integration time were measured honestly.
- [x] No integration code or effort was hidden in test-only or repository-owned machinery.
- [x] The entire Test 08 flow remained offline, deterministic, local, and side-effect-free.
- [x] Required package, typecheck, offline test, onboarding, build, browser, and diff gates passed.

---

## PASS/FAIL checklist

Mark Test 08 `PASS` only when every answer is **Yes**:

- [x] Did the agent demonstrably exist and run before Agentbook?
- [x] Does original agent source still know nothing about Agentbook?
- [x] Were original agent source changes for integration exactly zero lines?
- [x] Is the Story's authored GIVEN the sole source of scenario data supplied to the existing agent?
- [x] Is there no parallel `scenario` property or profile-side copy of GIVEN values?
- [x] Do two different Stories drive two different existing-agent inputs through the same profile?
- [x] Does the profile contain only validation, translation, instrumentation, invocation, and output adaptation?
- [x] Does the existing agent, rather than the profile, choose the approval or purchase branch?
- [x] Are all tools available while only actual selected calls are observed?
- [x] Do observed calls invoke original handlers and populate `ObservedRun` from real execution facts?
- [x] Does the Evaluator alone determine PASS/FAIL from generic matchers?
- [x] Does the UI show the isolated existing project and faithfully render the completed record?
- [x] Does the unchanged high-value Story produce the required `PASS -> FAIL -> PASS` lifecycle when only existing agent behavior regresses and is fixed?
- [x] Were packed artifacts and project isolation used without Agentbook repository access?
- [x] Did `agentbook init --existing` create only minimal configuration while normal `agentbook init` retained its Test 07 starter contract?
- [x] Were integration effort and source immutability measured without hiding work?
- [x] Did the flow remain offline, deterministic, safe, and compatible with Tests 01–07?

If any answer is **No**, Test 08 is `FAIL`.

The following combination is required for the middle lifecycle Run and is not itself a Test 08 failure:

```text
Test 08 Pipeline Status: PASS
Story Evaluation: FAIL
```

---

## Required evidence

The implementation report must include:

1. canonical Agentbook repository root and external consumer root;
2. proof the consumer root is outside the Agentbook repository;
3. complete pre-Agentbook project tree, package metadata, TypeScript/runtime configuration, and import list;
4. pre-Agentbook hashes and LOC for every original agent source file;
5. pre-Agentbook source scan proving no Agentbook references;
6. ordinary pre-Agentbook commands and successful high/low execution evidence;
7. all tools available and exact baseline invocation traces for both branches;
8. packed artifact filenames, hashes, manifests, relevant metadata, and installed resolution paths;
9. proof installed Agentbook packages/binary are not workspace links, symlinks, global tools, or source paths;
10. exact `agentbook init --existing` command, complete output, created-file manifest, idempotency/conflict evidence, and comparison with unchanged normal `agentbook init` behavior;
11. generated/manual Agentbook-specific project tree and complete file contents;
12. accepted structured GIVEN architecture decision and exact public type/API delta;
13. backward-compatibility results for existing `given: string[]` Stories;
14. invalid structured GIVEN rejection results, including functions, symbols, `undefined`, non-finite numbers, cycles, and non-JSON objects;
15. discovered Agent, both Stories, source paths, and shared profile binding;
16. canonical Story snapshots and hashes;
17. exact structured `Story.given`-to-agent-input comparison for both Stories;
18. exact Story WHEN-to-agent-instruction comparison and changed-WHEN propagation proof;
19. source review proving no parallel `scenario` property, copied GIVEN constants, domain branch, expected trajectory, or fixture-ID behavior in the profile;
20. thin-glue line classification and totals;
21. proof profile tools delegate to original handlers;
22. complete tool availability list for every Run;
23. original handler invocation records with arguments, results, statuses, and order;
24. complete non-sensitive `ObservedRun` for high-value PASS, regression FAIL, fixed PASS, and low-value branch proof;
25. recursive proof every `ObservedRun` is free of behavioral verdicts;
26. complete `EvaluationResult` for every recorded Run;
27. one-to-one comparisons between tool traces and `ObservedRun`;
28. one-to-one comparisons between `EvaluationResult` and UI assertions/overall result;
29. source/diff proof that only existing agent behavior changed for the regression and fix;
30. byte-for-byte proof the high-value Story and integration profile did not change across the lifecycle;
31. original-source before/after hashes and exact integration-window LOC delta;
32. separate regression-window diff and restoration/fix evidence;
33. Agentbook-specific file count and per-file physical/logical LOC;
34. enumerated manual integration actions and elapsed monotonic time;
35. UI project identity and absence of Access Request/internal demo contamination;
36. browser request log, console log, overlay check, fresh-page/restart evidence, and supporting screenshots;
37. offline/network-denial and zero-external-side-effect evidence;
38. searches proving no Purchase Approval-specific policy or fixture logic entered Agentbook packages, generic engine, Evaluator, or UI;
39. second-location artifact-only smoke evidence;
40. Test 01–07 regression results and all required final quality gates;
41. final fields:

```text
Test 08 Execution Status: PASS | FAIL
Existing Agent Ran Before Agentbook: YES | NO
Existing Agent Source Changed For Integration: YES | NO
Original Agent LOC Modified For Integration: <number>
Agentbook-Specific Files: <number>
Agentbook-Specific LOC: <number>
Manual Integration Steps: <number>
Install-to-First-Successful-Run Time: <milliseconds and human-readable duration>
Structured GIVEN Boundary: PASS | FAIL
Thin Glue Criterion: PASS | FAIL
Lifecycle: PASS -> FAIL -> PASS | INCOMPLETE
Artifact-Only Replacement Answer: YES | NO
```

### Validated implementation evidence — 2026-08-29

The executable evidence collector is `tests/bring-your-own-agent.integration.mjs`. It emits the complete non-secret `TEST08_EVIDENCE` record and asserts each comparison before reporting `PASS`. The committed record below uses canonical placeholders for temporary machine paths as required by this specification.

1. **Isolation and pre-existence:** repository root was the canonical Agentbook checkout; consumer root was a newly created OS temporary directory outside that checkout. Before Agentbook installation its complete tree was `package.json`, `src/agent.ts`, `src/tools.ts`, and `src/cli.ts`. The package was private ESM with no `tsconfig.json`, dependency, Agentbook reference, or generated configuration; Node executed its `.ts` entry point directly.
2. **Original source baseline:** `src/agent.ts` was 26 physical LOC with SHA-256 `92f5d8c77b7190e894b42253033f9981e3bc322018c7fbe1fdad1a0b389c8711`; `src/tools.ts` was 11 LOC with `eb2ac0348fd50c15d3e005c66899970124a368d0bc2a9d7f3d1d16cb70a83053`; `src/cli.ts` was 30 LOC with `3a7b5edd2b3cc552d649966b007e3ac922270301b09a2392503218d1eb561061`. Imports were only `./agent.ts` and `./tools.ts`. A source scan found no Agentbook vocabulary.
3. **Pre-Agentbook execution:** the ordinary CLI ran both branches before installation. Amount `500`, threshold `100`, and level `employee` invoked `lookup_purchase_policy -> request_purchase_approval`; amount `50` invoked `lookup_purchase_policy -> create_purchase_order`. All three tool handlers were available in both runs and returned local deterministic values.
4. **Packed artifacts:** `agentbook-core-0.0.0-test.6.tgz` SHA-256 was `760e4c675fe29462e52aadee3c1ac1023155dfd0873d9d7b3b0cce87cdb94a31`; its manifest was `README.md`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.js`, and `package.json`. `agentbook-cli-0.0.0-test.7.tgz` SHA-256 was `9ce41b0c96133b71100a5441778bfea5d32532ed2ba57131b2bd0d44462900ad`; its manifest contained only the published README, package metadata, compiled CLI/adapter/server/engine/evaluator/contracts/templates modules, and static runtime assets. Offline installation resolved both packages and the binary inside consumer-owned `node_modules`; assertions rejected repository paths, workspace links, and package symlinks.
5. **Existing-project initialization:** `agentbook init --existing` created only `agentbook.config.mjs`, preserved `package.json` and original sources, and printed the next steps to add an Agent descriptor, Stories, a thin profile, and run `npx agentbook dev`. A second run changed nothing. A conflicting owned config caused an atomic `INIT_CONFLICT` with the file hash preserved. The normal `agentbook init` control still created the four Test 07 Access Request starter files.
6. **Public API delta:** `@agentbook/core` now exports recursive `StoryGivenValue` and `StoryGiven`; `StoryInput.given` is widened from `string[] | undefined` to `StoryGiven | undefined`, and `Story.given` from `string[]` to `StoryGiven`. No `scenario` property exists. Runtime validation recursively rejects functions, symbols, `undefined`, `NaN`, infinities, sparse arrays, cycles, accessors, class/non-plain instances, and symbol-keyed objects before cloning and deep-freezing accepted structured data.
7. **Backward compatibility and display:** all legacy Tests 01–07 continued to author and receive `given: string[]` unchanged. Dedicated structured-GIVEN tests passed for authored-order preservation, immutability, serializability, invalid-value rejection, and absence of a parallel scenario property. The developer UI uses JavaScript object enumeration order for its structured GIVEN panel (`purchaseAmount`, `requesterLevel`, `approvalThreshold`); internal evidence may canonicalize independently.
8. **Integration files and effort:** Agentbook-specific files were `agentbook.config.mjs` (6 physical/6 logical LOC), Agent descriptor (8/7), two-Story file (40/38), and one shared profile (38/36): 4 files, 92 physical LOC, 87 logical LOC. Original source modified for integration: 0 files and 0 LOC. Seven manual actions were counted. Offline install through the first successful high-value execution took `997.679583 ms` (about `1.00 s`) in the final evidence run.
9. **Structured GIVEN and WHEN causality:** high GIVEN `{purchaseAmount: 500, requesterLevel: 'employee', approvalThreshold: 100}` and low GIVEN `{purchaseAmount: 50, requesterLevel: 'employee', approvalThreshold: 100}` flowed through the same profile. The captured existing-agent/tool inputs matched the authored values and selected different branches. A separate changed-WHEN probe authored `Purchase this item urgently.`, observed that exact instruction in the agent's final response, kept the profile hash unchanged, and restored the Story before the lifecycle.
10. **Thin profile review:** every executable profile line classified as input validation, input translation, tool adaptation/instrumentation, agent invocation, or output translation. Static assertions found no threshold comparison, `500`/`50`/`100` constants, matcher or expectation inspection, Story-ID branch, scenario property, copied GIVEN values, or purchase-policy implementation. Each exposed tool delegates to its original handler through `callTool`; the existing agent alone selects order and branch.
11. **Story and profile identity:** the unchanged Story SHA-256 was `263b65be46fc9159f7f4fc7bb38141bf7e8e92806ad1ddb732842c9a0fbd2b41`; the profile SHA-256 was `bf06b756f8901af6dba73991789194feb0ef19e23923f8a75058d67515c4d234`. Both hashes remained identical across initial PASS, agent-only regression FAIL, and agent-only fixed PASS.
12. **Lifecycle evidence:** initial high-value trace was `lookup_purchase_policy -> request_purchase_approval`, with all three expectations PASS and overall PASS. The regression changed only `src/agent.ts`; its trace was `lookup_purchase_policy -> create_purchase_order -> request_purchase_approval`, so `does-not-create-purchase-order` alone failed and the overall evaluation was FAIL while pipeline status remained completed/PASS. Restoring only `src/agent.ts` restored its original hash and the original 2-call trace, 3/3 expectations, and overall PASS. The low-value branch independently remained PASS with `lookup_purchase_policy -> create_purchase_order`.
13. **Observed/evaluated/UI fidelity:** recursive checks found no PASS/FAIL verdict field or value in any `ObservedRun`. Tool arguments, handler outputs, statuses, count, and order were the trace source; the generic Evaluator alone produced per-expectation and overall verdicts. Browser evidence showed the isolated Purchase Approval project with no Access Request content, structured keys in authored order, and exact UI states `3/3 PASS -> 2/3 FAIL -> 3/3 PASS`. The regression view displayed the prohibited call. Each fresh page made only successful local `/api/project` and `/api/run` requests; all three browser console checks reported zero messages, no error overlay, and no visible secret pattern. Screenshots are `output/playwright/test08-initial-pass.png`, `output/playwright/test08-regression-fail.png`, and `output/playwright/test08-fixed-pass.png`.
14. **Safety, portability, and leakage:** package install used `--offline`; execution used deterministic local handlers and produced no external side effect. A second temporary consumer installed only the same tarballs and passed the high-value Story. Static scans and package-boundary tests found no Purchase Approval policy in the generic engine, Evaluator, product UI, or published packages.
15. **Final gates:** `npm run test:package`, `npm run build`, `npm run typecheck`, `npm test` (21/21), `npm run test:onboarding`, `npm run test:existing-agent`, browser acceptance, and `git diff --check` all passed. The production build retained one pre-existing webpack dynamic-require warning in `external-project-loader.server.ts` and completed successfully.

```text
Test 08 Execution Status: PASS
Existing Agent Ran Before Agentbook: YES
Existing Agent Source Changed For Integration: NO
Original Agent LOC Modified For Integration: 0
Agentbook-Specific Files: 4
Agentbook-Specific LOC: 92 physical / 87 logical
Manual Integration Steps: 7
Install-to-First-Successful-Run Time: 997.679583 ms (about 1.00 s)
Structured GIVEN Boundary: PASS
Thin Glue Criterion: PASS
Lifecycle: PASS -> FAIL -> PASS
Artifact-Only Replacement Answer: YES
```

Evidence contains no real secret values, authorization headers, or environment dump. Temporary roots remain represented canonically in this committed record.

---

## Failure conditions

Test 08 fails if any of the following occurs:

- the purchase agent is created only after Agentbook integration or cannot run beforehand;
- original agent source imports Agentbook or contains Agentbook-specific behavior;
- original agent source is silently modified to expose a convenient integration hook;
- the integration profile reimplements the threshold comparison, approval decision, purchase decision, tool order, or final policy;
- a helper imported only by the profile hides duplicated domain behavior;
- separate profiles hardcode the high- and low-value scenarios;
- a parallel `scenario`, `input`, `givenData`, or equivalent scenario source is introduced alongside `given`;
- GIVEN values are copied into the profile, environment, test harness, or CLI arguments;
- arbitrary `given` strings are parsed into typed business input through an undocumented convention;
- Story WHEN is hardcoded separately in the profile;
- a Story ID, expectation ID, matcher, or description controls execution;
- the existing agent entry point is not actually invoked;
- an Agentbook-owned substitute agent produces the observed behavior;
- original tool handlers are not invoked;
- a static trace, expected trajectory, hardcoded `toolCalls`, or fabricated `ObservedRun` is used;
- the prohibited tool is removed, hidden, disabled, or filtered from observation;
- tool arguments, results, status, count, or order differ between actual handler trace and `ObservedRun`;
- `ObservedRun` contains per-expectation or overall behavioral verdicts;
- Runner, profile, CLI, or UI evaluates Story expectations;
- Evaluator gains Purchase Approval-, project-, Story-, expectation-, prompt-, or tool-specific logic;
- the Story or profile changes between correct, regression, and fix lifecycle Runs;
- the regression is introduced anywhere other than the existing agent behavioral implementation;
- the regression call occurs but is suppressed from `ObservedRun` or UI;
- the middle Run does not evaluate to `FAIL` for `tool-not-called: create_purchase_order`;
- the final fix does not return the unchanged Story to `PASS`;
- Test 07 Access Request starter content is generated, run, or shown as the Test 08 proof;
- `agentbook init --existing` creates anything beyond minimal Agentbook configuration or modifies existing project/package/module/TypeScript files;
- normal `agentbook init` no longer creates the unchanged Test 07 starter or either init mode loses atomic/idempotent conflict safety;
- the UI merges internal demos with the external consumer project;
- workspace/source aliases, private fixtures, repository paths, symlinks, or a global binary enable the flow;
- metrics omit generated/required integration work or count regression edits as integration changes;
- a real LLM, provider, network API, database, purchasing system, payment system, approval system, telemetry service, or real side effect is used;
- the structured GIVEN change breaks existing `given: string[]` Stories or silently accepts unsupported values;
- any Test 01–07 contract or required quality gate is weakened or fails;
- required evidence is missing, inconsistent, or collected outside the defined lifecycle boundaries.

---

## Explicitly out of scope

Test 08 must not:

- rename conceptual EXPECT/`then`/Assertions terminology;
- add a Story editor or make the UI writable;
- redesign the developer UI;
- implement hot reload for Story, profile, or agent edits;
- implement stale-run invalidation;
- add Run history or persistence;
- implement Compare functionality;
- add Python or another language adapter;
- add a subprocess, RPC, JSON-RPC, HTTP, plugin, or generalized remote-execution protocol;
- require or add a real LLM/provider integration for this fixture;
- add authentication, cloud, billing, OKF, CI, GitHub, or telemetry;
- publish packages to npm;
- choose final branding;
- add new matcher kinds beyond current generic `tool-called` and `tool-not-called`;
- infer an existing agent's API or tools automatically;
- generate agent-specific business logic from source analysis;
- create a broad migration framework or multiple new CLI commands;
- fix every manual dogfood finding unless directly required by this acceptance contract;
- implement Test 09.

Known follow-up findings remain recorded: conceptual EXPECT is authored as `then` and displayed as Assertions; code-first/read-only UI intent is not explicit enough; editing currently requires server restart; and an already open tab may show stale Run evidence after restart. Test 08 controls for those limitations without expanding scope to solve them.
