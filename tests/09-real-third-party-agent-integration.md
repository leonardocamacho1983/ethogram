# Test 09: Real Third-Party Agent Integration

## Execution status

**IMPLEMENTED — PASS**

The credential-independent architecture, normalization, UI handling, fixture, public-package integration boundary, offline validation matrix, and opt-in executable harness are implemented. The credential-backed execution completed successfully against the pinned public candidate: the original `getFileContent` handler executed exactly once, both Story expectations evaluated `PASS`, and the candidate remained untouched.

The implemented opt-in command is:

```text
npm run test:third-party-agent
```

Without the required credential it still exits nonzero and reports `Infrastructure status: UNAVAILABLE`, `Story evaluation: NOT EVALUATED`, and `Test 09 execution status: NOT COMPLETE`. It does not reinterpret missing infrastructure as a behavioral failure or invalidate the safely captured successful live evidence.

---

## Objective

Prove that Agentbook can evaluate the real behavior of an untouched third-party TypeScript agent whose framework, rather than Agentbook, owns tool execution.

The selected proof must execute this boundary:

```text
Story-authored GIVEN / WHEN
  -> thin consumer-owned integration profile
  -> existing createGithubAgent(...)
  -> existing ToolLoopAgent.generate(...)
  -> existing framework-owned GitHub tools
  -> framework-native verdict-free execution evidence
  -> TypeScript adapter normalization
  -> canonical verdict-free ObservedRun
  -> unchanged generic Evaluator
  -> EvaluationResult
  -> unchanged UI
```

The third-party factory, agent construction, preset, and tool implementations remain the behavior under test. Agentbook may translate scenario input, configure the public factory, collect public framework evidence, and normalize that evidence. It must not reconstruct the agent or execute a tool again to manufacture observability.

---

## Why this test matters

Tests 07–08 proved a TypeScript language-adapter boundary and adoption into a pre-existing agent with an injectable tool boundary. Test 08's existing agent deliberately routed its tool functions through Agentbook's `callTool()` instrumentation. That is a useful integration shape, but it does not cover a common framework-owned agent architecture.

`vercel-labs/github-tools` creates its GitHub tools inside `createGithubAgent()` and passes them to an AI SDK `ToolLoopAgent`. Normal callers invoke `agent.generate(...)`; the AI SDK dispatches the construction-time tools and returns its own execution evidence. Rebuilding that `ToolLoopAgent` merely to wrap the tools would stop testing the public third-party agent factory. Re-executing calls after completion would create false evidence and repeat side effects.

Test 09 therefore determines whether Agentbook's facts-only observation boundary can accept honest evidence produced by an existing framework while preserving the architecture already proven by Tests 01–08.

---

## Scope and claim limitation

Passing Test 09 proves only that:

- the pinned `vercel-labs/github-tools` `createGithubAgent()` factory can be invoked unchanged;
- its pinned `repo-explorer` `ToolLoopAgent` can execute real read-only GitHub tools through the AI SDK;
- its public model boundary can accept an official deterministic AI SDK mock model;
- its public result/callback evidence can be translated once into a framework-neutral Agentbook evidence contract;
- the TypeScript adapter can normalize that evidence into the same canonical `ObservedRun` consumed by the existing Evaluator and UI.

It does not prove compatibility with every AI SDK version, every `ToolLoopAgent`, streaming agents, client-executed tools, approval-gated tools, durable/workflow agents, MCP tools, every provider, every tool result shape, or every agent framework. It does not prove live-LLM behavioral reliability. The deterministic model controls the trajectory because this test evaluates integration and observation, not model quality.

---

## Third-party candidate and provenance

The selected third-party candidate is:

```text
Repository:  vercel-labs/github-tools
Revision:    0dfd7d6d4bec7863363774401d88ca00d9860faa
Package:     @github-tools/sdk 1.13.0
Factory:     createGithubAgent()
Preset:      repo-explorer
Framework:   Vercel AI SDK ToolLoopAgent
```

Pinned source links:

