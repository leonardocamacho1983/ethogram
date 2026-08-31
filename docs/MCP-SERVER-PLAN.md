# Ethogram MCP server plan

Status: implemented for the public `0.1.0-alpha.2` release after two senior architecture/security, MCP protocol/testing, DX/product, QA, platform, governance, and documentation review passes. This document preserves the implementation plan and review closure.

## Outcome

Ship `@ethogram/mcp` as a local, project-scoped MCP server that lets compatible hosts understand Ethogram, inspect the current project, and run one real behavioral Story at a time.

The server must be useful in two distinct situations:

1. a person or agent needs to learn what Ethogram is, how its contracts work, what it supports, and how to integrate it;
2. a coding agent needs current, structured project context and a safe way to execute a selected Story after changing an agent.

The MCP surface does not become a second source of truth. Agents, Stories, execution profiles, GIVEN, WHEN, and EXPECTATIONS remain authored in project files. The MCP server exposes no source-writing tool.

## Final review closure

The second review initially returned NO-GO. The implementation plan was updated before final execution:

| Review gap | Implemented resolution |
| --- | --- |
| Weak questions presented as partial knowledge | Whole-token retrieval, broad functional-word/verb filtering, confidence threshold, negative queries, and explicit compliance limits. Brand, voice, and generic capability phrasing are non-discriminative without a real domain concept, so invented coffee, teleportation, astrology, bakery, payroll, and earthquake capabilities are `unknown`; definition, broad-capability, Python, and Story questions remain answerable. |
| Audience prompts buried the audience's essential article | Each audience has an explicit must-have article order before shared context; a matrix test covers every supported audience. |
| Execution possible from summaries or truncated contracts | List summaries omit digests; only complete Story inspection emits a digest; schema-preserving truncation sets `storyDigest: null` and `executionAllowed: false`; a same-snapshot pre-run guard rejects the contract even if a digest was learned elsewhere. |
| Agent resources disappeared after the project-list bound | Direct Agent resources resolve against the full stable snapshot and apply an individual bounded DTO after exact lookup. |
| File/import/root escapes | Root identity fixed once; config/package/source symlinks and escaping relative imports are rejected and tested. |
| Timeout/cancel released execution too early | Parent waits for process close, escalates to `SIGKILL`, keeps tracking/mutex active, and `close()` awaits workers. |
| Output and payload claims were too broad | Tool-specific schemas, invalid-output tests, 4 MiB pre-IPC cap, public depth/count/node/byte budgets, and explicit truncation. |
| Malformed profile outcomes lost post-effect semantics | Runtime validation rejects non-string outcome fields as `PROFILE_EXECUTION_FAILED`; all run-path fallbacks preserve `effectsMayHaveOccurred: true` and `retrySafe: false`. |
| JavaScript `callTool` values could violate the MCP result after dispatch | Tool name and finite plain-JSON input are validated before dispatch; output is validated after dispatch, with all failures normalized as non-retryable `PROFILE_EXECUTION_FAILED`. |
| Invalid optional Story fields reached DTO construction | `failureDescription`, like the rest of the expectation contract, is runtime-validated as a bounded non-empty string when present. |
| Wide GIVEN values could corrupt the Story output shape | GIVEN has an isolated node/byte budget, while Agent, expectation, provenance, and execution-control fields retain their declared schemas. |
| Automatic resource listing evaluated project code | Generic listing exposes static resources/templates only; deliberate tools/direct reads load project code. |
| Protocol coverage tested legacy twice | Real stdio tests now assert modern 2026-07-28 auto-negotiation and a forced legacy session. |
| Release/package documentation drift | Published alpha.1 and repository alpha.2 candidate are separated; the npm package README is self-contained and version-specific. |

Cross-platform Node 20.9 and Windows execution remain CI/release-matrix gates; they cannot be claimed from one local POSIX runtime. The package itself declares Node 20.9+ and avoids POSIX-only production APIs except standard Node process signals with a portable exit fallback.

## People the surface must serve

