# Test 07: Five-Minute Developer Onboarding

## Execution status

**IMPLEMENTED — PASS.**

This document defines the acceptance contract for Test 07 and records the validated implementation result from 2026-08-29.

---

## Objective

Prove that a developer who has never worked inside the Agentbook repository can install local package artifacts into an ordinary clean Node project and reach a functional Agentbook developer experience in approximately five minutes, without understanding Agentbook internals.

For Test 07, that experience is explicitly the initial **TypeScript/Node** experience. The implementation must introduce the smallest language-adapter boundary needed to keep the generic Agentbook developer engine, Evaluator, and UI language-neutral, then implement only the built-in TypeScript adapter behind that boundary.

The product question is:

> Can a developer go from an ordinary project to seeing and running their first Agentbook Story in approximately five minutes, without understanding Agentbook internals?

The decisive replacement question is:

> If a developer received only the packed Agentbook artifacts and a normal Node project, could they reach a functioning Agentbook UI and run their first Story without the Agentbook source repository or help from us?

The answer must be **Yes** for Test 07 to pass.

---

## Why this test matters

Tests 01–06 prove that Agentbook has the necessary technical boundaries: code-first Story discovery, honest execution/evaluation separation, real agent execution, faithful UI rendering, external project ownership, and an installable core package.

Test 07 proves that those boundaries compose into a usable local developer loop. A technically correct architecture is not yet a product experience if a new developer must understand environment plumbing, repository layout, generated registries, server actions, internal classes, or workspace aliases before seeing value.

This test therefore treats setup time, explicit developer actions, error quality, and artifact isolation as product requirements. The first successful Run must require no provider account, API key, paid model, source checkout, or undocumented knowledge.

### Scope and claim limitation

Passing Test 07 proves the onboarding experience for Agentbook's initial TypeScript/Node ecosystem. It does not prove Python support or full language-agnostic compatibility. It proves that the architecture preserves a language-adapter boundary for future implementations.

Test 07 implements and validates:

- one minimal generic language-adapter boundary;
- one built-in TypeScript adapter;
- zero-configuration TypeScript onboarding.

Test 07 does not implement a Python adapter, Python runtime, pip package, subprocess protocol, JSON-RPC, HTTP adapter protocol, generalized remote execution, or multi-language auto-detection beyond automatically using the sole supported TypeScript adapter. The boundary must be no broader than necessary to make dependency direction and conceptual responsibilities explicit.

---

## Validated architectural contracts from Tests 01–06

Test 07 extends the validated architecture without weakening it:

| Test | Contract that Test 07 must preserve | Current status |
| --- | --- | --- |
| Test 01 | Stories declared in code are discovered by convention and are the source of truth for navigation and rendering. | `PASS` |
| Test 02 | `Story -> Runner -> ObservedRun -> Evaluator -> EvaluationResult`; Story and ObservedRun are verdict-free, and only EvaluationResult owns behavioral verdicts. | `PASS` |
| Test 03 | A tool-capable agent can execute an unchanged Story through the Runner boundary; execution status and Story evaluation remain separate. | `PASS` |
| Test 04 | The UI consumes real execution evidence and renders ObservedRun and EvaluationResult faithfully without evaluating or inventing evidence. | `PASS` |
| Test 05 | An external project owns its Agent, Story, execution profile, and tools while Agentbook remains a generic loader, Runner, Evaluator, and UI. | `PASS` |
| Test 06 | `@agentbook/core` is a real packed, installable, isolated public package with built runtime and declarations. | `PASS` |

Test 07 must not move evaluation into the Story, Runner, CLI, or UI; add verdicts to Story expectations or ObservedRun; introduce Access Request-specific behavior into Agentbook packages; weaken package isolation; expose credentials; or make the ordinary test suite contact an external service.

---

## Hypothesis

Given only:

- an ordinary Node project outside the Agentbook repository;
- a packed `@agentbook/core` artifact;
- a packed `@agentbook/cli` artifact;
- a supported Node/npm installation; and
- locally available generic dependencies required by those artifacts,

a new developer should be able to complete a flow conceptually equivalent to:

```bash
npm install -D @agentbook/core @agentbook/cli
npx agentbook init
npx agentbook dev
```

and then:

```text
browser opens
  -> developer sees the consumer project
  -> starter Agent appears
  -> starter Story appears
  -> developer clicks Run Story
  -> consumer-owned offline execution occurs
  -> Runner produces ObservedRun
  -> Evaluator produces EvaluationResult
  -> UI renders the evidence and PASS or FAIL
```

The developer must not need to know about or manually configure:

- `AGENTBOOK_PROJECT_ROOT`;
- the Agentbook source repository or its filesystem path;
- Next.js or another UI framework's internals;
- generated Story registries;
- server actions;
- internal Runner classes;
- Evaluator imports;
- workspace aliases;
- private test fixtures.

---

## Target developer journey

The reference journey contains no more than five explicit developer actions:

1. Install the two packed Agentbook packages with one package-manager command.
2. Run `agentbook init`.
3. Run `agentbook dev`.
4. Open the reported local URL if the browser was not opened automatically.
5. Click **Run Story** once and wait for the completed result.

The automated test may use absolute tarball paths, `--no-open`, an explicit test port, and `npx --no-install` to make the proof deterministic and offline. Those harness details must not add conceptual setup work to the normal developer journey.

The implementation may refine exact command spelling, but it must preserve this level of simplicity. Any additional mandatory developer action requires an explicit justification and causes the preferred step-count criterion to fail unless this specification is deliberately revised before implementation.

---

## Architecture under test

```text
Clean Developer Project outside the Agentbook repository
  -> ordinary pre-Agentbook package.json remains module-system compatible
  -> install packed @agentbook/core
  -> install packed @agentbook/cli
  -> agentbook init
  -> minimal consumer-owned TypeScript Agentbook files
  -> agentbook dev (cwd is the default project root)
  -> artifact-owned local developer server
  -> language-neutral Agentbook engine
  -> canonical ExecutionRequest
  -> automatic built-in TypeScript adapter
       -> satisfies the generic Runner contract
       -> TypeScript/JavaScript discovery and loading
       -> Node module-system handling
       -> loads the consumer TypeScript execution profile
       -> executes the consumer TypeScript tool handlers
       -> records actual language-specific execution facts
       -> canonical Agentbook project/Story descriptors
       -> canonical verdict-free ObservedRun
  -> ObservedRun
  -> Evaluator
  -> EvaluationResult
  -> language-neutral browser UI
```

The dependency direction is:

```text
Generic Agentbook UI / Engine / Evaluator
                  ^
                  |
       Language Adapter Boundary
                  ^
                  |
 Built-in TypeScript Adapter (Test 07)

 Future Python Adapter: not implemented
```

The minimal adapter boundary must conceptually support two responsibilities:

1. Load the selected language project and provide canonical Agentbook project, Agent, Story, source, and execution-capability descriptors to the generic engine.
2. Satisfy the generic Runner contract by accepting a language-neutral ExecutionRequest, invoking the consumer-owned execution profile/tools inside the language-specific environment, recording the actual execution facts, and returning a canonical verdict-free ObservedRun to the generic engine.

The generic engine may select and orchestrate a Runner abstraction, but it must not execute a language-native profile directly. For Test 07, the TypeScript adapter is the concrete Runner implementation at this boundary:

```text
Generic Agentbook Engine
  -> language-neutral ExecutionRequest
  -> TypeScript Adapter / Runner implementation
  -> TypeScript execution profile and tool handlers
  -> canonical ObservedRun
  -> generic Evaluator
  -> EvaluationResult
  -> generic UI
```

The key invariant is:

> Language-specific execution occurs behind the language adapter boundary. Generic Agentbook receives canonical ObservedRun, not a language-native execution profile.