- [repository](https://github.com/vercel-labs/github-tools/tree/0dfd7d6d4bec7863363774401d88ca00d9860faa)
- [`createGithubAgent()` source](https://github.com/vercel-labs/github-tools/blob/0dfd7d6d4bec7863363774401d88ca00d9860faa/packages/github-tools/src/agents.ts)
- [`repo-explorer` preset](https://github.com/vercel-labs/github-tools/blob/0dfd7d6d4bec7863363774401d88ca00d9860faa/packages/github-tools/src/core/presets.ts)
- [structured GitHub context](https://github.com/vercel-labs/github-tools/blob/0dfd7d6d4bec7863363774401d88ca00d9860faa/packages/github-tools/src/core/context.ts)
- [package metadata](https://github.com/vercel-labs/github-tools/blob/0dfd7d6d4bec7863363774401d88ca00d9860faa/packages/github-tools/package.json)

Reconnaissance SHA-256 values at that revision are:

| Third-party file | SHA-256 |
| --- | --- |
| `packages/github-tools/src/agents.ts` | `91cf674a599d6ecc127fef8492efc18e7e04caa059099e96f2ed21ef00b6d8c3` |
| `packages/github-tools/src/core/presets.ts` | `f4d96687e6c84ee1ad90e10646c13505442229cd9a2ae9522f4dad8a189cc8ca` |
| `packages/github-tools/src/core/context.ts` | `5bb0eb85d353bde3ec86acce59a2c78d7a2fd41e693748a8a25ce149d49a2d90` |
| `packages/github-tools/src/core/token.ts` | `78f8a165cb508ba1f14414348de6a3aa5724eb7d8f27b9ecf153029f154b6932` |
| `packages/github-tools/package.json` | `3e0ad9487133d251683e3d3af6aa2086eb71d9bb4d459ec641549511b69aeef7` |

At the pinned revision, `createGithubAgent()` accepts an injected AI SDK language model and passes other `ToolLoopAgent` settings through, but it creates the selected tools internally with `createGithubTools(...)`. The `repo-explorer` preset exposes 39 read-only tools, including repository, branch, file, tree, pull-request, issue, discussion, label, commit, search, gist, workflow, check, CI-context, and release reads. No write tool is included.

---

## Pre-Agentbook / pre-Agentbook-integration baseline

The specification baseline is Agentbook commit:

```text
d22d9ecd9a6240f040cd1254e5b9ea45d89faaa0
```

The working tree was clean before this specification file was created. Relevant baseline SHA-256 values are:

| Agentbook file | SHA-256 |
| --- | --- |
| `packages/agentbook/index.ts` | `7121e2cfb65f44497c8248ddd268b31d73aef96b5122e944adba37a7bf077890` |
| `packages/cli/src/contracts.ts` | `5a1de0d951a5a417f02db05dd2ad847fb0a8fbf19f87ed0cee64888d3f2f9607` |
| `packages/cli/src/typescript-adapter.ts` | `a1a93154354b78b4adc6ac517849ded9aeea70d148f9be6a8e19c989acf11944` |
| `packages/cli/src/generic-engine.ts` | `4b935e8f4fee6f30d7910d9acd927842191a4848e1a73026d2e7c2c4baca993c` |
| `packages/cli/src/evaluator.ts` | `6107e27536908a7206667bc857474c640ab5a49ba53c27225bcf2bbeb6db27a6` |
| `packages/cli/src/runtime/app.js` | `40b5ff0da84612e8836d8e33fd0ebee5486b2cae656a9bdfecf168489dffbef7` |

Before implementation, the Test 09 harness must independently verify the pinned checkout, package version, source hashes, tool preset membership, and license. It must also record the candidate's successful ordinary public construction/invocation path without Agentbook normalization. No baseline operation may edit the candidate.

The current Agentbook baseline is:

```text
ExternalExecutionProfile.execute(...)
  -> { decision, finalResponse }

TypeScriptAdapter.run(...)
  -> adapter-owned callTool() trace
  -> canonical ObservedRun
```

`@agentbook/core` currently requires every execution profile to expose at least one Agentbook-dispatched tool. `ObservedRun` and `EvaluationResult` are intentionally absent from the public core package.

---

## Product question

> Can Agentbook evaluate the real behavior of an untouched third-party TypeScript agent whose framework, rather than Agentbook, owns tool execution?

The required answer for Test 09 is **Yes**.

The stronger replacement question is:

> Can the pinned third-party project and packed Agentbook artifacts execute the same public `createGithubAgent()` factory, preserve all `repo-explorer` tools, observe the actual framework-owned calls/results without re-execution, and feed the unchanged generic Evaluator and UI without access to Agentbook repository internals?

The required answer is also **Yes**.

---

## Architecture under test

Two execution-observation paths must coexist behind the TypeScript adapter:

```text
Path A — existing intercepted execution

Story
  -> profile.execute({ story, callTool })
  -> Agentbook callTool(...)
  -> Agentbook-recorded invocation facts
  -> availability-aware canonical ObservedRun

Path B — externally observed execution

Story
  -> profile.execute({ story, callTool })
  -> createGithubAgent(...)
  -> ToolLoopAgent.generate({ prompt: story.prompt })
  -> AI SDK executes construction-time GitHub tools
  -> AI SDK result/callback facts
  -> profile translates facts to ExternalExecutionEvidence
  -> TypeScript adapter validates and normalizes evidence
  -> availability-aware canonical ObservedRun
```

Both paths converge before evaluation:

```text
availability-aware canonical ObservedRun
  -> unchanged generic Evaluator
  -> EvaluationResult
  -> unchanged UI
```

The generic engine, Evaluator, and UI must receive no observation-mode flag and no AI SDK-native value. Canonical `ObservedRun` means facts actually observed during execution, not a structure whose fields are filled with invented placeholders.

---

## Existing intercepted-observation path

Path A is the boundary proven by Tests 05, 07, and 08:

```text
profile
  -> callTool(name, input)
  -> adapter dispatches profile.tools[name].execute(...)
  -> adapter records actual input, output/error, order, and timing
  -> adapter creates ObservedRun
```

Test 09 must preserve this path byte-for-byte in behavior and compatibility. Existing profiles continue to return only `{ decision, finalResponse }`; existing `callTool()` invocation semantics and Test 08's controlled trace remain unchanged. The new external-evidence field is optional.

---

## New externally observed evidence path

Path B applies when the completed profile outcome contains the new `evidence` field.

The profile must:

1. validate and map structured Story GIVEN into the candidate's public `context` option;
2. create the real agent with `createGithubAgent(...)` and all `repo-explorer` tools;
3. pass the Story prompt unchanged to `agent.generate({ prompt })`;
4. allow the AI SDK to execute the selected original GitHub handlers exactly once;
5. collect the public AI SDK callbacks and final `GenerateTextResult` from that same invocation;
6. translate those native facts into the generic external-evidence contract;
7. return `{ decision, finalResponse, evidence }`.

The profile must never call Agentbook `callTool()` in this path. The TypeScript adapter validates the returned evidence, rejects a mixed source, and creates canonical `ObservedRun` itself.

---

## Approved pre-implementation architecture decision

### Option A — optional evidence on `ExternalExecutionOutcome`

```text
profile executes third-party agent
  -> profile receives completed native trace/callback facts
  -> profile returns outcome plus optional external evidence
  -> adapter validates and normalizes atomically
```

Assessment:

- **Public API size:** one optional outcome field plus a small facts-only type family.
- **Backward compatibility:** additive for every existing profile.
- **Causal fidelity:** preserves whatever call IDs, step indices, sequence, errors, and timing the translator actually observed.
- **Post-execution traces:** natural fit for `GenerateTextResult.steps`, `toolCalls`, and `toolResults`.
- **Callback/streamed traces:** the profile may collect callbacks locally and return one finalized evidence value; no streaming transport is implied.
- **Parallel and failed tools:** representable through stable call IDs, step indices, sequence, status, and optional timing/error facts.
- **Metadata:** optional provider/model/usage fields avoid fabricated values.
- **Framework compatibility:** no AI SDK type appears in core.
- **Misuse risk:** smaller than public `ObservedRun`; Agentbook retains canonical normalization.
- **Tradeoff:** evidence is available only when `execute()` returns. Partial traces from a profile that throws are not a completed Run in this test.

### Option B — reporting primitive on `ExternalExecutionContext`

```text
profile.execute({ story, callTool, reportObservation })
  -> profile emits events during execution
  -> adapter owns a mutable event collector
```

Assessment:

- **Public API size:** larger and stateful; requires event types, lifecycle/finalization rules, duplicate handling, and concurrency semantics.
- **Backward compatibility:** additive in shape, but introduces a second imperative adapter callback beside `callTool()`.
- **Causal fidelity:** strongest for true streaming and partial failures.
- **Post-execution traces:** awkward because a completed native result must be decomposed and replayed into callbacks.
- **Parallel and failed tools:** possible, but requires explicit begin/end state-machine rules and cleanup on profile failure.
- **Metadata:** requires separate run-level reporting/finalization calls.
- **Framework compatibility:** can remain neutral, but prematurely chooses an event transport.
- **Misuse risk:** higher; callers can emit invalid, incomplete, duplicated, or out-of-order lifecycle events.
- **Tradeoff:** solves streaming/partial-run collection that Test 09 does not claim.

### Option C — expose or return `ObservedRun`

Rejected. It would make third-party integrators construct Agentbook's internal canonical UI/Evaluator record, including timeline and availability conventions, and would bypass centralized validation. It would also reverse the Test 07 adapter ownership boundary.

### Approved decision

**Option A is approved.** Add optional verdict-free external evidence to `ExternalExecutionOutcome`, and allow an execution profile to declare an empty Agentbook-dispatched tool set. This is the smallest framework-neutral delta that permits the selected untouched agent to execute normally and still leaves canonical `ObservedRun` construction inside the TypeScript adapter.

Option B is deferred until a later test genuinely requires incremental streaming, partial-run persistence, or an out-of-process event protocol.

---

## Public API delta

The approved exact additive `@agentbook/core` contract is:

```ts
export type ExternalExecutionEvidenceValue =
  | string
  | number
  | boolean
  | null
  | readonly ExternalExecutionEvidenceValue[]
  | { readonly [key: string]: ExternalExecutionEvidenceValue }

type ExternalToolCallEvidenceBase = {
  callId: string
  name: string
  input: ExternalExecutionEvidenceValue
  sequence: number
  step?: number
  startedAt?: string
  endedAt?: string
  durationMs?: number
}

export type ExternalToolCallEvidence =
  | (ExternalToolCallEvidenceBase & {
      status: 'success'
      output?: ExternalExecutionEvidenceValue
      error?: never
    })
  | (ExternalToolCallEvidenceBase & {
      status: 'error'
      output?: never
      error?: {
        name?: string
        message: string
      }
    })

export type ExternalExecutionEvidence = {
  source: string
  toolCalls: readonly ExternalToolCallEvidence[]
  provider?: string
  model?: string
  startedAt?: string
  endedAt?: string
  latencyMs?: number
  finishReason?: string
  tokenUsage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
    reasoningTokens?: number
  }
}

export type ExternalExecutionOutcome = {
  decision: string
  finalResponse: string
  evidence?: ExternalExecutionEvidence
}
```

Semantics:

- omitted optional fields mean **unavailable**; they must never be guessed;
- evidence values must be finite, plain, acyclic, JSON-compatible data and must be validated before normalization;
- `callId` is the framework tool-call correlation ID, not the model-generation call ID;
- `sequence` is a unique zero-based observed call-start/emission sequence for the Run; it does not assert serial completion;
- `step`, when available, is a zero-based framework generation-step index; parallel calls may share it;
- a successful call may omit `output` only when the framework did not expose one;
- an error call must not use `output`; it includes `error` only when safe error facts were exposed, and an error object is prohibited on a successful call;
- `source` identifies the observation producer, such as `vercel-ai-sdk`, but has no effect on evaluation.
- when `tokenUsage` is present, it must contain at least one actually observed count; an absent or empty usage record normalizes to canonical `{ availability: 'unavailable' }` rather than zero counts.

One related compatibility relaxation is required:

```ts
// unchanged shape
type ExternalExecutionProfile = {
  // ...
  tools: ExternalToolSet
}

// changed validation
// defineExecutionProfile() no longer rejects tools: {}
```

`tools` remains required, so existing authoring and `callTool()` semantics do not change. An externally observed profile uses `tools: {}` because the real candidate owns its construction-time tools. It must not duplicate the candidate's 39 tools as inert Agentbook definitions.

No AI SDK package, type, provider type, `ToolLoopAgent`, `GenerateTextResult`, `StepResult`, `ObservedRun`, `EvaluationResult`, Runner, UI, or Evaluator type is added to the public core surface.

The approved public names are exactly:

```text
ExternalExecutionEvidenceValue
ExternalToolCallEvidence
ExternalExecutionEvidence
ExternalExecutionOutcome.evidence
```

`Observed` remains reserved for Agentbook's private canonical `ObservedRun` family.

---

## Private canonical ObservedRun delta

`ObservedRun` remains private to the CLI/runtime boundary and is not exported from `@agentbook/core`. The smallest coherent internal change is to preserve existing names and make legitimately unavailable scalar facts optional. Absence means **unavailable** everywhere in this internal contract.

The exact proposed internal TypeScript shape is:

```ts
type ObservedToolCallBase = {
  callId: string
  name: string
  input: string
  duration?: string
  startedAt?: string
  endedAt?: string
}

type ObservedToolCall =
  | (ObservedToolCallBase & {
      status: 'success'
      output?: string
      error?: never
    })
  | (ObservedToolCallBase & {
      status: 'error'
      output?: never
      error?: {
        name?: string
        message: string
      }
    })

type ObservedTimelineStep = {
  label: string
  detail: string
  duration?: string
}

type ObservedTokenUsage =
  | { availability: 'unavailable' }
  | {
      availability: 'available'
      inputTokens?: number
      outputTokens?: number
      totalTokens?: number
      reasoningTokens?: number
    }

type ObservedRun = {
  decision: string
  reason: string
  finalResponse: string
  toolCalls: ObservedToolCall[]
  timeline: ObservedTimelineStep[]
  evidence: {
    provider?: string
    model?: string
    startedAt?: string
    endedAt?: string
    latencyMs?: number
    finishReason?: string
    tokenUsage: ObservedTokenUsage
  }
}
```

This chooses optional fields rather than a general `Availability<T>` abstraction because only a bounded set of internal execution facts needs honest absence. Token usage retains an explicit discriminated union because the UI already treats its availability as a first-class state and an available usage record may be partial. `availability: 'available'` must contain at least one observed token count; otherwise normalization uses `{ availability: 'unavailable' }`.

Normalization rules:

- never synthesize `0ms`, current timestamps, `unknown-provider`, placeholder model names, zero token counts, or empty output objects;
- a successful call without framework-exposed output omits `output`;
- an error call has `status: 'error'`, never uses `output` to hold an error, and includes `error` only when safe error facts were observed;
- a timeline step derived from a call with no observed duration omits `duration`;
- intercepted Test 01–08-style executions continue supplying their currently observed values, producing the same complete canonical records as before;
- external executions supply only the facts preserved by their framework-neutral evidence;
- the Evaluator continues to depend only on observed tool names for existing matchers and requires no availability-path branch.

No framework-specific type, enum, callback, result, step, or provider object enters this private canonical contract.

---

## Observation-source exclusivity

Every Run has exactly one authoritative observation source:

```text
outcome.evidence absent
  -> intercepted source is authoritative

outcome.evidence present
  -> external source is authoritative
```

The adapter must count actual `callTool()` invocations independently of whether they succeeded. After `profile.execute()` returns:

- `evidence` absent: normalize the intercepted trace, including an honestly empty trace;
- `evidence` present and intercepted invocation count is zero: validate and normalize external evidence;
- `evidence` present and intercepted invocation count is greater than zero: fail explicitly with a stable conflict error such as `CONFLICTING_OBSERVATION_SOURCES`;
- never concatenate, deduplicate, prefer, or heuristically reconcile the two traces.

Presence of `evidence` selects the external source even when `evidence.toolCalls` is empty. An empty external trace is a valid observed fact, not a signal to fall back to interception.

---

## Framework-neutral evidence contract

External evidence contains execution facts only:

- stable call identity;
- tool name;
- validated input;
- operational success/error;
- actual output when available;
- safe error facts when execution failed;
- observed sequence and optional framework step;
- timestamps/duration only when observed;
- optional provider/model/finish/usage facts.

It must not contain Story expectations, matcher results, per-expectation verdicts, overall `PASS`/`FAIL`, pipeline status, or an evaluation decision. Runtime validation must reject evaluation fields on the evidence structures and reject invalid evidence shapes before `ObservedRun` construction. It must not treat an ordinary domain field inside a tool input/output, such as a GitHub resource `status`, as an Agentbook verdict.

The public evidence type is deliberately narrower than `ObservedRun`. It contains no UI timeline labels, formatted duration strings, Agentbook provider defaults, `reason`, display decisions, or canonical availability representation. Those remain adapter normalization responsibilities.

The adapter must preserve absence during that normalization. An omitted public evidence field maps to the corresponding omitted private canonical field, or to `{ availability: 'unavailable' }` for token usage. Normalization must not turn structural completeness into false observation.

---

## AI SDK evidence translation

The Test 09 integration layer may import AI SDK-native types. Generic Agentbook packages may not.

For the selected AI SDK version, the translator must use evidence from the single `agent.generate(...)` execution:

```text
GenerateTextResult.steps[*].toolCalls
  -> toolCallId, toolName, input, step index, emitted order

GenerateTextResult.steps[*].toolResults
  -> matching tool result/output where present

onToolExecutionStart
  -> actual execution-start observation and tool call identity

onToolExecutionEnd
  -> actual operational result/error and native toolExecutionMs

GenerateTextResult
  -> final text, finish reason, usage, response/provider metadata when exposed
```

The finalized external evidence is one framework-native observation source. Step arrays provide the authoritative step/call/result structure. Tool-execution callbacks prove that an original handler actually started and ended and enrich the same call ID with operational status and duration. A disagreement between the two native surfaces must fail the integration run; it must not be silently reconciled.

The translator must not invoke any tool, `execute` callback, Octokit operation, or agent method during translation.

Native absence must survive both translation stages:

```text
AI SDK field unavailable
  -> corresponding ExternalExecutionEvidence field omitted
  -> corresponding private ObservedRun field omitted
  -> UI renders Unavailable
```

The translator and adapter must not substitute their own wall clock for a missing framework timestamp. They may record an integration-layer timestamp only when that timestamp was deliberately observed at the documented callback boundary and is labeled/normalized as that observed fact.

---

## Tool-call/result correlation

Correlation is by the AI SDK tool call's `toolCallId`.

For every translated call:

1. exactly one native tool call exists;
2. exactly one start callback exists for an executable selected tool;
3. exactly one end callback exists;
4. the end callback's tool call ID and name match the start and step call;
5. a successful end correlates with the native result/output where the framework exposes it;
6. an error end records safe error facts and is not relabeled as success;
7. exactly one `ExternalToolCallEvidence` is produced;
8. exactly one canonical `ObservedToolCall` with the same identity/name/status is produced;
9. the UI displays that canonical call once.

Duplicate call IDs, missing results for completed successful calls, unmatched results, callback/result disagreement, changed tool names, or count differences are integration failures. No name-plus-position fallback is permitted.

---

## Multi-step/parallel/error semantics

- **Multiple steps:** preserve every generation step containing calls. `step` is the zero-based index in `result.steps`; calls from later model rounds retain larger step values.
- **Call order:** `sequence` follows observed call-start order when start callbacks are available. The translator also preserves native within-step tool-call array order as supporting evidence. These orders must be recorded separately if they differ.
- **Parallel calls:** calls in the same framework step may execute concurrently and share `step`. `sequence` is only an observation order; it must not be rendered as proof that one parallel call completed before another. Actual start/end timestamps and duration are included only when observed.
- **Results:** correlate by `toolCallId`, never by tool name alone. Parallel completion order may differ from declaration/start order.
- **Errors:** preserve operational `status: 'error'` and safe error name/message when available. Never encode the error as a successful `output`; the private canonical error variant prohibits that representation. A completed Run with a handled tool error may still be evaluated. An unhandled profile/agent error that prevents a completed outcome is an execution/infrastructure failure and receives no Story verdict.
- **Unavailable facts:** omit timing, provider, model, token, or output fields that the native framework did not expose. The adapter/UI must present those as unavailable and must not synthesize `0ms`, current timestamps, token counts, or placeholder providers.
- **No overclaim:** Test 09 need not force a parallel or failing call in the primary GitHub scenario. Offline contract tests must validate normalization/rejection for complete external evidence, unavailable timestamps, unavailable duration, unavailable provider/model, unavailable token usage, error calls, successful calls without framework-exposed output, multiple steps, parallel calls, duplicate IDs, and other invalid evidence without claiming those synthetic records were candidate executions.

---

## Story GIVEN mapping

Use one structured Story GIVEN record:

```ts
given: {
  owner: 'vercel-labs',
  repo: 'github-tools',
  ref: '0dfd7d6d4bec7863363774401d88ca00d9860faa',
}
```

The target is a fixed public third-party repository/ref, not a repository owned by the temporary test fixture.

The integration profile must validate those fields and pass them directly to the existing public candidate boundary:

```ts
createGithubAgent({
  // model, token, preset
  context: { owner, repo, ref },
})
```

The candidate's context binding injects defaults into matching GitHub tool schemas and execution arguments. The Story remains the sole authored source of owner, repository, and ref. The profile, environment, deterministic model, and test harness must contain no second copy used as scenario input. Assertions may compare against the Story values but must not supply them.

Legacy `given: string[]` compatibility remains unchanged. This integration explicitly rejects the legacy form because the candidate context requires structured input.

---

## Story WHEN mapping

Use the authored prompt:

```text
Read packages/github-tools/src/agents.ts at the configured ref and identify the exported factory that constructs the GitHub ToolLoopAgent.
```

The profile must pass the exact Story string, unchanged, as:

```ts
agent.generate({ prompt: story.prompt })
```

No profile-side copy, prompt rewrite, hidden suffix, Story-ID branch, matcher-aware instruction, or expectation-derived hint is permitted. A propagation check must prove byte equality between Story WHEN and the prompt received by the official mock model.

---

## Model boundary

Use the candidate's existing `model` option with the official AI SDK `MockLanguageModelV4` from the AI SDK test export, pinned to the dependency version resolved for the candidate revision.

The scripted model must drive a real two-round `ToolLoopAgent` execution:

1. emit one `getFileContent` call with a stable `toolCallId` and path `packages/github-tools/src/agents.ts`; owner/repo/ref are omitted so the candidate's structured context supplies them;
2. after receiving the real GitHub handler result, emit a deterministic final text response that identifies `createGithubAgent`.

The model script must not execute or replace a GitHub tool. It controls only model outputs through the public injection boundary. Its recorded calls must prove that all 39 `repo-explorer` tools were offered during the relevant agent step.

Primary Story expectations are:

```ts
[
  {
    id: 'reads-agent-source',
    description: 'Reads the pinned agent source file',
    matcher: { kind: 'tool-called', tool: 'getFileContent' },
  },
  {
    id: 'does-not-search-known-path',
    description: 'Does not search code when the exact file path is supplied',
    matcher: { kind: 'tool-not-called', tool: 'searchCode' },
  },
]
```

`searchCode` remains available with the other preset tools; its absence is therefore meaningful. The primary expected evaluation is `PASS`.

No artificial FAIL execution is required. Offline generic evaluator tests already prove matcher failure. A future controlled PASS/FAIL pair may vary only Story expectations or deterministic model output while leaving third-party source and captured evidence honest; it is not part of this test unless the specification is revised before implementation.

---

## GitHub credential/network boundary

The real pinned `getFileContent` handler must make the GitHub read request. It must not be stubbed, mocked, replayed from a fixture, or replaced with Agentbook code.

Use a dedicated least-privilege read-only credential capable only of reading the selected public repository content. The exact credential type must be recorded; no write permission is allowed. The token is supplied server-side through a documented environment variable expected by the opt-in command and is never committed, printed, serialized into evidence, returned to the browser, or included in an error.

Test 09 must have a dedicated opt-in command, proposed as:

```text
npm run test:third-party-agent
```

Normal `npm test`, package tests, onboarding tests, and builds remain offline and do not require the candidate, GitHub, a token, or a model provider.

Classify outcomes separately:

```text
Test 09 pipeline status: PASS | FAIL
Story evaluation: PASS | FAIL | NOT EVALUATED
Infrastructure status: AVAILABLE | UNAVAILABLE
```

Missing/invalid credentials, DNS failure, timeout, rate limit, GitHub outage, pinned-ref disappearance, or dependency installation failure are infrastructure failures. They produce `Story evaluation: NOT EVALUATED`; they must not be reported as behavioral `FAIL`.

---

## Third-party source immutability

The pinned candidate must remain byte-for-byte unchanged.

Forbidden actions include:

- editing `createGithubAgent()`;
- changing `createGithubTools()` or `repo-explorer` membership;
- replacing construction-time tools;
- constructing a substitute `ToolLoopAgent` with copied tools;
- copying GitHub tool implementations into Agentbook or the integration profile;
- monkey-patching AI SDK or candidate internals;
- patching module resolution;
- vendoring a modified candidate build;
- changing the candidate to expose an Agentbook hook.

The Test 09 evidence report must compare the pinned revision, relevant source hashes, complete third-party diff, installed package contents, and resolved factory identity before and after execution. Required result:

```text
Third-party source changed for integration: NO
Third-party source LOC modified: 0
Existing public createGithubAgent() invoked: YES
```

---

## Thin integration criterion

Every executable line in the consumer-owned Test 09 integration must classify as exactly one of:

```text
GIVEN VALIDATION
GIVEN-TO-CONTEXT TRANSLATION
MODEL CONFIGURATION
PUBLIC AGENT CONSTRUCTION
FRAMEWORK CALLBACK COLLECTION
AGENT INVOCATION
NATIVE-EVIDENCE TRANSLATION
OUTPUT TRANSLATION
```

The profile must not own GitHub behavior, tool selection policy, tool execution, result fabrication, Story evaluation, expected call filtering, or candidate reconstruction. It must not inspect Story expectations or matcher IDs. Any executable line outside the allowed classifications fails the thin-integration criterion unless this specification is revised first.

---

## UI fidelity

The existing UI must consume the same completed `{ observedRun, evaluationResult }` record used by Tests 04, 07, and 08. It must not receive AI SDK result objects or know whether the observation source was intercepted or external.

The UI must show:

- the external project's Agent and Story identity;
- structured owner/repo/ref in authored order;
- the exact WHEN prompt;
- the actual `getFileContent` call once, with safe input, real result, operational status, and observed timing availability;
- no `searchCode` call;
- every expectation verdict and overall result exactly from `EvaluationResult`;
- provider/model/token/timing facts when available, otherwise an explicit unavailable state;
- separate pipeline, infrastructure, and Story-evaluation status.

Structured comparisons among native AI SDK evidence, translated evidence, canonical `ObservedRun`, `EvaluationResult`, and rendered values are authoritative. Screenshots are supporting evidence only.

For every omitted canonical fact, the generic UI must render `Unavailable` or an equivalent explicit unavailable label. It must not render an empty string, `{}`, `0`, `0ms`, a guessed timestamp, or a placeholder provider/model. The UI must make this decision from the canonical field's absence or token-usage availability union; it must not know whether the Run used intercepted or external observation. Existing complete records from Tests 01–08 retain their current rendered values exactly.

---

## Security

Test 09 must:

- use only the read-only `repo-explorer` preset;
- verify all 39 offered tools are read-only at the pinned revision;
- use no approval-bypassing write preset or combined preset;
- restrict execution to the fixed public repository/ref and known source-read prompt;
- keep the GitHub credential server-side and out of browser assets/traffic;
- redact authorization headers and credential-bearing errors;
- bind the Agentbook server to loopback;
- permit only the expected GitHub API network destination during the opt-in run;
- disable telemetry and live model-provider requests;
- avoid logging complete environment variables;
- avoid storing third-party response evidence containing secrets;
- perform no repository mutation, issue/PR action, workflow action, gist action, release action, or local source modification.

The harness must inspect the offered tool names before execution and fail closed if the pinned preset contains a write action or differs from the recorded allowlist.

---

## Regression requirements

Tests 01–08 must remain `PASS` without weakened assertions.

In particular:

- convention-based Story discovery remains code-first;
- Story expectations and both observation paths remain verdict-free;
- `ObservedRun` remains private, adapter-owned, canonical, and honest about unavailable facts;
- the generic Evaluator remains the only behavioral judge;
- the UI remains a faithful renderer of one completed record;
- `Story -> Runner -> ObservedRun -> Evaluator -> EvaluationResult` remains intact;
- the current callTool-intercepted path continues unchanged;
- current callTool executions continue populating the same complete tool outputs, timings, run metadata, and explicit unavailable token state they populate today;
- Test 08's structured GIVEN and thin-profile behavior remain compatible;
- packed package isolation remains intact;
- no Python work, provider dependency in core, Vercel-specific adapter package, or framework auto-detection is introduced;
- normal `npm test` remains deterministic, offline, provider-free, GitHub-free, and credential-free.

Offline contract coverage must include canonical normalization of:

- complete external evidence;
- unavailable tool timestamps;
- unavailable tool duration;
- unavailable provider and model;
- unavailable run timestamps and latency;
- unavailable token usage;
- error tool calls with safe error facts and no fake output;
- error tool calls without exposed safe error detail;
- successful tool calls without framework-exposed output.

Required implementation gates must include the repository's standard equivalents of:

```bash
npm run typecheck
npm test
npm run test:package
npm run test:onboarding
npm run test:existing-agent
npm run build
git diff --check
```

The opt-in GitHub execution is a separate required Test 09 evidence command and is not added to normal `npm test`.

---

## Acceptance criteria

Test 09 may be marked `PASS` only when every criterion is satisfied:

- [x] Tests 01–08 remain passing without weakened contracts.
- [x] The candidate is exactly `vercel-labs/github-tools` at revision `0dfd7d6d4bec7863363774401d88ca00d9860faa`.
- [x] The real public `createGithubAgent()` factory is invoked with `repo-explorer`.
- [x] Relevant third-party source hashes match the recorded baseline before and after execution.
- [x] Third-party source changes and LOC modifications are zero.
- [x] No substitute agent, reconstructed `ToolLoopAgent`, copied tool set, monkey patch, or modified package is used.
- [x] All 39 pinned `repo-explorer` tools remain available to the model.
- [x] The offered preset contains no write tool.
- [x] Structured Story GIVEN is the sole source of owner/repo/ref.
- [x] GIVEN maps through the candidate's public `context` boundary.
- [x] Story WHEN reaches `agent.generate({ prompt })` unchanged.
- [x] The candidate's public model-injection boundary receives the official deterministic mock model.
- [x] The scripted model emits a real `getFileContent` tool call and then consumes its real result.
- [x] The original read-only GitHub handler executes exactly once.
- [x] No Agentbook stub, replay, or second execution supplies the tool result.
- [x] `searchCode` and every other unselected tool remain available but uncalled.
- [x] Native calls/results/callbacks correlate by tool call ID.
- [x] The translated external evidence is verdict-free, valid, complete for the observed call, and framework-neutral.
- [x] The adapter selects external observation only when no `callTool()` invocation occurred.
- [x] Supplying both observation sources fails explicitly.
- [x] No external and intercepted trace is merged or deduplicated.
- [x] Missing timestamps, durations, outputs, provider/model, or usage are represented as unavailable rather than fabricated.
- [x] The private canonical `ObservedToolCall` supports absent output/timing and explicit safe error facts without encoding errors as output.
- [x] Private run evidence supports absent provider/model/timestamps/latency/finish reason and available/unavailable token usage.
- [x] The generic UI renders every absent canonical fact as `Unavailable` or equivalent without observation-source knowledge.
- [x] Complete evidence, unavailable timestamps/duration/provider/model/token usage, error calls, successful calls without output, multi-step, parallel, and duplicate-ID semantics have deterministic offline tests.
- [x] Canonical `ObservedRun` exactly matches translated external evidence.
- [x] `ObservedRun` contains no behavioral verdict.
- [x] The unchanged generic Evaluator alone produces the expected `PASS`.
- [x] The unchanged UI renders the same `ObservedRun` and `EvaluationResult` without AI SDK knowledge.
- [x] The public core contract contains no AI SDK or provider-specific type/dependency.
- [x] The private canonical `ObservedRun` contract contains no AI SDK or provider-specific type.
- [x] `ObservedRun` and `EvaluationResult` remain absent from the public core authoring surface.
- [x] Existing outcome-only profiles and callTool-based profiles remain source- and behavior-compatible.
- [x] A profile with `tools: {}` is accepted only as a valid profile shape; runtime observation-source validation still applies.
- [x] The opt-in run uses a least-privilege read-only credential and exposes no secret.
- [x] GitHub/network/credential failure is distinguished from behavioral evaluation failure.
- [x] Normal repository tests remain offline and credential-free.
- [x] All required typecheck, package, onboarding, existing-agent, build, diff, and opt-in integration gates pass.

---

## PASS/FAIL checklist

Mark Test 09 `PASS` only when every answer is **Yes**:

- [x] Did the real third-party agent remain untouched?
- [x] Did the public `createGithubAgent()` factory construct the agent under test?
- [x] Did the AI SDK, rather than Agentbook, own tool dispatch?
- [x] Did a real original GitHub read handler execute exactly once?
- [x] Were all original read-only preset tools available during the Run?
- [x] Did structured GIVEN and unchanged WHEN reach the candidate's public boundaries?
- [x] Did one framework-native evidence source describe the actual execution without tool re-execution?
- [x] Did call IDs correlate native call, result, translated evidence, `ObservedRun`, and UI?
- [x] Did the adapter reject mixed intercepted/external observation?
- [x] Did missing facts remain explicitly unavailable?
- [x] Did canonical error calls preserve safe error facts without pretending an error was successful output?
- [x] Did the generic UI render unavailable canonical facts explicitly without knowing the observation path?
- [x] Did the TypeScript adapter, not the profile author, construct canonical `ObservedRun`?
- [x] Did the unchanged Evaluator alone produce behavioral PASS/FAIL?
- [x] Did the unchanged UI render the canonical record faithfully without framework-specific knowledge?
- [x] Did the public API remain small, additive, verdict-free, and framework-neutral?
- [x] Did the original callTool path and every Test 01–08 contract remain intact?
- [x] Did the opt-in run remain read-only and keep credentials secret?
- [x] Did normal tests remain offline?

If any answer is **No**, Test 09 is `FAIL` or remains not implemented. A GitHub outage or missing credential yields `Infrastructure status: UNAVAILABLE` and `Story evaluation: NOT EVALUATED`; it is not a behavioral FAIL and cannot satisfy the Test 09 execution proof.

---

## Required evidence

The implementation report must include:

1. Agentbook baseline commit, working-tree state, and relevant core/adapter/engine/evaluator/UI hashes;
2. candidate repository URL, exact revision, package version, license, tree, and relevant file hashes;
3. proof the resolved installed candidate code matches the pinned source;
4. complete diff and LOC evidence proving zero third-party modification;
5. exact `createGithubAgent()` invocation boundary and proof the returned object is the agent executed;
6. complete pinned `repo-explorer` tool allowlist and read-only classification;
7. proof all preset tools were offered to the deterministic model;
8. complete Agentbook-specific integration files, imports, physical/logical LOC, and thin-line classification;
9. canonical Story snapshot and immutability result;
10. exact structured GIVEN-to-candidate-context comparison;
11. exact Story WHEN-to-model-prompt comparison;
12. deterministic model configuration and recorded model rounds, excluding secrets and excessive source content;
13. safe evidence that the real GitHub `getFileContent` handler executed once against the fixed public repo/ref;
14. native AI SDK step calls, results, start/end callbacks, finish reason, usage, and metadata actually available;
15. per-call correlation table keyed by `toolCallId` across native call, callback, result, translated evidence, `ObservedRun`, and UI;
16. proof translation performed no second tool or agent execution;
17. complete non-sensitive `ExternalExecutionEvidence` using the approved `ExternalToolCallEvidence` name;
18. complete non-sensitive canonical `ObservedRun`, recursive verdict-free proof, and field-by-field availability comparison;
19. complete `EvaluationResult`;
20. one-to-one native-evidence-to-ObservedRun comparison;
21. one-to-one ObservedRun/EvaluationResult-to-UI comparison;
22. explicit mixed-source conflict test;
23. offline validation tests for complete evidence, empty external traces, unavailable timestamps, unavailable duration, unavailable provider/model, unavailable run timing, unavailable token usage, error calls with/without safe detail, successful calls without output, multiple steps, parallel calls, duplicate IDs, unmatched results, and invalid evidence values;
24. proof existing callTool profiles produce unchanged complete observations and UI rendering;
25. public package export/declaration diff and proof no AI SDK/provider type or dependency entered core;
26. credential type and non-sensitive permission description, with leakage scan results;
27. opt-in command, GitHub destination, timeout/rate-limit handling, and infrastructure classification;
28. browser request/console/overlay evidence and supporting screenshots;
29. Tests 01–08 regression results and every required final quality gate;
30. final fields:

```text
Test 09 Execution Status: PASS | FAIL
Infrastructure Status: AVAILABLE | UNAVAILABLE
Story Evaluation: PASS | FAIL | NOT EVALUATED
Third-Party Source Changed For Integration: YES | NO
Third-Party Source LOC Modified: <number>
Existing Public createGithubAgent() Invoked: YES | NO
Framework Owned Tool Dispatch: YES | NO
Actual Original GitHub Handler Executions: <number>
Observation Source: INTERCEPTED | EXTERNAL
Observation-Source Exclusivity: PASS | FAIL
Native Evidence Correlation: PASS | FAIL
Thin Integration Criterion: PASS | FAIL
Normal Test Suite Offline: YES | NO
```

Evidence must never include the GitHub token, authorization headers, full environment output, or unnecessary repository file contents.

---

## Failure conditions

Test 09 fails if any of the following occurs:

- the candidate revision is not pinned or source hashes do not match;
- third-party source or installed candidate code is modified;
- the integration bypasses `createGithubAgent()`;
- the candidate's tools or `ToolLoopAgent` are reconstructed, copied, wrapped by replacement, monkey-patched, or filtered;
- a write-capable preset/tool is enabled;
- an Agentbook stub or fixture result replaces a GitHub handler;
- a tool is executed again during evidence translation;
- Story GIVEN is duplicated in profile/model/harness scenario constants;
- Story WHEN is changed, supplemented, or hardcoded outside the Story;
- the deterministic model or profile inspects expectations to choose a passing trajectory;
- any unselected/prohibited tool is removed to force `tool-not-called` to pass;
- calls/results are correlated by name or array position when a call ID exists;
- missing/duplicate call IDs, mismatched names, unmatched results, or callback disagreement are ignored;
- parallel calls are represented as a false serial causal order;
- timestamps, duration, provider/model, output, token usage, or finish reason are fabricated;
- an unavailable canonical fact is filled with `0ms`, a current/guessed timestamp, `unknown-provider`, a placeholder model, zero token counts, or an empty output object;
- a tool error is encoded as successful output rather than `status: 'error'` with separately observed safe error facts;
- the canonical private contract cannot represent a successful call whose framework exposes no output;
- the UI renders unavailable fields as blank/zero/placeholder values or branches on intercepted versus external observation;
- external evidence contains behavioral verdicts;
- the adapter accepts both intercepted and external evidence for one Run;
- the adapter merges, deduplicates, or chooses heuristically between observation sources;
- the profile constructs `ObservedRun` or the public core package exports it for authoring;
- AI SDK types/dependencies enter public core or private canonical `ObservedRun`, engine, Evaluator, or UI contracts;
- the Evaluator or UI branches on `vercel-ai-sdk`, `ToolLoopAgent`, candidate identity, Story ID, or tool name;
- a completed native trace differs from translated evidence, `ObservedRun`, or UI;
- GitHub/credential/network failure is mislabeled as Story FAIL;
- a secret appears in source, logs, errors, artifacts, browser traffic, or evidence;
- normal `npm test` contacts GitHub, a model provider, or another external service;
- any Test 01–08 contract is weakened or a required gate fails.

---

## Explicitly out of scope

Test 09 must not implement:

- Python or another language adapter;
- a generic plugin system;
- a subprocess, RPC, JSON-RPC, HTTP, or remote-execution protocol;
- framework auto-detection;
- a Vercel-specific Agentbook adapter package;
- compatibility with every AI SDK agent/tool/result mode;
- streaming UI evidence or partial-Run persistence;
- client-executed tools;
- durable/workflow-agent support;
- live-model quality evaluation;
- new matcher families;
- telemetry;
- cloud execution;
- authentication;
- billing;
- OKF;
- hot reload;
- stale-run invalidation;
- Run history;
- Compare;
- package publication;
- final branding;
- Test 10.

---

## Architecture decision approval status

The following architecture decisions are now approved by the Test 09 specification owner:

1. **Option A:** optional verdict-free `ExternalExecutionOutcome.evidence`.
2. Framework-neutral public evidence named `ExternalExecutionEvidenceValue`, `ExternalToolCallEvidence`, and `ExternalExecutionEvidence`.
3. Required `profile.tools` remains, with `{}` allowed for framework-owned dispatch.
4. Strict intercepted-or-external source exclusivity and stable `CONFLICTING_OBSERVATION_SOURCES` failure.
5. The pinned `vercel-labs/github-tools` candidate/revision, `repo-explorer`, fixed repository/ref, prompt, and `getFileContent`/`searchCode` expectations.
6. Official deterministic `MockLanguageModelV4` with no live-model-quality claim.
7. A dedicated opt-in GitHub-backed command and least-privilege read-only local/server credential boundary.
8. The smallest private canonical normalization delta: optional unavailable scalar facts, discriminated success/error tool calls, optional timeline duration, and explicit available/unavailable token usage.

**Architecture decisions still unresolved: none.**

The exact credential instance, temporary integration project path, port, and test-process timeout are implementation-time operational values constrained by this specification, not open architecture decisions.

---

## Implementation record

Implemented against Agentbook baseline commit:

```text
d22d9ecd9a6240f040cd1254e5b9ea45d89faaa0
```

The implementation adds the approved framework-neutral public evidence types, permits required `tools: {}`, validates and normalizes external evidence privately, rejects mixed observation sources with `CONFLICTING_OBSERVATION_SOURCES`, preserves unavailable facts, keeps error facts separate from output, and renders unavailable canonical values generically in the existing UI.

The third-party fixture imports the exact public package `@github-tools/sdk@1.13.0`. The opt-in harness resolves that package's exported entry point for the thin dynamically imported profile because the current TypeScript profile loader uses bundled data-URL modules and cannot directly bundle one SDK transitive dynamic Node `require`. This glue does not modify, copy, reconstruct, wrap, or filter the candidate's factory, `ToolLoopAgent`, or tools.

The successful credential-backed run validated that the harness:

- clone and detach the candidate at `0dfd7d6d4bec7863363774401d88ca00d9860faa` in an OS temporary directory;
- verify the pinned source hashes, package name/version/license, and clean checkout;
- compare the installed package's published source-map contents for `agents.ts`, `presets.ts`, `context.ts`, and `token.ts` to the pinned source hashes;
- verify the complete 39-tool `repo-explorer` allowlist contains no known write tool;
- invoke the existing exported `createGithubAgent()` with the official deterministic `MockLanguageModelV4`;
- pass structured Story GIVEN to `context` and Story WHEN unchanged to `agent.generate()`;
- let the framework execute the original `getFileContent` handler exactly once;
- correlate native calls, results, callbacks, translated evidence, and canonical calls by `toolCallId`;
- prove `searchCode` remained available but uncalled, and verify the candidate checkout stayed clean.

### Final live evidence

The safely captured `TEST09_EVIDENCE` record produced these final results:

```text
Test 09 Execution Status: PASS
Infrastructure Status: AVAILABLE
Story Evaluation: PASS
Third-Party Source Changed For Integration: NO
Third-Party Source LOC Modified: 0
Existing Public createGithubAgent() Invoked: YES
Framework Owned Tool Dispatch: YES
Actual Original GitHub Handler Executions: 1
Observation Source: EXTERNAL
Observation-Source Exclusivity: PASS
Native Evidence Correlation: PASS
Thin Integration Criterion: PASS
Normal Test Suite Offline: YES
```

Candidate and source evidence:

- repository: `https://github.com/vercel-labs/github-tools.git`;
- revision: `0dfd7d6d4bec7863363774401d88ca00d9860faa`;
- package: `@github-tools/sdk@1.13.0`, MIT;
- the five pinned source hashes above matched the detached checkout;
- the installed package source-map contents for `agents.ts`, `presets.ts`, `context.ts`, and `token.ts` matched the pinned source hashes;
- the checkout was clean before and after execution;
- third-party source changes: zero files and zero LOC.

The framework exposed 39 unique tools in this observed order:

```text
getRepository
listBranches
getFileContent
getRepositoryTree
listPullRequests
getPullRequest
listIssues
getIssue
searchCode
searchRepositories
searchIssues
listCommits
getCommit
getBlame
compareCommits
listPullRequestFiles
listPullRequestReviews
listPullRequestReviewThreads
getPullRequestContext
getIssueContext
listIssueComments
listLabels
listDiscussions
getDiscussion
listGists
getGist
listGistComments
listWorkflows
listWorkflowRuns
getWorkflowRun
listWorkflowJobs
getWorkflowJobLogs
listCheckRuns
getCombinedStatus
getCiFailureContext
listReleases
getLatestRelease
getRelease
getReleaseContext
```

The separately canonicalized membership was:

```text
compareCommits
getBlame
getCiFailureContext
getCombinedStatus
getCommit
getDiscussion
getFileContent
getGist
getIssue
getIssueContext
getLatestRelease
getPullRequest
getPullRequestContext
getRelease
getReleaseContext
getRepository
getRepositoryTree
getWorkflowJobLogs
getWorkflowRun
listBranches
listCheckRuns
listCommits
listDiscussions
listGistComments
listGists
listIssueComments
listIssues
listLabels
listPullRequestFiles
listPullRequestReviewThreads
listPullRequestReviews
listPullRequests
listReleases
listWorkflowJobs
listWorkflowRuns
listWorkflows
searchCode
searchIssues
searchRepositories
```

The observed and expected sets were independently unique, each contained exactly 39 names, and their canonical memberships were identical. No unexpected or missing tool was accepted. The pinned allowlist's independent write-tool intersection remained empty, so the safety check was fail-closed.

Story propagation evidence:

```text
GIVEN.owner: vercel-labs
GIVEN.repo: github-tools
GIVEN.ref: 0dfd7d6d4bec7863363774401d88ca00d9860faa
Candidate context: byte-for-byte/deep-equal to structured GIVEN
Story WHEN: Read packages/github-tools/src/agents.ts at the configured ref and identify the exported factory that constructs the GitHub ToolLoopAgent.
agent.generate prompt: the exact Story.prompt value
Normalized user text: byte-for-byte equal to Story.prompt
Story unchanged after execution: YES
```

The official mock observed a normalized V4 prompt with a system string message followed by one user message containing one text part. The shape-only diagnostic recorded two messages, one user text part, and no credential or authorization data.

Native execution and correlation evidence:

| Fact | Validated value |
| --- | --- |
| Constructed object | `ToolLoopAgent` returned by public `createGithubAgent()` |
| Preset | `repo-explorer` |
| Model | official `MockLanguageModelV4` (`ai-sdk-test` / `test09-deterministic-github-tools`) |
| Native step calls | 1 |
| Native step results | 1 |
| Start callbacks | 1 |
| End callbacks | 1 |
| Tool call ID | `test09-get-file-content-1` across call, result, callbacks, external evidence, and canonical call |
| Tool | `getFileContent` |
| Input | `{"path":"packages/github-tools/src/agents.ts"}` with owner/repo/ref supplied by context |
| Operational status | `success` |
| Original GitHub handler executions | 1 |
| Canonical output availability | present; repository content is intentionally not duplicated in this checkpoint |
| `searchCode` | available to the model and not called |
| Translation re-execution | none |

The profile returned one verdict-free `ExternalExecutionEvidence` with source `vercel-ai-sdk`. The TypeScript adapter, not the profile, normalized its one successful call at sequence `0` into canonical `ObservedRun`. Missing framework facts remained absent/unavailable; observed values were preserved rather than replaced. Neither external evidence nor `ObservedRun` contained `verdict`, `expectations`, `evaluationResult`, `PASS`, or `FAIL` fields.

The unchanged Evaluator produced:

```text
EvaluationResult.verdict: PASS
reads-agent-source: PASS
does-not-search-known-path: PASS
```

The complete call-ID correlation, presence/availability flags, framework timing/usage facts, and safe canonical record were emitted by the successful live `TEST09_EVIDENCE` payload. Volatile run-local timestamps, durations, token values, and repository file contents are not re-created or guessed in this checkpoint document.

### Final implementation hashes

| File | SHA-256 |
| --- | --- |
| `packages/agentbook/index.ts` | `024bbce5d3763207903952cfef597689fba65cf5e748ff36aed8ff15f11e3bf7` |
| `packages/cli/src/contracts.ts` | `3b0f6e97397d110988aa24ef8db5d15daea96dd68e17d0d17fff70075be530d8` |
| `packages/cli/src/external-evidence.ts` | `65fd9f3eb717431f80931dd0ce67b300fa8fd7dbc876382e237b65112bfab449` |
| `packages/cli/src/typescript-adapter.ts` | `a95d91a3406dd73bbf79f2308cce3ed4371355af46fd80875daba4ae76c94d13` |
| `packages/cli/src/generic-engine.ts` | `4b935e8f4fee6f30d7910d9acd927842191a4848e1a73026d2e7c2c4baca993c` |
| `packages/cli/src/evaluator.ts` | `6107e27536908a7206667bc857474c640ab5a49ba53c27225bcf2bbeb6db27a6` |
| `packages/cli/src/runtime/app.js` | `95b0fc77290e53b1109e6b47673f1ec2719aa1027f3ab58ceb91481205869791` |
| `tests/fixtures/github-tools-agent/execution/github-tools.profile.mjs` | `93553a2e99a7ec57855b3415cc7096e351b25b5df453ad7fb6a18caf387873c1` |
| `tests/fixtures/github-tools-agent/ai-sdk-evidence.mjs` | `3d6dcbb4c42bfc1d37f915470d3a2b00bd8c42ff64253286383f86bfbee1b3a1` |
| `tests/real-third-party-agent.integration.mjs` | `967c017ec9211e076cdb2fd7f88cf26bd41e82f870e9c12a92d8146806e47059` |

### Final credential-independent validation

| Gate | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm test` | PASS — 31/31 |
| `npm run test:package` | PASS |
| `npm run test:onboarding` | PASS |
| `npm run test:existing-agent` | PASS |
| `npm run build` | PASS |
| `git diff --check` | PASS |
| External-evidence and Test 09 contract matrix | PASS — 10/10 |
| Credential-backed `npm run test:third-party-agent` | PASS |

The offline matrix covers complete evidence, empty traces, unavailable scalar facts, partial token usage, successful calls without output, error calls with and without safe details, multiple steps, parallel ordering, duplicate IDs/sequences, unmatched AI SDK results, invalid JSON-like values, evaluation-field rejection, `tools: {}`, mixed-source conflict, existing intercepted observations, and generic UI rendering.

Credential requirement:

```text
Environment variable: AGENTBOOK_TEST09_GITHUB_TOKEN
Credential class:     least-privilege GitHub token
Permissions:          read-only repository Contents and Metadata for vercel-labs/github-tools
Destination:          api.github.com, read operations only
```

The successful run provided the credential through the local process environment without writing it to the repository or including it in evidence. Future opt-in runs use the same command and security boundary.

Final fields:

```text
Test 09 Execution Status: PASS
Infrastructure Status: AVAILABLE
Story Evaluation: PASS
Third-Party Source Changed For Integration: NO
Third-Party Source LOC Modified: 0
Existing Public createGithubAgent() Invoked: YES
Framework Owned Tool Dispatch: YES
Actual Original GitHub Handler Executions: 1
Observation Source: EXTERNAL
Observation-Source Exclusivity: PASS
Native Evidence Correlation: PASS
Thin Integration Criterion: PASS
Normal Test Suite Offline: YES
```

Tests 01–08 remained passing under their existing documented contracts, and Test 09 now passes its live and offline contracts. The repository checkpoint therefore documents Tests 01–09 as `PASS`. Test 10 does not exist and is out of scope.