- Agent developers: discover Stories, inspect behavioral contracts, run a focused check, and diagnose a failure.
- Application developers integrating an existing agent: understand descriptors, profiles, tool evidence, and framework-owned evidence.
- Tech leads and staff/principal engineers: review behavioral invariants and inspect evidence without learning an agent framework-specific trace format.
- QA and SDET practitioners: treat Stories as executable regression contracts and understand the exact expectation that failed.
- Platform, DevOps, and developer-experience teams: configure one portable local server, diagnose setup problems, and know the execution boundary.
- Security, privacy, compliance, and AI-governance reviewers: distinguish authored expectations, observed evidence, and deterministic verdicts; recognize that a real execution profile can have external effects.
- Engineering managers and product managers: understand which critical product behaviors are covered without treating Ethogram as a generic quality score.
- Framework/tooling maintainers and DevRel/OSS maintainers: explain the integration contract accurately and help consumers adopt it without private repository knowledge.
- Domain owners and representatives of affected users: verify that a Story states the intended business behavior rather than merely preserving an implementation accident.
- SRE, on-call, support, and solutions teams: distinguish behavioral failures from operational failures and collect a safe operation id without copying sensitive evidence into tickets.
- MCP host integrators, release/supply-chain owners, legal/DPO/risk/procurement reviewers, and accessibility/localization owners: understand protocol compatibility, package provenance, data movement, and the current English-only documentation boundary.

## Product boundaries

### Included

- Local `stdio` transport.
- One fixed project root chosen when the server process starts.
- General Ethogram knowledge that remains available even when the selected project is not initialized or is temporarily invalid.
- Project, Agent, and Story discovery.
- Focused execution of one named Story.
- Structured results plus concise model-readable text.
- Setup diagnostics with actionable remediation.
- MCP resources and prompts in addition to callable tools.
- A content-hashed project revision, optimistic execution preconditions, and stale-run reporting that never claims side effects were rolled back.

### Excluded from this alpha

- Remote or hosted MCP transport.
- Authentication or multi-tenant operation.
- Arbitrary project paths in tool arguments.
- Creating or editing Agents, Stories, profiles, or configuration.
- Batch execution, CI gates, persistence, run history, or Compare.
- An MCP-hosted LLM that independently answers questions. Explanations come from bundled, versioned Ethogram knowledge and the connected host's model.

## Public package and command

- Package: `@ethogram/mcp@0.1.0-alpha.2`, published through the npm `next` tag.
- Binary: `ethogram-mcp`.
- Usage: `ethogram-mcp [--project <path>]`; the current directory is the default.
- Runtime: Node.js 20.9 or newer.
- Diagnostics go to `stderr`; `stdout` is reserved exclusively for MCP JSON-RPC.
- MCP SDK: `@modelcontextprotocol/server@^2.0.0` with Zod 4.2+ and `serveStdio(() => createServer())`, supporting modern MCP 2026-07-28 discovery and the SDK's 2025-era compatibility path.

The MCP package depends on exact `@ethogram/cli@0.1.0-alpha.2`. A narrow `@ethogram/cli/runtime` facade exposes one isolated worker operation, not the engine or adapter internals. The MCP does not call the developer UI over HTTP and does not duplicate evaluation logic.

Every input and success output uses a strict root-object Zod schema. Successful tools return both validated `structuredContent` and a short text summary. Operational failures return `isError: true` with a stable public code and remediation; expected doctor readiness failures remain successful `not-ready` results. Unknown resource or prompt arguments use protocol errors rather than pretending to be tool results.

## MCP tools

### `ethogram_explain`

Read-only. Accepts an optional documentation topic, natural-language question, audience, and detail level. Returns a deterministic explanation for known topics plus the best matching bundled knowledge articles with stable `ethogram://docs/{topic}` links. It reports `answerability: exact | partial | unknown`, the content language, Ethogram/docs versions, sources, and limitations; it never presents a weak retrieval match as a complete answer.

Knowledge topics cover:

- overview and positioning;
- expected / observed / result mental model;
- Agents, Stories, GIVEN, WHEN, EXPECTATIONS, and matchers;
- execution profiles and framework-owned evidence;
- architecture and source-of-truth boundaries;
- new-project and existing-agent workflows;
- MCP usage and safety;
- current alpha capabilities and limitations;
- troubleshooting;
- glossary;
- stakeholder-oriented reasons to care.

With no arguments it returns a compact index and overview. An unknown or weakly matched question returns the index rather than fabricating an answer.

Annotations: read-only, idempotent, closed-world.

### `ethogram_doctor`

Checks Node compatibility, fixed project-root accessibility, `package.json`, and `ethogram.config.mjs` statically. With `mode: load`, it also asks an isolated project worker to evaluate whether the adapter can load the trusted project. Returns `ready`, `not-ready`, or `static-ready`, individual checks, safe error codes, and remediation. It never returns environment variables, tokens, file contents, consumer logs, or stack traces.

The tool works even when project loading failed, so the MCP server remains useful for onboarding and repair.