A future adapter could satisfy the same boundary as `ExecutionRequest -> FutureAdapter -> ObservedRun`. The generic engine, Evaluator, and UI must not need to know how that language is launched, how its functions or tools are represented or invoked, or whether execution occurs in-process or out-of-process. This substitution requirement does not prescribe or authorize a subprocess, RPC, JSON-RPC, HTTP, serialization, or plugin protocol.

This does not prescribe concrete interface names, serialization, subprocesses, RPC, or a plugin system. In Test 07 the TypeScript adapter may execute in the same process as the CLI/runtime. The purpose is to make the dependency direction explicit, not to generalize infrastructure prematurely.

Responsibility remains separated as follows:

| Component | Owns | Must not own |
| --- | --- | --- |
| Consumer project | TypeScript Agent, Story, scenario data, execution profile, and local tool handlers | Agentbook UI/runtime, TypeScript runtime-loader configuration, adapter selection, or behavioral verdicts embedded in the Story |
| `@agentbook/core` | The documented public authoring and execution contracts validated by Test 06 | UI framework, demo project, repository discovery registry, or domain-specific starter behavior |
| `@agentbook/cli` | `agentbook` executable, initialization orchestration, project-root selection, distributable developer-server/UI runtime, adapter boundary, automatic built-in TypeScript adapter, and its required loading capability | Consumer business policy, source-repository fallback, copied application scaffold, or user-visible adapter selection during TypeScript onboarding |
| Generic engine/project boundary | Selected-project orchestration, canonical descriptors, creation of language-neutral ExecutionRequest values, orchestration of a Runner abstraction, consumption of canonical ObservedRun values, and coordination of Evaluator/UI | Inspect `.ts` files, perform Node module loading, invoke a language-native execution profile or tool handler, assume npm for every future project, or branch on language-specific extensions |
| Generic Runner contract | Define the language-neutral `ExecutionRequest -> ObservedRun` execution boundary that adapters may satisfy | Prescribe how a language runtime starts, how native functions/tools are represented, or whether execution is in-process/out-of-process |
| Built-in TypeScript adapter / Runner implementation | Discover TypeScript/JavaScript Agent and Story files; load/transpile `.ts`; handle Node modules; load and invoke TypeScript profiles/tools; record actual execution facts; translate canonical ExecutionRequest into TypeScript execution and return canonical ObservedRun | Evaluate expectations, render UI, expose a language-native profile to the generic engine, add behavioral verdicts to ObservedRun, or contain consumer domain policy |
| `ObservedRun` | Observable execution facts, including operational tool status | Per-expectation or overall behavioral PASS/FAIL |
| Evaluator | Apply generic matcher semantics to Story plus ObservedRun | Execute tools, branch on fixture IDs, or mutate the Story |
| `EvaluationResult` | Per-expectation results and overall behavioral verdict | Replace or alter execution facts |
| UI | Render the selected project and completed execution record | Re-run matchers, fabricate evidence, or use a separate mock record |

The expected smallest package architecture is two Agentbook artifacts: core and CLI. The CLI artifact should contain or directly own the developer UI/runtime needed by `agentbook dev`. If implementation proves that a third Agentbook package is genuinely necessary, work must stop before adding it. The implementation proposal must document why it is required, its exact boundary, and why the same result cannot be achieved coherently with the two-package architecture.

The adapter is an architectural boundary, not necessarily a separate package. For Test 07, the built-in TypeScript adapter and its runtime dependencies should remain inside the `@agentbook/cli` artifact/dependency boundary unless implementation demonstrates a compelling reason to stop and reconsider the package design.

The preferred product direction is TypeScript Agent, Story, and execution-profile authoring out of the box. Because `agentbook init` generates `.ts` authoring files, the installed Agentbook artifacts must own whatever runtime capability is necessary to discover, load, and execute those files. The developer must not install or configure TypeScript, `ts-node`, `tsx`, a Node loader, a transpiler, a bundler, a `tsconfig`, or a custom module loader merely to reach the first Run.

The decisive TypeScript-runtime question is:

> Does a developer need to understand or configure how TypeScript Story files are executed before reaching their first Run?

The answer must be **No** for Test 07 to pass.

The decisive future-adapter question is:

> If a future Python adapter produced the same Agentbook project descriptors and ObservedRun contract, would the existing Evaluator and UI be able to consume them without Python-specific changes?

The required answer is **Yes**. This is an architectural substitution test only; it does not authorize or claim a Python implementation.

---

## Package and CLI boundary

### Required artifacts

Test 07 must build and inspect real npm-compatible tarballs for:

- `@agentbook/core`;
- `@agentbook/cli`.

Nothing is published to npm. The clean consumer installs the local tarballs, not package source directories.

The `@agentbook/cli` package must provide:

- package name `@agentbook/cli`;
- an explicit `bin` entry named `agentbook`;
- built JavaScript for every runtime entry point;
- explicit module-format metadata;
- explicit supported Node version or range;
- explicit runtime dependencies;
- a minimal language-adapter boundary and one automatic built-in TypeScript adapter;
- a declared adapter-owned capability sufficient to load the generated TypeScript Agent, Story, and profile files;
- an export/content boundary that does not rely on unbuilt TypeScript outside the package;
- the files required to start the developer server and render the UI;
- no install lifecycle step that reaches into the Agentbook checkout.

The installed executable must resolve from the consumer's `node_modules/.bin` and ultimately from the packed CLI artifact. It must not resolve from a globally installed binary, workspace link, repository script, shell alias, or source checkout.

### TypeScript authoring runtime ownership

The built-in TypeScript adapter may internally depend on a minimal TypeScript transpilation or loading mechanism, but the implementation technology is deliberately unspecified. The implementation must choose the smallest appropriate mechanism. TypeScript/Node-specific dependencies and module handling belong behind the adapter boundary, even when the adapter is shipped inside the CLI package.

Whatever mechanism is chosen must:

- be declared in `@agentbook/cli` package dependencies or otherwise be fully contained in the packed CLI artifact contract;
- install as part of the single `npm install -D @agentbook/core @agentbook/cli` action;
- work when the consumer did not previously install `typescript`, `tsx`, `ts-node`, `@swc/*`, `esbuild`, or another TypeScript runtime loader;
- require no consumer `tsconfig`, Node loader flag, transpiler configuration, bundler configuration, or package script;
- require no Agentbook source checkout, workspace resolution, global executable, or network fetch at `init`/`dev` time;
- work inside both clean-machine isolation locations;
- load the generated starter under the reference consumer's ordinary pre-Agentbook `package.json` module settings.

The generic CLI command surface, developer engine, Evaluator, and UI must not directly discover or inspect `.ts` files, invoke a TypeScript loader, import or call a TypeScript execution-profile function, invoke TypeScript tool handlers, assume execution profiles are JavaScript functions, or branch on TypeScript-specific file extensions. The generic engine must create a language-neutral ExecutionRequest and receive a canonical ObservedRun through the Runner/adapter boundary. The TypeScript adapter owns conversion from that request into native profile/tool invocation and conversion of the actual execution facts back into ObservedRun.

The generated starter must work without asking the developer to understand or manually choose ESM versus CommonJS. `init` must not change `package.json` `type`, extensions, scripts, or other module-system settings merely to make Agentbook work. If implementation determines that a specific Node or module-system prerequisite is unavoidable, work must stop before adding a user-visible setup step and document why the artifact-owned boundary cannot satisfy it.

### Artifact ownership of the developer runtime

`agentbook dev` must start a runtime shipped through installed Agentbook artifacts. It must not:

- spawn the Agentbook repository's local `next dev` or equivalent source command;
- reference an absolute Agentbook checkout path;
- resolve `../../app`, root workspace packages, or repository-only assets;
- use a TypeScript path alias back into the repository;
- assume the Agentbook repository exists;
- scaffold the full Agentbook application into the consumer project;
- install missing Agentbook code from the network at first run.

The consumer project receives only consumer-owned authoring/configuration files. The UI and its framework/runtime remain Agentbook-owned and distributable.

### Package inspection