Annotations are conservative because `mode: load` evaluates trusted project modules: not read-only, not guaranteed idempotent, open-world, and potentially destructive.

### `ethogram_get_project`

Loads the trusted project in an isolated worker and returns a normalized project summary, Agent summaries, Story count, revision, and resource links. It omits the absolute project root. This tool exists so tools-only MCP hosts receive the same essential context as hosts that support resources.

Annotations are conservative: not read-only, not guaranteed idempotent, open-world, and potentially destructive.

### `ethogram_list_stories`

Loads the trusted project in an isolated worker and returns the project revision and compact Story summaries in stable order. Optional filters narrow by Agent id or a bounded text query; `limit` and an opaque cursor provide pagination. Results include actual MCP resource-link content.

Story summaries omit the execution digest, so listing cannot satisfy the run precondition. An opaque cursor is bound to revision and filters.

Annotations are conservative: not read-only, not guaranteed idempotent, open-world, and potentially destructive.

### `ethogram_get_story`

Loads the trusted project in an isolated worker and returns the normalized current contract for one Story: Agent, description, GIVEN, public `when` terminology, EXPECTATIONS, relative source path, project revision, Story digest, and execution warning. It does not return execution-profile implementation details or arbitrary source-file contents.

If the normalized contract is truncated by a public DTO budget, the digest is withheld and execution is disallowed.

Annotations are conservative: not read-only, not guaranteed idempotent, open-world, and potentially destructive.

### `ethogram_run_story`

Effectful. Requires `storyId`, the `expectedRevision` and `expectedStoryDigest` returned by inspection, plus `acknowledgeExternalEffects: true`. It serializes execution globally and executes exactly one matching Story snapshot. The acknowledgement reduces accidental calls but is not represented as proof of human consent. It returns:

- overall PASS/FAIL;
- every expectation, matcher, verdict, observed call count, and matching call ids;
- observed decision and final response;
- observed tool calls and operational status;
- timeline and provider/model metadata when available;
- Ethogram boundary evidence, including the execution id and unchanged-Story check.

The description, server instructions, schema, and annotations explicitly state that the consumer-owned execution profile invokes the real agent and may call tools with external side effects. The operation is not read-only or idempotent and is potentially destructive/open-world. A revision mismatch before execution rejects the call without running. A source change, cancellation, timeout, or worker crash after execution started returns an operation id with `effectsMayHaveOccurred: true` and `retrySafe: false`; it never instructs a host to retry automatically. Cancellation cannot undo an already-started external action.

## MCP resources

- `ethogram://docs`: documentation index.
- `ethogram://docs/{topic}`: one complete versioned knowledge article in Markdown.
- `ethogram://project`: current project descriptor in JSON.
- `ethogram://agents/{agentId}`: one current Agent descriptor plus its Story summaries.
- `ethogram://stories/{storyId}`: one current Story descriptor in JSON.

Documentation resources remain readable when the project is invalid. Project resources return safe MCP errors and never fall back to stale content after a failed reload. Dynamic Agent and Story instances are not enumerated during generic `resources/list`, because hosts may perform that call automatically. Deliberate inspection tools return resource links; direct reads remain available at the templates.

Dynamic ids use one canonical `encodeURIComponent`/strict-decode codec and exact id lookup, including `/`, `%`, `?`, `#`, spaces, and Unicode. Project resources include a revision, use no long-lived cache hint, and return normalized DTOs without an absolute root. The alpha does not advertise subscriptions; every read evaluates a fresh stable snapshot. Listings are bounded and deterministically ordered.

## MCP prompts

### `learn-ethogram`

Takes an optional audience (`agent-developer`, `application-developer`, `technical-leader`, `engineering-manager`, `qa`, `platform-sre`, `security`, `privacy-compliance`, `product-domain-owner`, `support`, `maintainer`, or `mcp-host-integrator`) and embeds the relevant documentation index and explanation in instructions for the host model, clearly separating current support from future possibilities.

### `diagnose-ethogram-story`

Validates a Story id against a fresh snapshot and embeds its complete normalized descriptor, revision, and digest in a focused diagnostic workflow. It states that observed evidence is absent unless separately supplied. The workflow runs only with explicit execution intent; separates operational tool errors, behavioral FAIL, stale, timeout, and not-evaluated states; treats project-authored text and observed output as untrusted data rather than instructions; and considers agent bugs, evidence/instrumentation bugs, and legitimate contract changes without weakening a contract merely to hide a regression.

## Isolation, runtime, and freshness design