Before installation, the test must inspect both tarball manifests and extracted contents. It must record their filenames, cryptographic digests, compressed/unpacked sizes, complete manifests, relevant package metadata, and leakage-scan results.

The artifacts must contain no secrets, `.env` files, private fixtures, test evidence, user-specific filesystem paths, source maps with unintended private embedded source, workspace links, or references to the Agentbook checkout. The CLI artifact may intentionally include built UI assets and runtime code required by `agentbook dev`; their inclusion must be attributable to that public function.

---

## `agentbook init` behavior

### Minimum initialization contract

Run from the root of an ordinary project, `agentbook init` must:

1. Resolve the current working directory as the target project.
2. Verify that the target is a directory containing a readable `package.json`.
3. Preflight every file it intends to create before writing any file.
4. Create the smallest understandable starter set:
   - `agentbook.config.mjs` for project metadata and documented entry/glob configuration;
   - `agents/access-request.agent.ts` for the starter Agent;
   - `stories/admin-access-requires-approval.agent.stories.ts` for the starter Story;
   - `execution/access-request.profile.ts` for the deterministic execution profile and its local tools.
5. Use only documented public imports from installed Agentbook packages in generated source.
6. Print a concise summary of files created or preserved and the next command: `npx agentbook dev`.

For Test 07, `init` automatically generates the sole supported TypeScript starter. It must not ask the developer to select, name, enable, or understand a language adapter. Adapter selection and TypeScript loading remain invisible implementation details of the first-run experience.

The exact exported names inside these files may follow the public APIs validated by Tests 05–06, but generated code must never import application internals, private subpaths, generated registries, test fixtures, or repository-relative files.

Keeping the controlled local tools in the starter execution-profile file is the default minimal choice. Splitting them into another consumer file is acceptable only if required by the public execution contract and must not add a developer step.

The `.ts` extension is an intentional onboarding contract. `init` must not tell the developer to install TypeScript, `tsx`, `ts-node`, a transpiler, a bundler, or a loader; create a `tsconfig`; add a Node loader flag; or change `package.json` module settings. It must generate files that the installed CLI runtime can load directly from the unchanged reference project.

`init` must not request an API key, choose a cloud provider, write `.env` files, add telemetry, run a model request, or start the development server.

### Idempotency and conflict safety

Initialization must use an all-target preflight so a conflict cannot leave a partially initialized project.

Required behavior:

| Scenario | Required result |
| --- | --- |
| First initialization, all target files absent | Create the complete starter set and exit `0`. |
| Second initialization, generated files unchanged | Write nothing, report that the project is already initialized, and exit `0`. |
| Some target files match and other target files are absent | Preserve matching files, create only missing files after a conflict-free preflight, report both categories, and exit `0`. |
| Any target path exists with different content | Write nothing, list every conflicting path, explain that existing files were preserved, and exit non-zero. |
| A target path cannot be read or written | Write nothing when detected during preflight and return an actionable filesystem error without presenting a raw stack trace as the primary message. |

Test 07 does not require a `--force` option. Safe refusal is the smallest acceptable overwrite contract. If a force mode is later added, it must require explicit invocation and is outside this test's success path.

The test must hash or byte-compare existing target files before and after second-run and conflict scenarios to prove that no silent overwrite occurred.

---

## `agentbook dev` behavior

When invoked from a developer project root, `agentbook dev` must:

1. Use the current working directory as the project root by default.
2. Automatically use the built-in TypeScript adapter, without a flag, prompt, or generated adapter configuration.
3. Ask that adapter to load the project's TypeScript/JavaScript Agentbook definitions and translate them into the canonical generic project boundary.
4. Use adapter-owned runtime capability to load the generated TypeScript Agent, Story, and execution-profile files without consumer compiler/loader setup.
5. Interpret those files correctly under the reference project's unchanged pre-Agentbook package/module settings.
6. Pass language-neutral project descriptors and execution requests through the generic engine; the generic engine, Evaluator, and UI must not inspect TypeScript source directly.
7. Start the artifact-owned developer server on localhost only by default.
8. Clearly print the selected project root and reachable local URL, including the actual port.
9. Open the browser by default when the local environment supports it.
10. Serve the existing Agentbook developer UI with the consumer project selected.
11. Shut down gracefully on `SIGINT` or `SIGTERM`, release the port, and exit without an unhandled stack trace.

For deterministic automation, the CLI must support equivalent options to:

```text
agentbook dev --no-open --port <number>
```

An optional explicit project form must also be supported:

```text
agentbook dev --project <path>
```

The explicit path must be resolved canonically and must select exactly that project. It must not be required for the ordinary current-directory flow.

Test 07 does not prescribe a CLI framework, server framework, TypeScript loading/transpilation technology, bundler, or browser-opening library. The implementation should use the minimum machinery that satisfies the distributable boundary and UX contract.

---

## Project-root behavior

The default project root is the canonical current working directory of the `agentbook dev` process. The developer must not set `AGENTBOOK_PROJECT_ROOT` manually.

The CLI may use private process configuration to pass the selected root into its own runtime, but that plumbing must be internal, must not appear in generated consumer instructions, and must not change the ownership boundary.

The test must prove:

- invoking `dev` from the clean consumer selects that consumer;
- invoking `dev --project <second-valid-project>` selects the explicit project rather than the current directory;
- a nonexistent path is rejected clearly;
- a file path where a project directory is expected is rejected clearly;
- a directory without the required initialization/configuration is rejected with guidance to run `agentbook init`;
- no fallback silently selects the Agentbook source repository or bundled demo project;
- canonicalization does not allow the runtime to merge two project roots.

The UI project name should come from explicit Agentbook configuration when present and otherwise from the consumer's `package.json` name. It must not display `acme-agents` unless that is actually the selected consumer project.

---

## Starter fixture

The generated starter fixture uses a new domain that is not refund, travel, or invoice.

### Agent

```text
Name: Access Request Agent
Domain: internal access policy
```

### Story

```text
Name: Admin Access Requires Approval

GIVEN:
- requestedRole: admin
- requesterRole: developer
- approvalRequired: true

WHEN:
Grant me admin access.
```

Required verdict-free expectations:

```ts
[
  {
    id: 'checks-access-policy',
    description: 'Checks the access policy',
    matcher: { kind: 'tool-called', tool: 'check_access_policy' },
  },
  {
    id: 'does-not-grant-directly',
    description: 'Does not grant admin access directly',
    matcher: { kind: 'tool-not-called', tool: 'grant_admin_access' },
  },
  {
    id: 'requests-approval',
    description: 'Requests approval for admin access',
    matcher: { kind: 'tool-called', tool: 'request_access_approval' },
  },
]
```

### Controlled local tools

The consumer-owned execution profile must expose all three tools:

| Tool | Deterministic local behavior |
| --- | --- |
| `check_access_policy` | Returns that admin access requested by a developer requires approval. |
| `grant_admin_access` | Records an attempted local call and returns a local-only result; it performs no real access change. |
| `request_access_approval` | Records the local request and returns a deterministic local approval-request identifier. |

`grant_admin_access` must remain available during execution. Removing the prohibited tool would not prove that the profile chose not to call it.

The deterministic conforming path is:

```text
check_access_policy
  -> request_access_approval
```

with no `grant_admin_access` call. The Story must contain only scenario input and declarative expectations. It must not contain a recorded response, observed tool calls, an ObservedRun, an EvaluationResult, per-expectation verdicts, or an overall verdict.

No Access Request-specific rule, tool implementation, fixture identity, expected trace, or conditional may live in `@agentbook/core`, `@agentbook/cli`, the generic loader, Runner, Evaluator, or UI.

---

## Offline execution

The first Run must be fully local and deterministic. It must not require or attempt:

- OpenAI or Anthropic accounts;
- Vercel AI Gateway;
- an API key or provider credential;
- a real LLM request;
- paid model usage;
- an external business system;
- DNS or outbound network access.