Project evaluation never occurs in the MCP protocol process. `@ethogram/cli/runtime` provides a worker entry that is launched with Node IPC for each project snapshot or execution:

1. the parent owns MCP `stdout`; worker stdout/stderr are captured, bounded, and never forwarded into JSON-RPC;
2. a worker crash, `process.exit`, top-level log, or stuck event loop cannot kill or corrupt the MCP server;
3. the parent enforces bounded load/run timeouts, propagates cancellation, waits for confirmed exit, and escalates from `SIGTERM` to `SIGKILL` before releasing the run mutex;
4. IPC carries only the operation result with the absolute root removed, is capped at 4 MiB before send, and never carries consumer logs or raw thrown messages; public DTO budgets are then applied before MCP output;
5. a global run mutex rejects concurrent execution with `RUN_IN_PROGRESS` rather than queuing a surprise second side effect;
6. EOF/SIGINT/SIGTERM stop accepting work, terminate the active worker, and report that effects may already have occurred.

Before loading, the parent fixes the canonical project identity. The worker resolves only configured directories whose canonical locations remain inside it; absolute and `..` escape, config/package/source-file symlinks, escaping directory symlinks, and project-relative imports outside the root are rejected. Selected source contents and relative paths are SHA-256 hashed before and after module evaluation. A snapshot is published only when both hashes match. Fresh workers avoid `data:` import cache and global-state reuse. Read errors fail closed. The revision is the stable content digest rather than size/mtime.

Inspection returns a project revision and per-Story digest. Run requires both as optimistic preconditions, verifies them before the agent starts, and hashes again afterward. A post-run mismatch does not discard the fact that effects may have occurred. No stale result is labeled PASS/FAIL to the caller.

The same containment and expectation-validation primitives are used by the developer runtime, while the existing UI API retains its instance/revision compatibility contract.

## Evaluator integrity

Before MCP publication, runtime Story validation must require a non-empty expectation list, unique non-empty expectation ids, non-empty descriptions/tool names, the exact supported matcher union, and no authored verdict fields. The evaluator uses an exhaustive matcher switch and fails closed for unsupported kinds. Its result preserves an ordered expectation-evidence list as well as the compatibility id-to-verdict map. `tool-called` means an observed call attempt, even when that tool's operational status is `error`; documentation states this explicitly. Unverifiable boundary claims such as `mockDataUsed: false` are removed or represented as `unknown`.

## Error contract

Expected failures return model-readable errors with stable codes such as:

- `INVALID_PROJECT_ROOT`
- `MISSING_PROJECT_PACKAGE`
- `MISSING_ETHOGRAM_CONFIG`
- `PROJECT_RELOAD_FAILED`
- `STORY_NOT_FOUND`
- `STORY_NOT_EXECUTABLE`
- `STORY_CONTEXT_TRUNCATED`
- `STALE_EXECUTION`
- `RUN_IN_PROGRESS`
- `PROJECT_WORKER_TIMEOUT`
- `PROJECT_WORKER_EXITED`
- `PROJECT_PATH_ESCAPE`
- `EXECUTION_ACKNOWLEDGEMENT_REQUIRED`
- adapter-specific validation codes already owned by Ethogram

Public errors are allowlisted by code and use product-owned messages/remediation; raw adapter/profile/tool errors remain inside the worker. They do not include stack traces, ANSI/control characters, secrets, raw environment data, absolute roots, or consumer-provided error text. Evidence is different: GIVEN, WHEN, tool inputs/outputs, model responses, and provider metadata can be sensitive. The server applies documented per-field/count/total limits with explicit `truncated` metadata but does not claim semantic secret redaction. Documentation warns that the MCP host/model and execution profile may send those values beyond the machine.

## Security and trust boundaries

- The project root is selected once at process startup and canonicalized. Tool inputs cannot switch it; configured paths and symlinks cannot escape it.
- Read surfaces expose Ethogram descriptors, not arbitrary files.
- No MCP write, shell, network, package-install, or source-edit tool exists.
- Ethogram supports trusted local projects only. Loading config, Agents, Stories, and profiles evaluates project-owned Node.js modules that may themselves perform filesystem/network effects. Consequently every project-loading tool is conservatively annotated; only bundled documentation is truly read-only/closed-world.
- Project evaluation and execution are isolated from protocol framing in killable child processes, but process isolation is not an OS sandbox and does not revoke the project's Node/network/environment authority.
- The server logs only lifecycle and safe diagnostic messages to `stderr`.
- MCP structured output mirrors the same evaluator-owned verdict boundary as the UI.
- Documentation explicitly warns hosts and users that a Story profile may perform real external actions.
- Project-authored text and observed agent/tool output carry provenance and are treated as untrusted data, never as MCP server instructions.