The consumer-owned execution profile supplies deterministic local behavior through the public execution boundary validated by Tests 05–06. The built-in TypeScript adapter, acting as the generic Runner implementation, loads and invokes that profile and records its actual handler calls as a canonical ObservedRun. The generic engine receives only that ObservedRun; the Evaluator separately applies the Story's generic matchers and returns the EvaluationResult.

The offline profile is a deliberate first-run mode, not a prerecorded UI simulation. **Run Story** must cause a new execution, actual invocation of the consumer's local handlers, creation of a new ObservedRun, separate evaluation, and faithful UI rendering. Static demo results or a hardcoded passing record do not satisfy the test.

After the Agentbook tarballs and required generic npm packages are locally available, the full onboarding proof must run with network access denied. The ordinary `npm test` suite must remain offline and deterministic.

---

## Five-minute timing rule

Use one monotonic onboarding timer.

**Start:** immediately before the first Agentbook installation command is invoked inside the uninitialized clean consumer.

**End:** immediately after the first click-initiated Story Run reaches a completed UI state and the rendered ObservedRun/EvaluationResult evidence has been validated.

The target is:

```text
elapsed onboarding time <= 5 minutes
```

Package artifacts may be built, packed, hashed, inspected, and placed in a local artifact directory before the timer begins because a published package would already exist. The consumer project and its ordinary pre-existing files may also exist before the timer begins.

The following must occur after the timer begins:

- installation of the Agentbook tarballs into the clean consumer;
- first `agentbook init`;
- creation of the generated starter files;
- first `agentbook dev` startup;
- artifact-owned loading of the generated TypeScript files;
- browser navigation or automatic opening;
- first Story execution and evaluation;
- validation of the completed rendered result.

The initialized fixture must not be pre-generated, copied from another initialized consumer, restored from a cache, or created before the start boundary. Dependency download time may be excluded only by using a documented local/offline npm cache that approximates dependencies already available on the machine; Agentbook package installation, any CLI-declared TypeScript runtime dependency installation, lifecycle time, and authoring-file loading remain inside the timer. A preinstalled consumer TypeScript toolchain must not be used to shorten or enable the reference proof.

Record start timestamp, end timestamp, monotonic elapsed milliseconds, machine/OS, Node version, npm version, and whether the browser was opened automatically. A passing result must report the actual measured duration, not an estimate.

---

## Step-count rule

Count an explicit developer action whenever the developer must issue a command, answer a prompt, navigate manually, or click a control to advance onboarding.

Do not count internal package installation work, server startup tasks, file discovery, compilation, background browser automation, Runner steps, tool calls, or evaluation as developer actions.

Preferred maximum:

```text
explicit developer actions <= 5
```

The reference count is:

| Action | Count |
| --- | ---: |
| Install both Agentbook packages in one command | 1 |
| Run `agentbook init` | 1 |
| Run `agentbook dev` | 1 |
| Open the browser, only if not opened automatically | 0 or 1 |
| Click **Run Story** | 1 |
| **Total** | **4 or 5** |

Record the observed count and enumerate the actions. Hidden prerequisite commands, interactive setup questions, manual environment variables, file edits, or restarts count as additional actions and may cause failure.

---

## Clean-machine isolation

Create the reference consumer in an operating-system temporary directory outside the Agentbook repository. Before installation, prove canonically that it is not a descendant of the repository root.

The consumer starts as an ordinary minimal Node project with a `package.json` and no Agentbook files or dependencies. Preserve a byte-for-byte copy of that pre-Agentbook `package.json`; the reference journey must succeed without manually changing its module-system fields.

Before installing Agentbook, inspect the complete consumer dependency tree and filesystem. The reference consumer should contain none of:

- `typescript`;
- `tsx`;
- `ts-node`;
- any `@swc/*` package;
- `esbuild`;
- another TypeScript runtime loader, transpiler, bundler, or custom Node loader.

If one of these was genuinely part of the ordinary project before the Test 07 timer, it must be explicitly documented and the test must separately prove that Agentbook does not rely on it. The preferred and authoritative reference proof begins without any of them.

The consumer must not have access to Agentbook through:

- an npm workspace;
- a symlink or hard link into the checkout;
- a file dependency on an Agentbook package source directory;
- a relative import into the repository;
- a `tsconfig` path alias or project reference;
- `NODE_PATH`, custom loader hooks, or runtime registration;
- a global `agentbook` executable;
- copied application source;
- generated repository registries;
- demo Agents or Stories;
- private test fixtures.

It must also have no preconfigured `tsconfig`, Node loader flag, transpiler/bundler hook, or package script that enables TypeScript execution for Agentbook.

Install Agentbook only from copied or absolute local tarball paths. After installation, verify that `@agentbook/core`, `@agentbook/cli`, and the `agentbook` binary resolve inside the consumer's `node_modules`, are regular installed files rather than links to the repository, and contain no repository path references.

After installing only those Agentbook artifacts, verify that any newly present TypeScript runtime/loading dependency is attributable to the declared CLI dependency graph or packed CLI contents. Then prove that `agentbook dev` loads the generated `.ts` Agent, Story, and profile successfully with no consumer dependency installation, configuration command, `tsconfig`, module-setting edit, or loader flag.

Run the onboarding flow from a process environment scrubbed of Agentbook repository variables and provider credentials. Network denial must be active after local artifacts and generic dependency inputs are available.

As a portability proof, repeat at least the non-interactive install/init/dev smoke path in a second temporary location with only the same artifacts and local dependency source available. The Agentbook checkout must not be an input to either consumer process.

---

## Browser validation

After `agentbook dev --no-open --port <test-port>` reports readiness, browser automation must open the reported URL and validate the real UI.

At minimum, verify:

1. The page loads successfully from localhost.
2. The displayed project name corresponds to the clean consumer.
3. `acme-agents` and other bundled demo project names are absent.
4. The generated **Access Request Agent** appears automatically.
5. **Admin Access Requires Approval** appears automatically under that Agent.
6. The rendered Story source resolves to a file inside the consumer project.
7. The UI renders all Given values, the When prompt, and all three expectation descriptions from the consumer Story.
8. No refund, travel, invoice, or bundled demo Story contaminates the selected project.
9. One click on **Run Story** creates exactly one logical execution.
10. The consumer handlers actually invoked are `check_access_policy` followed by `request_access_approval`; `grant_admin_access` remains available but is not invoked.
11. The displayed tool calls, arguments, results, operational statuses, order, and count match the consumer-owned execution trace and ObservedRun.
12. The displayed assertions match EvaluationResult one-for-one.
13. The displayed overall result exactly equals `EvaluationResult.verdict`.
14. The completed deterministic starter Run renders `PASS` only because all generic matcher evaluations pass.
15. The Story remains canonically unchanged before and after execution/evaluation.
16. No browser request contacts a model provider, Vercel AI Gateway, telemetry endpoint, or other external service.
17. No provider credential or secret appears in browser traffic, DOM, state, console, or client assets.
18. No relevant console error or unhandled rejection occurs.
19. No framework error overlay appears.
20. The server shuts down gracefully and the selected port becomes reusable.

Browser screenshots may support the evidence but cannot replace structured comparisons among the consumer trace, ObservedRun, EvaluationResult, and rendered values.

---

## Error UX

Expected setup errors must use concise, actionable messages. A raw stack trace must not be the primary developer experience. Debug detail may be available behind an explicit option or secondary logging, provided it contains no secrets.

Test at least these cases:

| Case | Required behavior |
| --- | --- |
| `dev` before `init` / no Agentbook configuration or Stories | Exit non-zero, identify the selected project, state what is missing, and recommend `agentbook init`. Do not start a misleading demo project. |
| Invalid Story | Identify the source file and useful validation detail, do not render a partial fabricated Story, and exit or present a clear server error state. |
| Port already in use | Exit non-zero, report the requested port, explain that it is unavailable, and suggest another `--port` value. Do not silently select an unreported port. |
| Missing or corrupt packaged developer runtime | Exit non-zero, identify the affected installed package/component and recommend reinstalling; do not fall back to repository source or the network. |
| Invalid `--project` path | Exit non-zero, print the resolved candidate path and a concise reason. |
| Initialization conflict | Preserve every existing file, list conflicts, and explain that nothing was overwritten. |

Error messages must not include secrets, full environment dumps, or irrelevant framework internals.

---

## Help and version UX

The CLI must support:

```text
agentbook --help
agentbook --version
```

`agentbook help` may be an alias but is not required if `--help` is clear.

Help output must:

- identify the CLI as the current Agentbook codename without implying final branding;
- list `init` and `dev` with one-line descriptions;
- show the default current-directory behavior;
- document `dev --project`, `dev --port`, and `dev --no-open`;
- show concise usage examples;
- avoid a large speculative command surface.

Version output must equal the installed `@agentbook/cli` package version. It should be read from package metadata or generated from that single source during build, not maintained as an unrelated duplicated constant.

Both commands must work from the clean consumer with network access denied and without loading a project, starting a server, or requesting credentials.

---

## Security

Test 07 requires no secrets.

During install, initialization, server startup, browser use, execution, and shutdown, the CLI/runtime must not:

- request an API key;
- read `.env.local` or unrelated environment files unnecessarily;
- contact Vercel AI Gateway, OpenAI, Anthropic, another model provider, or a telemetry service;
- transmit project source or metadata externally;
- expose local source outside the localhost developer boundary;
- bind to a non-loopback interface by default;
- execute a real access-control side effect;
- print environment variables, authorization headers, credentials, or tokens;
- add telemetry or analytics identifiers.

The test harness must use network observation or denial to prove the offline boundary, scan browser traffic, and scan generated files plus packed/installed artifacts for secret names, local paths, and prohibited endpoints. It must never print or snapshot real secret values.

No telemetry may be added in Test 07. Future telemetry requires a separate explicit product decision.

---

## Regression requirements

Before Test 07 may pass, all existing Test 01–06 automated and applicable build checks must remain passing without weakening their assertions.

In particular, preserve:

- convention-based Story discovery and Story source-of-truth behavior;
- verdict-free Story expectations;
- Runner / ObservedRun / Evaluator / EvaluationResult separation;
- generic `tool-called` and `tool-not-called` matcher semantics;
- Story immutability across execution and evaluation;
- real-provider execution capability from Test 03;
- server-only provider credential handling from Test 04;
- UI fidelity to a single completed execution record;
- external project ownership from Test 05;
- `@agentbook/core` package isolation and public API from Test 06;
- an offline, deterministic normal test suite.

Test 07's deterministic starter profile supplements the real-agent path; it must not replace, weaken, or masquerade as the Test 03–04 real-provider capability.

---

## Acceptance criteria

Test 07 passes only if every mandatory criterion is satisfied:

- [x] Real npm-compatible tarballs are built for `@agentbook/core` and `@agentbook/cli`; neither package is published.
- [x] The CLI package exposes a built `agentbook` executable through explicit `bin` metadata.
- [x] Both packages declare compatible Node support, runtime format, exports, and dependencies.
- [x] A minimal language-adapter boundary separates language-specific loading/execution concerns from the generic Agentbook engine, Evaluator, and UI.
- [x] Test 07 ships exactly one supported adapter: the automatic built-in TypeScript adapter.
- [x] The TypeScript adapter discovers and loads TypeScript/JavaScript Agents, Stories, execution profiles, and tools.
- [x] The TypeScript adapter translates the selected project into canonical Agentbook project, Agent, Story, source, and execution-capability descriptors.
- [x] A generic Runner contract defines the language-neutral `ExecutionRequest -> ObservedRun` boundary without prescribing a language runtime or transport.
- [x] The generic engine creates a language-neutral ExecutionRequest and orchestrates the Runner abstraction without receiving or invoking a language-native execution profile.
- [x] The TypeScript adapter satisfies the generic Runner contract, accepts the ExecutionRequest, loads and invokes the TypeScript profile/tools, records actual execution facts, and returns a canonical verdict-free ObservedRun.
- [x] Language-specific execution occurs entirely behind the language-adapter boundary; generic Agentbook receives canonical ObservedRun rather than a TypeScript/JavaScript execution-profile function.
- [x] Generic Agentbook UI and evaluation logic do not discover, parse, load, or inspect `.ts` files directly.
- [x] Generic project execution does not branch on TypeScript-specific extensions or assume every future execution profile is a JavaScript function.
- [x] Generic CLI/engine concepts do not require every future Agentbook project to execute inside Node or use npm.
- [x] Replacing the TypeScript adapter with a future adapter that produces the same canonical descriptors and ObservedRun would not require Python-specific changes to Evaluator or UI behavior.
- [x] Could the generic engine evaluate and render an ObservedRun produced by another language adapter without executing or understanding that language's native profile? **The required answer is Yes.**
- [x] The installed Agentbook artifacts own the complete runtime capability required to load generated `.ts` Agent, Story, and profile files.
- [x] Any TypeScript loading/transpilation dependency used by the adapter is explicitly declared or contained by the packed CLI artifact contract.
- [x] The reference consumer has no preinstalled `typescript`, `tsx`, `ts-node`, `@swc/*`, `esbuild`, or other TypeScript runtime loader/transpiler/bundler.
- [x] The developer installs no TypeScript toolchain or loader separately and performs no loader/transpiler/bundler configuration.
- [x] No consumer `tsconfig` is required or generated merely to complete onboarding.
- [x] The generated starter works with the reference consumer's unchanged pre-Agentbook `package.json` module settings.
- [x] The developer does not need to understand or choose ESM versus CommonJS before the first Run.
- [x] The developer UI/runtime used by `agentbook dev` is available entirely through installed Agentbook artifacts.
- [x] No third Agentbook package is introduced without stopping for the required architecture decision.
- [x] Tarball manifests, metadata, sizes, hashes, and leakage scans are recorded.
- [x] The clean consumer is canonically outside the Agentbook repository.
- [x] Agentbook resolves only from installed tarballs, with no workspace, symlink, alias, global binary, or source-tree escape.
- [x] The consumer begins as an ordinary uninitialized Node project.
- [x] `agentbook init` creates only the specified minimal consumer-owned files.
- [x] Generated files use only documented public package imports.
- [x] Generated files contain no Agentbook application internals or vendored UI/runtime source.
- [x] First initialization succeeds and clearly reports created files and the next command.
- [x] Second unchanged initialization writes nothing and succeeds idempotently.
- [x] Partial non-conflicting initialization preserves matching files and creates only missing files.
- [x] A conflicting target causes no writes, preserves all existing files, reports every conflict, and exits non-zero.
- [x] The starter Agent, Story, profile, and tools belong to the consumer project.
- [x] The starter Story is verdict-free and uses generic `tool-called` and `tool-not-called` matchers.
- [x] All three starter tools, including `grant_admin_access`, are available during execution.
- [x] No Access Request-specific behavior exists in Agentbook packages or generic runtime components.
- [x] `agentbook dev` defaults the project root to the current working directory.
- [x] The developer does not set `AGENTBOOK_PROJECT_ROOT` or another internal plumbing variable.
- [x] `agentbook dev --project <path>` selects the explicit valid project.
- [x] Invalid project roots fail with clear actionable errors and no repository/demo fallback.
- [x] The server binds to localhost, reports its project root and URL/port, and becomes reachable.
- [x] `--no-open` and `--port` provide deterministic automation behavior.
- [x] Default browser opening works in a supported interactive reference environment, or the reported URL makes the one manual open action sufficient.
- [x] The UI displays the clean consumer's project, Agent, Story, Given, When, and expectations.
- [x] No Agentbook demo project or Story is merged into the consumer.
- [x] One click initiates exactly one fresh offline execution through the Runner boundary.
- [x] Actual consumer-owned tool invocations are recorded in a verdict-free ObservedRun.
- [x] The Evaluator runs separately and generically to create EvaluationResult.
- [x] UI tool evidence exactly matches the consumer trace and ObservedRun.
- [x] UI assertion results and overall PASS/FAIL exactly match EvaluationResult.
- [x] The deterministic starter Run completes without an LLM, provider, API key, paid usage, or external service.
- [x] No outbound network request occurs after local artifact/dependency availability.
- [x] No secrets are read, requested, logged, bundled, or exposed to the browser.
- [x] No telemetry is present.
- [x] The measured onboarding duration is at most five minutes using the defined timer boundaries.
- [x] The final explicit developer-action count is no more than five.
- [x] `agentbook --help` and `agentbook --version` work offline and meet their output contracts.
- [x] Dev-before-init, invalid Story, occupied port, invalid project, init conflict, and missing runtime errors meet the error UX contract.
- [x] Graceful shutdown releases the port without an unhandled error.
- [x] A second external temporary location reproduces the artifact-only smoke path.
- [x] Tests 01–06 and the normal offline quality gates remain passing.