`McpServer.instructions` states that PASS covers only the supported matchers in one execution; project loading evaluates trusted code; execution may have cost and external effects; run must not be invoked automatically or in a retry loop; FAIL, operational error, stale, timeout, and not evaluated are distinct; and `doctor` is the first repair surface.

## Test strategy

### Unit and in-memory protocol tests

- Tool, resource, prompt discovery and schemas.
- Modern 2026-07-28 discovery plus forced 2025-era compatibility over real stdio; in-memory transport is not treated as modern-era coverage.
- Documentation index, exact topic lookup, natural-language matching, and unknown-query fallback.
- Project discovery, filtering, Story lookup, missing Story errors, and structured links.
- PASS and FAIL executions with expectation-level evidence.
- Runtime rejection of empty/duplicate/malformed expectations and unsupported matchers.
- Tool annotations, especially the effectful `run_story` contract.
- Prompt audience tailoring and diagnostic instructions.
- Documentation availability when the project is invalid.
- `doctor` remediation and safe error shaping.
- Strict schemas, extra arguments, output validation, unknown ids/URIs, URI reserved characters/Unicode, pagination, stable ordering, and payload truncation.
- Canonical stakeholder questions, partial/unknown answerability, English-only disclosure, and roadmap-claim drift.

### Runtime regression tests

- Existing developer-server project and run APIs remain compatible.
- Same-size/same-mtime edits produce a different content revision.
- Invalid-to-valid repair is visible on the next isolated snapshot.
- A source change during a run reports stale with `effectsMayHaveOccurred` and never suggests automatic retry.
- Reload failures do not expose stale project state as current.
- Project code writing to stdout during config import, Story import, profile import, tool execution, and late timers cannot corrupt MCP framing.
- Concurrent runs, cancellation, timeout, shutdown with an active run, worker crash, `process.exit`, and a hung profile.
- Absolute/`../`/symlink path escape; errors containing path/token/stack/ANSI sentinels; large sensitive evidence.

### Packaged-artifact integration

- Build and pack core, CLI, and MCP.
- Install tarballs into a clean project outside the repository.
- Verify no repository path, credential name/value, fixture knowledge, or private source leaks into the package.
- Spawn the packed `ethogram-mcp` binary over `stdio` with the official MCP client.
- Complete initialization, list tools/resources/prompts, read resources, call explanation and discovery tools, run the generated Story, and confirm PASS.
- Confirm clean shutdown and that stdout contains protocol traffic only.
- Run the artifact on Node 20.9 and the current supported Node line, on POSIX and Windows CI, including a project path with spaces.
- Verify version consistency across package metadata, server info, `--version`, docs, and the exact CLI dependency.

### Final repository checks

- Package builds.
- Typecheck.
- Full existing test suite.
- Focused MCP test suite.
- `npm pack --dry-run`/manifest inspection.

## Documentation changes

- Root README: add MCP value proposition, install/configuration example, tool/resource summary, safety warning, and link to the detailed guide.
- `packages/mcp/README.md`: package-specific setup, host configuration, complete surface, errors, and security model.
- `docs/packages.md`: include the third public package and command.
- `docs/limitations.md`: distinguish MCP focused execution from a general `ethogram run`/CI runner.
- New `docs/mcp.md`: conceptual usage, examples for common MCP hosts, resource URIs, diagnostic workflow, and troubleshooting.

## Acceptance criteria

- A compatible MCP host can learn Ethogram without a valid consumer project.
- A tools-only or full MCP host can learn Ethogram and obtain the same essential project context.
- A coding agent can discover and inspect current Stories without an arbitrary-file API, with honest disclosure that trusted project modules are evaluated.
- A selected Story runs through the same adapter, engine, evaluator, and evidence contracts as the developer UI.
- Effectful execution is unambiguously labeled, explicitly acknowledged, serialized, revision-bound, timeout-bounded, and never auto-retried.
- Project edits become visible as a new content revision without restarting the MCP server.
- Invalid reloads never masquerade as current project state.
- Consumer stdout, crashes, exits, and hangs cannot corrupt or terminate the protocol process.
- Malformed contracts fail closed rather than producing a misleading PASS.
- The packed package works outside the monorepo with no hidden development dependency.
- Existing Ethogram onboarding and developer UI behavior remain green.