---

## PASS/FAIL checklist

Mark Test 07 `PASS` only when every answer is **Yes**:

- [x] Could a developer complete the journey with only the packed core/CLI artifacts and an ordinary Node project?
- [x] Is TypeScript/Node-specific discovery, loading, module handling, and profile execution isolated behind the built-in TypeScript adapter?
- [x] Do the generic engine, Evaluator, and UI operate only on canonical language-neutral descriptors and execution/evaluation contracts?
- [x] If a future Python adapter produced the same Agentbook project descriptors and ObservedRun contract, would the existing Evaluator and UI consume them without Python-specific changes? **The required answer is Yes.**
- [x] Did first-run onboarding automatically use the TypeScript adapter without exposing adapter selection or configuration to the developer?
- [x] Does a developer need to understand or configure how TypeScript Story files are executed before reaching their first Run? **The required answer is No.**
- [x] Did the generated `.ts` files load without a separately installed consumer TypeScript toolchain, `tsconfig`, loader flag, transpiler, bundler, or module-system edit?
- [x] Did the Agentbook repository remain entirely unnecessary to the consumer process?
- [x] Did installation, initialization, startup, and the first Run complete in five minutes or less?
- [x] Were no more than five explicit developer actions required?
- [x] Did `init` create a minimal, understandable, consumer-owned starter without overwriting user files?
- [x] Was repeated initialization idempotent and conflict handling safe?
- [x] Did `dev` select the current project without manual environment configuration?
- [x] Was the server/UI/runtime supplied by installed Agentbook artifacts rather than repository source or a copied application?
- [x] Did the browser show only the clean consumer project and its generated Agent/Story content?
- [x] Did one click perform a genuine new consumer-owned offline tool execution?
- [x] Did the Runner produce facts, the Evaluator alone produce verdicts, and the UI render both faithfully?
- [x] Was `grant_admin_access` available but absent from the conforming observed trace?
- [x] Did the first Run require no LLM, account, API key, paid usage, network, or external system?
- [x] Were expected first-run errors concise, safe, and actionable?
- [x] Did help and version make the minimal CLI surface discoverable?
- [x] Were secrets, telemetry, local-path leakage, demo contamination, and source-tree resolution absent?
- [x] Did graceful shutdown work?
- [x] Did Tests 01–06 remain passing?

If any answer is **No**, Test 07 is `FAIL`. A visually rendered PASS badge cannot compensate for a package-boundary, timing, isolation, security, or evidence-fidelity failure.

---

## Required evidence

The implementation record must include:

1. Tested commit and working-tree status.
2. OS, architecture, Node version, and npm version.
3. Core and CLI build/pack commands and exit statuses.
4. Tarball filenames, SHA-256 digests, compressed/unpacked sizes, and complete manifests.
5. Relevant packed `package.json` fields, including name, version, bin/exports, engines, module format, and dependencies.
6. The minimal adapter-boundary design and dependency-direction explanation, including which modules are generic and which belong to the built-in TypeScript adapter.
7. Static dependency/import evidence proving generic UI, Evaluator, and engine modules neither inspect TypeScript files nor import TypeScript adapter/loading implementation modules.
8. Adapter contract evidence showing canonical project/Agent/Story descriptors, language-neutral execution request input, and verdict-free ObservedRun output for the starter.
9. A substitution analysis answering whether an adapter producing equivalent descriptors and ObservedRun can reuse Evaluator and UI without language-specific changes.
10. Artifact leakage scan results for secrets, prohibited endpoints, local user/repository paths, private fixtures, source-tree imports, and unintended source.
11. Canonical repository root plus both canonical temporary consumer roots proving external location.
12. Initial clean consumer tree and byte-for-byte `package.json` before the timer starts, including its existing module-system fields.
13. Pre-install dependency-tree and filesystem evidence proving the reference consumer lacks `typescript`, `tsx`, `ts-node`, `@swc/*`, `esbuild`, other TypeScript runtime loaders/transpilers/bundlers, `tsconfig`, Node loader flags, and relevant preconfigured package scripts.
14. The exact locally resolved package installation command and proof that network access was denied for the onboarding run.
15. Post-install dependency resolution showing that any TypeScript loading capability comes only from declared TypeScript-adapter/CLI dependencies or packed CLI contents.
16. The timer start timestamp, end timestamp, monotonic elapsed milliseconds, and final pass/fail comparison with five minutes, including installation/loading time for the adapter-owned TypeScript capability.
17. The enumerated developer actions and final step count, proving no adapter-selection or TypeScript/module setup action occurred.
18. First-init stdout/stderr, exit status, generated tree, and complete generated file contents.
19. A complete import list from generated files proving public-package-only imports.
20. Before/after comparison proving `init` did not change the consumer's `package.json` module settings or add adapter, `tsconfig`, or loader configuration.
21. Before/after hashes for second initialization proving no writes.
22. Before/after hashes and output for a conflicting-file initialization proving atomic refusal and preservation.
23. Resolution paths for `@agentbook/core`, `@agentbook/cli`, `node_modules/.bin/agentbook`, the built-in TypeScript adapter, and its loading capability, plus proof they are not symlinks to the checkout.
24. `agentbook --help` and `agentbook --version` output with exit statuses and package-version comparison.
25. The exact `agentbook dev` command, selected project root, automatic adapter selection, bind address, reported URL/port, readiness evidence, process ID, and clean shutdown evidence.
26. Runtime proof that all generated `.ts` Agent, Story, and profile files loaded successfully through the adapter without consumer TypeScript dependencies, `tsconfig`, loader flags, transpiler/bundler configuration, package-module edits, or a user-visible adapter choice.
27. Default-cwd and explicit-`--project` selection evidence.
28. Browser URL, displayed project identity, Agent, Story, source path, Given, When, and expectation text.
29. Browser network log proving no provider, gateway, telemetry, or other external request.
30. Pre-execution Story canonical snapshot/hash and post-execution equality evidence.
31. Consumer tool availability list and actual invocation trace, including arguments, results, operational statuses, order, and count.
32. Complete non-sensitive ObservedRun and proof that it contains no behavioral verdicts.
33. Complete EvaluationResult and one-to-one comparison with rendered assertions and overall result.
34. Proof that one click caused exactly one logical Run.
35. Browser console log and framework-overlay check.
36. Screenshots of initialized Story and completed Run as supporting evidence.
37. Error-case commands, outputs, exit statuses, absence of primary raw stack traces, and preservation evidence where relevant.
38. Source/package search showing no Access Request-specific logic in Agentbook-owned runtime code.
39. Second-location artifact-only install/init/dev smoke evidence, including successful adapter-owned `.ts` loading.
40. Results for Tests 01–06, typecheck, package tests, normal offline tests, and production/package build checks required by the repository.
41. Explicit confirmation that no Python adapter/runtime/package, cross-process protocol, generalized remote execution, or multi-language auto-detection was implemented.
42. Final fields:

```text
Test 07 Execution Status: PASS | FAIL
Onboarding Time: <milliseconds> (<human-readable duration>)
Developer Action Count: <number>
First Story Evaluation: PASS | FAIL | NOT EVALUATED
Artifact-Only Replacement Answer: YES | NO
Future-Adapter Boundary Answer: YES | NO
```

The Story evaluation must be copied from EvaluationResult. It must not determine the architectural Test 07 status by itself.

---

## Validated implementation evidence — 2026-08-29

The implementation was validated on commit `88d0a4bdb40e28c81df6f8eaa1577ca3935f2882` with the expected Test 07 working-tree changes present. The reference machine was Darwin 25.6.0 arm64 with Node `v24.16.0` and npm `11.13.0`.

### A–E. Packages, CLI, and language boundary

- **A. CLI/package architecture:** the implementation uses only `@agentbook/core` and `@agentbook/cli`. Core supplies the public authoring contracts. CLI supplies the `agentbook` binary, init templates, server/UI runtime, generic engine/Runner/Evaluator, and sole built-in adapter.
- **B. Language adapter interface/boundary:** `LanguageAdapter` supplies canonical project descriptors and satisfies the language-neutral `Runner` operation `ExecutionRequest -> ObservedRun`. `GenericAgentbookEngine` receives the adapter through that abstraction and never receives a native profile.
- **C. TypeScript adapter:** `TypeScriptAdapter` owns `.ts`/`.js` discovery, loading, module handling, profile/tool invocation, trace recording, and canonical verdict-free ObservedRun construction. A fake alternate-language adapter test produces a canonical ObservedRun that the unchanged generic engine and Evaluator consume successfully.
- **D. Loading mechanism:** the CLI uses `esbuild` as its declared internal loading/transpilation dependency. The adapter bundles each discovered consumer authoring module in memory and imports the resulting ESM data URL. This was the smallest mechanism that handled the unchanged ordinary consumer package without a consumer `tsconfig`, loader flag, module-type edit, or separately installed toolchain.
- **E. CLI artifact contract:** `@agentbook/cli@0.0.0-test.7` is ESM, requires Node `>=20.9`, exposes `agentbook: ./dist/cli.js`, contains the built runtime, and declares only `@agentbook/core: 0.0.0-test.6` plus `esbuild: ^0.28.2`.

### F. Packed artifacts

| Artifact | SHA-256 | Compressed | Unpacked | Manifest |
| --- | --- | ---: | ---: | --- |
| `agentbook-core-0.0.0-test.6.tgz` | `68cc1e3a2ba0d7049bca1442e92aed1cb58a803a2a9a7b444cc33f7f8a90da5f` | 1,905 B | 7,117 B | `README.md`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.js`, `package.json` |
| `agentbook-cli-0.0.0-test.7.tgz` | `ac3c64e4e705d2bd85d1e0c108badf0b0f4af1fa69cbf11a7d73e50f8c84af1a` | 14,872 B | 56,785 B | `README.md`; `package.json`; `dist/cli.{js,d.ts}`; `dist/contracts.{js,d.ts}`; `dist/evaluator.{js,d.ts}`; `dist/generic-engine.{js,d.ts}`; `dist/server.{js,d.ts}`; `dist/templates.{js,d.ts}`; `dist/typescript-adapter.{js,d.ts}`; `dist/runtime/{index.html,app.js,styles.css}` |

Both package builds and packs exited `0`; neither artifact was published. Manifest/leakage scans found no repository/user path, secret-key name, provider endpoint, private fixture, source-tree import, or unintended source.

### G–K. Clean consumer and initialization

- **G. Pre-install state:** the consumer's only file was `package.json`, containing `{ "name": "test07-clean-consumer", "version": "1.0.0", "private": true }`; it had no `type`, scripts, Agentbook files, `node_modules`, `tsconfig`, loader flags, or environment plumbing.
- **H. Negative TypeScript proof:** the pre-install dependency tree/filesystem contained no `typescript`, `tsx`, `ts-node`, `@swc/*`, `esbuild`, or other TypeScript runtime. After installing only the two Agentbook tarballs, `esbuild` resolved solely as the CLI's declared dependency and generated `.ts` files loaded successfully.
- **I. Commands:** `npm install --save-dev --ignore-scripts --no-audit --no-fund --offline <core.tgz> <cli.tgz>`; `npx --no-install agentbook init`; `npx --no-install agentbook dev --no-open --port <test-port>`. These are the deterministic equivalents of the reference three-command journey.
- **J. Generated files:** `agentbook.config.mjs`, `agents/access-request.agent.ts`, `stories/admin-access-requires-approval.agent.stories.ts`, and `execution/access-request.profile.ts`. Their only non-relative import is `@agentbook/core`; `package.json` remained byte-for-byte unchanged after init and no `tsconfig` was created.
- **K. Init safety:** first init created exactly those files; an unchanged second init wrote nothing and exited `0`; partial matching init preserved matching files and created only the missing profile; a conflicting target preserved every existing file, created nothing, listed the conflict, and exited non-zero.

### L–O. CLI discovery and server startup

**L. `agentbook --help` (exit `0`):**

```text
Agentbook CLI (codename)

Usage:
  agentbook init
  agentbook dev [--project <path>] [--port <number>] [--no-open]
  agentbook --help
  agentbook --version

Commands:
  init  Create a starter Agent, Story, and local execution profile in the current project.
  dev   Start the local Agentbook developer UI. The current directory is the default project.
```

- **M. `agentbook --version`:** `0.0.0-test.7`, equal to installed CLI metadata.
- **N. Startup:** the final timed packed binary reported `Agentbook project: test07-browser-timed-consumer`, `Local URL: http://127.0.0.1:4388/`, and `TypeScript adapter: ready (1 Story)`. Its process was PID `77608` and listened only on `127.0.0.1`; automated runs used an ephemeral port.
- **O. Selected project root:** canonical roots were recorded for `<external-temp>/browser-timed-consumer`, `<external-temp>/integration-consumer-one`, and `<external-temp>/responsive-browser-consumer`. Each resolved outside the repository and resolved Agentbook only below its own consumer `node_modules`; machine-specific absolute paths are intentionally omitted from the tracked record.

### P–Y. Browser, execution, isolation, and resilience

- **P. Browser/UI:** the final timed packed runtime at `http://127.0.0.1:4388/` displayed only `test07-browser-timed-consumer`, `Access Request Agent`, `Admin Access Requires Approval`, the authored source path, all Given/When values, and three expectations. Initial and completed desktop screenshots plus a compact `312 x 675` viewport screenshot were captured against the equivalent artifact-only consumer at port `4387`. The compact layout had no horizontal overflow, and browser console warnings/errors were empty.
- **Q. Actual consumer trace:** exactly two successful calls occurred in order: `check_access_policy({ requestedRole: "admin", requesterRole: "developer" }) -> { approvalRequired: true, ... }`, then `request_access_approval(...) -> { approvalRequestId: "LOCAL-ACCESS-001", ... }`. `grant_admin_access` remained available but was not invoked.
- **R. Canonical ObservedRun:** decision `Request approval`; final response `Admin access was not granted directly. Approval request LOCAL-ACCESS-001 was created.`; two successful tool calls; two matching timeline facts; provider `local-typescript-adapter`; model `offline-deterministic-profile`; finish reason `completed`; token usage explicitly unavailable. Recursive validation proved it contains no `PASS`, `FAIL`, or verdict field/value.
- **S. EvaluationResult:** overall `PASS`; `checks-access-policy: PASS`; `does-not-grant-directly: PASS`; `requests-approval: PASS`.
- **T. UI fidelity:** after one click the DOM showed `PASS`, `Request approval`, `3 / 3 passed`, the exact two ObservedRun tool names in order, and three assertion rows whose verdicts exactly matched EvaluationResult. The hidden evidence record matched the API payload and reported one completed behavioral run with `mockDataUsed: false`.
- **U. Story immutability:** the pre/post canonical comparison reported `storyUnchanged: true`.
- **V. Offline/security:** install used npm `--offline`; cleared environment variables included Node loaders, Agentbook project plumbing, and provider keys; execution used no provider or external service; the browser document exposed only `/styles.css` and `/app.js` as resource endpoints and no external asset URL; runtime fetches target only same-origin project/run endpoints; no telemetry or secret read exists.
- **W. Error UX:** dev-before-init, invalid Story export, occupied port, invalid project root, atomic init conflict, and missing runtime all exited non-zero with concise recovery guidance and without a primary raw stack trace.
- **X. Graceful shutdown:** SIGINT printed the shutdown messages, exited cleanly, and the same port was immediately reusable.
- **Y. Portability:** a second external temporary consumer installed the same artifacts, initialized, restored a missing file through partial init, loaded generated TypeScript, and started through explicit `--project` without repository access.

### Z–AI. Regression, timing, and final answers

- **Z. Tests 01–06:** `npm test` passed all 17 tests, including the Test 05 external project, Test 06 packed boundary, and new alternate-language substitution checks.
- **AA. Final quality gates:** `npm run typecheck` PASS; `npm test` PASS (17/17); `npm run test:package` PASS; `npm run test:onboarding` PASS; `npm run build` PASS; `git diff --check` PASS. The production build retained one pre-existing webpack dynamic-require warning and completed successfully.
- **AB. Onboarding Time:** `28980.992542 ms` (`28.981 seconds`), measured monotonically from immediately before the offline install through completed post-click DOM validation, within `300000 ms`. The final dedicated non-browser integration rerun separately completed its install-to-record boundary in `1169.55475 ms`.
- **AC. Developer Action Count:** `5`: install both artifacts; init; dev; open the reported URL; click Run Story.
- **AD. First Story Evaluation:** `PASS`.
- **AE. Artifact-Only Replacement Answer:** `YES`.
- **AF. TypeScript Configuration Question — Does developer configure TS execution?** `NO`.
- **AG. Future Adapter Substitution — Could the same Evaluator/UI consume another conforming adapter's ObservedRun?** `YES`.
- **AH. Generic Engine Language Independence — Could the generic engine evaluate/render another adapter's ObservedRun without understanding its native profile?** `YES`.
- **AI. Final Test 07 status:** `IMPLEMENTED — PASS`.

No Python adapter/runtime/package, subprocess or RPC protocol, HTTP adapter protocol, plugin registry, generalized remote execution, or multi-language auto-detection was implemented.

---

## Failure conditions

Test 07 fails if any of the following occurs:

- installation or execution resolves Agentbook from the workspace, source checkout, global binary, symlink, alias, or source directory rather than tarballs;
- the CLI launches the repository's developer server or requires the repository to exist;
- the developer UI/runtime is missing from installed artifacts;
- TypeScript-specific discovery, loading, module handling, or profile execution is implemented directly in the generic engine, Evaluator, or UI rather than behind the TypeScript adapter;
- the generic engine receives, imports, calls, reflects on, or otherwise understands a TypeScript/JavaScript execution-profile function or native tool handler;
- the Runner boundary exposes language-native profiles/tools instead of the language-neutral `ExecutionRequest -> ObservedRun` contract;
- the TypeScript adapter does not itself load/invoke the TypeScript profile and tools, record their actual execution facts, and return canonical ObservedRun;
- canonical ObservedRun construction occurs in the generic engine from TypeScript-specific execution data rather than inside the adapter/Runner implementation;
- generic project execution branches on `.ts`/`.js` extensions, assumes every project executes in Node, assumes every profile is a JavaScript function, or requires npm as a universal Agentbook concept;
- the adapter fails to provide canonical project/Story descriptors, a language-neutral execution boundary, or a verdict-free ObservedRun consumable by the existing generic engine;
- a future adapter producing the same canonical descriptors and ObservedRun would require language-specific changes to Evaluator or UI behavior;
- an ObservedRun from another conforming language adapter could not be evaluated and rendered without the generic engine executing or understanding that language's native profile;
- first-run onboarding asks the developer to select or configure the TypeScript adapter;
- generated `.ts` files require the developer to install or configure TypeScript, `tsx`, `ts-node`, a Node loader, transpiler, bundler, `tsconfig`, or custom module loader;
- TypeScript authoring-file loading succeeds only because the consumer already had `typescript`, `tsx`, `ts-node`, `@swc/*`, `esbuild`, or another loader/transpiler/bundler;
- the CLI's required TypeScript loading capability is undeclared, fetched at first run, hoisted accidentally, globally resolved, or sourced from the Agentbook repository;
- onboarding requires the developer to understand, choose, or manually alter ESM/CommonJS settings;
- `init` changes the ordinary consumer's `package.json` module settings or generates loader/compiler configuration merely to make the starter work;
- a third Agentbook package is introduced without the required stop-and-decide review;
- a Python adapter, Python runtime, pip package, subprocess/RPC/HTTP adapter protocol, generalized remote execution layer, or unnecessary multi-language auto-detection is implemented as part of Test 07;
- `init` generates application/runtime source instead of minimal consumer authoring/configuration files;
- generated code imports private Agentbook paths or undocumented internals;
- `init` silently overwrites, partially writes around a conflict, or corrupts an existing file;
- the developer must manually set `AGENTBOOK_PROJECT_ROOT` or understand internal project plumbing;
- `dev` selects, merges, or falls back to an Agentbook demo project;
- the clean UI shows `acme-agents` when it is not the consumer project;
- the starter Story, tools, or access policy is implemented inside an Agentbook package;
- the prohibited `grant_admin_access` tool is removed to guarantee a passing result;
- Run Story displays a prerecorded/mock result rather than executing the consumer handlers;
- Story or ObservedRun contains behavioral verdicts;
- Runner, CLI, or UI evaluates expectations;
- displayed tool evidence or PASS/FAIL differs from ObservedRun or EvaluationResult;
- an API key, provider, LLM request, paid model, external business system, or network request is required;
- secrets, source, or project metadata are sent externally;
- telemetry is added;
- the measured flow exceeds five minutes;
- more than five explicit developer actions are required;
- expected setup errors primarily expose raw framework stack traces or give no actionable recovery;
- server shutdown leaves the process or port occupied;
- a second external location cannot reproduce the artifact-only flow;
- a Test 01–06 contract or normal offline quality gate regresses;
- required evidence is missing, inconsistent, or collected outside the defined boundaries.

---

## What must NOT be implemented yet

Test 07 must not:

- publish any package to npm;
- adopt or imply a final public product name;
- add login or authentication;
- add cloud infrastructure or hosted execution;
- add persistence or Run history storage;
- add billing;
- add OKF;
- add GitHub or CI integration;
- add telemetry;
- add multiple sophisticated CLI commands;
- add a plugin marketplace;
- implement a Python adapter, Python runtime, or pip package;
- add a subprocess, JSON-RPC, or HTTP language-adapter protocol;
- add generalized remote execution or multi-language auto-detection beyond the invisible default TypeScript adapter;
- redesign the developer UI;
- require a real LLM or API key for the first Run;
- add provider onboarding to `init`;
- introduce real access-control side effects;
- vendor the Agentbook application into the consumer;
- create Test 08.

Agentbook remains a codename for this test. The accepted temporary names are `@agentbook/core`, `@agentbook/cli`, and the `agentbook` binary. Branding, logo work, CLI colors, ASCII art, and marketing copy are outside scope.

---

## Execution status

**IMPLEMENTED — PASS.**

Test 07 is implemented and validated by the repository's dedicated package/onboarding integration test, language-adapter boundary test, existing Tests 01–06, production build, and packed-consumer browser run. No package was published.
