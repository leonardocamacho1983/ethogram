# Test 06: Installable Package Boundary

## Execution status

**IMPLEMENTED — PASS.**

This document defines the acceptance contract and validated execution record for Test 06.

---

## Objective

Prove that the intended public Agentbook developer API can be built as a real installable package and consumed by a genuinely clean project that has no access to Agentbook repository internals.

The test must answer this architectural question:

> Can `@agentbook/core` be built as an installable package and consumed by a clean project without access to Agentbook repository internals?

The decisive replacement question is:

> If I upload only the packed `@agentbook/core` artifact to another computer that has never seen the Agentbook repository, can a developer install it and author valid Agentbook Stories?

The answer must be **Yes** for Test 06 to pass.

---

## Why this test matters

Test 05 proved the conceptual external-project boundary: a separate project can use the intended package name and pass its own Agent, Story, execution profile, and local tools through generic Agentbook loading and execution boundaries.

That proof still occurs inside the Agentbook workspace. The current pre-package boundary may be resolved by workspace linking, TypeScript source imports, repository-relative paths, root configuration, or other development conveniences that will not exist for an ordinary package consumer.

Test 06 must replace that conceptual boundary with a physical package boundary. It must prove that the public API is separable from:

- `app/*`;
- React and the Agentbook UI;
- internal `lib/agentbook/*` filesystem paths;
- generated Story registries;
- demo Agents and Stories;
- private test fixtures;
- Agentbook repository TypeScript aliases;
- npm workspace linking or source-tree resolution.

Passing this test establishes that `@agentbook/core` is a distributable developer library rather than an alias for code that remains structurally owned by the application repository.

---

## Validated architectural contracts from Tests 01–05

Test 06 extends the existing architecture without weakening it:

| Test | Validated contract | Status |
| --- | --- | --- |
| Test 01 | Code-first Stories are the source of truth and are discovered by convention without presentation registration. | `PASS` |
| Test 02 | `Story -> Runner -> ObservedRun -> Evaluator -> EvaluationResult`; Stories and observations are verdict-free, and only evaluation owns behavioral verdicts. | `PASS` |
| Test 03 | Genuine tool-capable model execution can occur through the Runner architecture while preserving Story purity and credential safety. | `PASS` |
| Test 04 | The UI renders the real `ObservedRun` and `EvaluationResult` without inventing, duplicating, or evaluating behavioral evidence. | `PASS` |
| Test 05 | A separately owned project can define, load, execute, evaluate, and display a new Agent and Story through generic external-project boundaries. | `PASS` |

Test 06 must not move evaluation into a Story, Runner, package authoring helper, or UI; add verdicts to `StoryExpectation` or `ObservedRun`; introduce fixture-specific logic; expose credentials; or make the normal test suite contact a provider.

---

## Hypothesis

Given a built `@agentbook/core` package artifact and a clean temporary consumer located outside the Agentbook repository, the consumer should be able to:

1. install only the packed artifact and its declared public dependencies;
2. import the supported API by the package name `@agentbook/core`;
3. define a completely new Agent and verdict-free Story;
4. use the supported matcher types and, if retained as public API, the external execution-profile/tool contracts;
5. compile without an Agentbook path alias, workspace link, or source checkout;
6. execute the minimum runtime behavior exported by the package;
7. run after the consumer has been copied or created outside the Agentbook repository.

The intended proof flow is:

```text
Agentbook repository
  -> build @agentbook/core
  -> npm pack
  -> package tarball
  -> clean temporary consumer outside the repository
  -> npm install <absolute-or-copied-local-tarball>
  -> import from @agentbook/core
  -> TypeScript compile
  -> execute minimal local runtime smoke test
```

The tarball, not the Agentbook source tree, is the only permitted source of Agentbook package code during consumer installation, compilation, and execution.

---

## Public API under test

The package must expose the smallest coherent developer-facing API. Test 06 must make and record an explicit export decision rather than copying every type currently reachable from the workspace package.

### Required authoring surface

The root export `@agentbook/core` must provide:

- `defineAgent`;
- `defineStory`;
- `Story`;
- `StoryExpectation`;
- `ExpectationMatcher`;
- the concrete generic matcher types required to author supported `tool-called` and `tool-not-called` expectations, either directly or through a documented discriminated union;
- any input type, such as `StoryInput`, that a normal consumer genuinely needs to type reusable Story factories.

These belong in core because they define the code-first authoring contract validated by Tests 01, 02, and 05.

### Conditional execution-profile surface

Test 05 currently uses `defineExecutionProfile` plus generic external profile, context, outcome, tool-definition, and tool-set types. Before implementing Test 06, the package design must choose one of two acceptable outcomes:

1. **Retain the Test 05 external execution contract in core.** Export `defineExecutionProfile` and the minimum `ExternalExecutionProfile`, `ExternalExecutionContext`, `ExternalExecutionOutcome`, `ExternalToolDefinition`, and `ExternalToolSet` types needed by a clean project. The consumer fixture must compile and run a local profile/tool smoke test.
2. **Deliberately move that contract to another documented public package or entry point.** Update the Test 05 fixture and architectural documentation through a generic migration, preserve all Test 05 behavior, and test the replacement public import path from the packed artifact that owns it.

Silently dropping the Test 05 contract, leaving it available only through a private filesystem path, or exporting its implementation accidentally is not acceptable.

### Types that are not automatically public

The following must not be exported merely because the current repository or Test 05 can reach them:

- UI presentation types, demo status fields, simulation types, comparison types, and recorded demo-run types;
- generated registry types or discovery implementation types;
- project-loader implementation details;
- concrete Runner implementations;
- provider/model integration types;
- internal validation helpers;
- `ObservedRun` and `EvaluationResult`, unless a documented public integration use case requires consumers to exchange these values through this package.

If `ObservedRun`, `EvaluationResult`, or another operational type remains exported, the implementation report must identify the public consumer operation that requires it and prove that the export does not couple core to the UI, provider implementation, or private Runner/Evaluator code.

The package may use internal modules to implement its public API, but consumers must not be able or required to import undocumented internal subpaths.

---

## Package isolation boundary

The test must use a real package artifact produced by `npm pack` or an equivalent npm-compatible packing flow. Direct workspace consumption is not proof.

The clean consumer must be created in an operating-system temporary directory or another canonical directory outside the Agentbook repository. Before installation, the harness must prove that the consumer path is not a descendant of the repository root.

The consumer must not have:

- an Agentbook source checkout copied into it;
- `../../lib/agentbook` or another relative import into the repository;
- `app/*`;
- `generated-story-registry`;
- demo fixtures;
- private Test 01–05 fixtures;
- a `tsconfig` path alias that resolves into Agentbook;
- a symlink into the Agentbook repository;
- a workspace declaration that includes Agentbook or its package directory;
- `NODE_PATH`, a loader hook, or runtime registration that exposes Agentbook source;
- a file dependency pointing at the package source directory instead of the packed tarball.

The installed package under the consumer's `node_modules` must resolve entirely from the tarball and its declared dependencies. Resolution evidence must show the installed package path and the resolved root entry point.

As an additional negative boundary, the completed consumer must remain compilable and runnable after it or an equivalent fresh copy is placed in a second temporary directory outside the Agentbook repository with only the tarball available.

---

## Clean consumer fixture

The implementation may generate this fixture dynamically. It must be a new domain unrelated to refund/customer support and travel approval. A suitable fixture is:

```text
Agent: Invoice Review Agent
Story: Large Invoice Requires Review

GIVEN:
- invoiceId: INV-2048
- amount: 18000
- automaticApprovalLimit: 10000

WHEN:
Review this invoice for payment.
```

Required verdict-free expectations:

```ts
[
  {
    id: 'checks-invoice-record',
    description: 'Checks the invoice record',
    matcher: { kind: 'tool-called', tool: 'lookup_invoice' },
  },
  {
    id: 'requests-manual-review',
    description: 'Requests manual review for a large invoice',
    matcher: { kind: 'tool-called', tool: 'request_invoice_review' },
  },
  {
    id: 'does-not-pay-directly',
    description: 'Does not pay the invoice before review',
    matcher: { kind: 'tool-not-called', tool: 'pay_invoice' },
  },
]
```

The exact names and values are implementation choices, but the fixture must define a completely new Agent and Story and use both supported matcher kinds.

The fixture's `package.json` must depend on `@agentbook/core` through the packed tarball used by the test. Its source imports Agentbook values and types only from documented package exports.

The fixture must not depend on React, Next.js, the Agentbook application, an LLM SDK, or an external service. Any local tool/profile fixture retained under the conditional execution surface must live wholly inside the consumer project and have no external side effects.

---

## Package-content inspection

Inspect the tarball manifest and extracted contents before installing it. The inspection must be automated and fail closed: unexpected files must be rejected, not merely noted.

The package must contain only the files required to install, type-check, and run the documented public API, such as:

- package metadata;
- built runtime modules;
- generated declaration files;
- a license or readme if intentionally included.

The packed package must not unintentionally contain:

- `app/`, React components, UI assets, or Next.js build output;
- screenshots or videos;
- test evidence, reports, coverage, or private fixtures;
- demo Agents or Stories;
- generated Story registries;
- `.env` files or environment snapshots;
- secrets, tokens, authorization headers, or credentials;
- Vercel configuration or credentials;
- unrelated internal implementation or repository scripts;
- source maps containing embedded private source when source maps are not intentionally part of the package contract;
- absolute local filesystem paths;
- user-specific paths, including the packager's home directory or Agentbook checkout path;
- workspace lockfiles, editor metadata, caches, or development-only artifacts.

Secret inspection must use names and known non-sensitive fingerprints only. It must never print, snapshot, or compare a real secret value.

The implementation report must record the tarball filename, integrity or cryptographic digest, compressed and unpacked sizes, complete file manifest, and the result of leakage scans.

---

## Runtime test

From the isolated consumer, execute a built JavaScript entry point under a supported Node version. The runtime test must:

1. resolve `@agentbook/core` by package name;
2. import the documented runtime exports;
3. create the new Agent with `defineAgent`;
4. create the new Story with `defineStory`;
5. verify the returned definitions preserve the declared Agent, prompt/context, and matcher data;
6. recursively verify that the authored Story and expectations contain no behavioral verdict fields or values;
7. exercise any runtime validation that is part of the public helpers, including rejection of an invalid definition where applicable;
8. if the external execution-profile contract remains in core, define a consumer-owned local profile and tools, invoke its minimum supported public behavior, and prove that any observed calls come from the consumer's handlers rather than package fixtures.

Test 06 does not require `@agentbook/core` to own discovery, a full Runner, the Evaluator, or UI rendering. The runtime smoke test must exercise only behavior the final public package actually claims to provide. It must not import private Runner or Evaluator modules simply to make the test appear end-to-end.

Story expectations must remain declarations. No helper exercised by this test may insert `passed`, `failed`, `status`, `verdict`, or an equivalent behavioral result into the Story.

---

## TypeScript test

The isolated consumer must have its own minimal `tsconfig.json` with no inherited Agentbook configuration and no `paths` mapping. Its compilation must prove that:

- package declaration files resolve from the installed package;
- value and type imports resolve through documented `exports` entries;
- `defineAgent` and `defineStory` infer or accept their documented inputs;
- `Story`, `StoryExpectation`, and matcher types are usable by consumer code;
- generic `tool-called` and `tool-not-called` matcher discrimination remains available;
- any retained public execution-profile/tool types resolve and type-check;
- the valid consumer compiles successfully;
- an otherwise valid expectation containing `passed: true` fails compilation;
- equivalent embedded fields such as `status` or `verdict` remain rejected according to the Test 02 contract;
- no Agentbook repository `tsconfig` alias, source include, project reference, or workspace configuration is required.

The invalid-type test must assert failure for the intended diagnostic. A compilation failure caused by a missing package, broken declaration file, or unrelated configuration error is not proof that verdict fields are rejected.

Declarations must not reference source files outside the installed package, unresolved aliases, application modules, test fixtures, React types, or undeclared dependencies.

---

## Package exports and compatibility requirements

The packed `package.json` must satisfy all of the following:

- `name` is exactly `@agentbook/core`;
- the package is installable from the tarball and is not blocked by package metadata intended only for the workspace;
- `exports` explicitly defines every supported public entry point and does not expose arbitrary internal files;
- `types` or the type condition in `exports` resolves to declarations contained in the tarball;
- runtime import conditions resolve to built JavaScript contained in the tarball, not `.ts` source outside it;
- the runtime module format is explicit and works under the documented supported Node environment;
- the minimum supported Node version or version range is declared or documented and is exercised by the test environment;
- runtime dependencies are declared in `dependencies` or appropriate peer dependencies rather than being satisfied accidentally by the Agentbook root;
- development-only build/test packages do not become consumer runtime dependencies;
- installing the tarball does not require lifecycle scripts that read the Agentbook repository or rebuild from missing source;
- unsupported internal subpath imports fail through the export map.

Test 06 does not prescribe a bundler, compiler, declaration generator, dual ESM/CommonJS build, or directory layout. The implementation must choose the minimum build mechanism that satisfies the public runtime, type, and compatibility contract. ESM-only is acceptable if it is explicit, documented, and exercised by the clean consumer.

---

## Negative tests

The automated Test 06 implementation must include at least these negative proofs:

1. **No source repository:** installation, compilation, and execution succeed from a temporary consumer outside the Agentbook repository.
2. **No alias escape:** the consumer has no path mapping or project reference into Agentbook, and emitted declarations contain no repository alias.
3. **No relative escape:** package runtime and declaration files contain no path that traverses into Agentbook's `lib`, `app`, tests, or package source directory.
4. **No workspace magic:** the installed dependency is a normal unpacked tarball dependency, not a workspace link or symlink.
5. **Verdict rejection:** the invalid consumer fixture with `passed: true` fails for the expected TypeScript reason.
6. **Private subpath rejection:** an import from an undocumented internal `@agentbook/core/*` path fails.
7. **Dependency isolation:** compilation and execution do not succeed only because undeclared dependencies are hoisted from the Agentbook root.
8. **Content leakage:** the tarball allowlist and forbidden-content scans reject application, fixture, credential, evidence, and user-path leakage.
9. **Second-location portability:** a fresh install or copied consumer in another external temporary directory still compiles and runs with only the tarball as the Agentbook input.
10. **Artifact-only thought experiment:** deleting or making the original package source unavailable to the consumer process would not change resolution. The test need not destructively delete repository files; process isolation, path inspection, and a second temporary location may prove the condition safely.

---

## Acceptance criteria

Test 06 may be marked `PASS` only when every criterion is satisfied:

- [x] Tests 01–05 remain passing without weakened contracts.
- [x] A build produces a real installable `@agentbook/core` package artifact.
- [x] The test installs the exact packed tarball into a clean consumer outside the Agentbook repository.
- [x] The consumer dependency is not a symlink, workspace link, or source-directory dependency.
- [x] The consumer imports all Agentbook values and types only from documented package exports.
- [x] `defineAgent` and `defineStory` work from the installed package.
- [x] A completely new Agent and Story compile and execute through the package's claimed runtime surface.
- [x] The fixture domain is unrelated to refund/customer support and travel approval.
- [x] Both generic matcher kinds remain available to the consumer.
- [x] Story expectations remain verdict-free in source, types, and runtime output.
- [x] `passed: true` and equivalent behavioral verdict fields are rejected by the public types for the intended reason.
- [x] The public API decision for `defineExecutionProfile` and related external execution/tool types is explicit and preserves the supported Test 05 workflow.
- [x] No internal type is exported without a documented public consumer need.
- [x] Package declarations resolve without Agentbook aliases, root configuration, or external source references.
- [x] Runtime exports resolve to self-contained built JavaScript in the installed package.
- [x] The package export map exposes only documented entry points.
- [x] The package declares an explicit supported module format and Node environment.
- [x] All consumer runtime dependencies are declared and resolvable outside the Agentbook workspace.
- [x] Packed contents pass the required allowlist and leakage inspection.
- [x] The tarball contains no application/UI code, generated registry, demo fixture, private test evidence, environment file, credential, absolute local path, or user-specific path.
- [x] The consumer remains valid in a second isolated location with only the tarball available.
- [x] The critical replacement question can be answered **Yes**.
- [x] Normal `npm test` remains offline, deterministic, provider-free, and cost-free.
- [x] Typecheck, Test 06, the full offline test suite, build, and diff checks pass.
- [x] Nothing listed under “What must NOT be implemented yet” is introduced.

---

## PASS/FAIL checklist

Mark Test 06 `PASS` only when every answer is **Yes**:

- [x] Is `@agentbook/core` represented by a real packed artifact rather than a workspace alias?
- [x] Can a clean project outside the Agentbook repository install that artifact?
- [x] Does the installed package resolve without access to Agentbook source paths?
- [x] Can the clean project author a new Agent and verdict-free Story using package-name imports only?
- [x] Do its TypeScript types resolve without Agentbook's `tsconfig`?
- [x] Are invalid verdict-bearing expectations rejected for the intended type error?
- [x] Does the documented runtime surface execute under the supported Node environment?
- [x] Is the public surface deliberately limited to coherent developer contracts?
- [x] Is the Test 05 execution-profile API either supported from a real public artifact or generically migrated to an explicitly tested public boundary?
- [x] Are package exports, types, module format, Node support, and dependencies explicit?
- [x] Is the tarball free of application code, private fixtures, evidence, environment files, secrets, and local path leakage?
- [x] Does a second isolated location produce the same successful result?
- [x] Would the artifact work on another computer that has never seen the Agentbook repository?
- [x] Do Tests 01–05 and all offline regression gates still pass?

If any answer is **No**, Test 06 is `FAIL` or remains not implemented.

---

## Regression requirements

The implementation must rerun and preserve the complete contracts of Tests 01–05. In particular:

- internal Story discovery remains convention-based and presentation-independent;
- Stories and `ObservedRun` remain behaviorally verdict-free;
- the Evaluator remains the only owner of behavioral PASS/FAIL;
- real-agent execution and server-only credential boundaries remain intact;
- the UI continues to render completed execution records faithfully;
- external-project loading and fixture-owned tool execution from Test 05 continue to work through generic boundaries;
- the Test 05 consumer no longer depends on workspace-only resolution once the installable boundary replaces it;
- no fixture-specific IDs, paths, policies, tool names, or evaluation branches enter application/core implementation code;
- normal `npm test` remains offline, deterministic, provider-free, and cost-free.

Required final commands must include the repository's standard equivalents of:

```bash
npm run typecheck
npm test
npm run build
git diff --check
```

The Test 06 package-isolation test must itself run offline after local package build and packing. It must not access npm or another registry to obtain `@agentbook/core`. Any third-party dependencies needed by the clean consumer must be handled in a way that keeps the recorded regression run offline and reproducible.

---

## Required evidence

The implementation report must include:

- Test 01–05 regression results;
- package build command and output location;
- packed tarball filename, digest/integrity, compressed size, and unpacked size;
- complete tarball file manifest;
- packed `package.json` fields relevant to name, version, exports, types, module format, Node support, files, scripts, and dependencies;
- documented public API export list and the rationale for included and excluded type families;
- explicit decision and evidence for the Test 05 execution-profile/tool API;
- canonical Agentbook repository root and both external consumer roots;
- proof each consumer root is outside the repository;
- clean consumer project tree, `package.json`, `tsconfig.json`, and complete import list;
- installed package resolution path and proof it is not a symlink/workspace link;
- valid TypeScript compilation output;
- invalid verdict-field compilation output showing the expected diagnostic;
- unsupported private-subpath import failure;
- runtime output proving the new Agent and Story were created from the installed package;
- recursive runtime verification that Story expectations contain no verdicts;
- local execution-profile/tool evidence if that API remains public;
- declaration and runtime scans for repository-relative imports, unresolved aliases, undeclared dependencies, and absolute/user-specific paths;
- tarball leakage-scan results for application files, registries, fixtures, evidence, environment files, secret names/fingerprints, credentials, and development artifacts;
- second-location portability result;
- typecheck, complete offline test, production build, and diff-check results;
- a direct **Yes** or **No** answer to the critical replacement question;
- final Test 06 status.

Evidence must not include real credential values, authorization headers, or secret-bearing environment output.

---

## Failure conditions

Test 06 fails if any of the following occurs:

- the consumer resolves `@agentbook/core` through an npm workspace, symlink, path alias, or repository source directory;
- the packed entry point imports `../../lib/agentbook`, `app/*`, a generated registry, a demo, a test fixture, or any file outside the installed package;
- declarations reference Agentbook source paths, private aliases, or undeclared packages;
- the package ships TypeScript source as its runtime entry when the documented Node environment cannot execute it directly;
- the valid consumer compiles or runs only from inside the Agentbook repository;
- copying or recreating the consumer outside the repository breaks package resolution;
- the tarball includes unintended application/UI code, screenshots, evidence, `.env` data, secrets, credentials, private fixtures, absolute paths, or user-specific paths;
- package installation requires the Agentbook root, workspace lifecycle, or unavailable source files;
- package dependencies are satisfied accidentally through root hoisting rather than declarations;
- supported public imports bypass the export map or require private subpaths;
- `StoryExpectation` permits `passed`, `failed`, `status`, `verdict`, or an equivalent behavioral result;
- the invalid-type test fails for an unrelated reason and is reported as proof of verdict rejection;
- the package authoring runtime inserts observed behavior or a verdict into a Story;
- `defineExecutionProfile` or another Test 05 public dependency disappears without a deliberate, generic, regression-tested replacement;
- private UI, discovery, Runner, Evaluator, provider, or demo types are exposed without a documented public need;
- Test 06 introduces fixture-specific execution/evaluation logic or a preassembled passing trace;
- a real LLM provider, external API, database, cloud system, payment system, or other network service is contacted;
- normal `npm test` becomes network-dependent, non-deterministic, provider-backed, or costly;
- any validated Test 01–05 contract is weakened or fails;
- the critical replacement question cannot be answered **Yes**.

---

## What must NOT be implemented yet

Test 06 must not:

- publish anything to npm or another registry;
- create the final CLI;
- create `npx <product-name> dev`;
- choose the final product name;
- add authentication;
- add cloud features;
- add persistence or Run history storage;
- add billing or payments;
- add OKF;
- add CI or GitHub checks;
- redesign the UI;
- create Test 07;
- contact a real LLM provider;
- prescribe unnecessary bundling technology or expand the package beyond the minimum proven public contract.

Only the Test 06 implementation work necessary to build, pack, inspect, install, compile, and locally exercise the public package boundary was in scope.

---

## Validated execution evidence

Validation date: `2026-08-29`

### A. Package architecture chosen

`@agentbook/core` is a dependency-free ESM package compiled with TypeScript from one self-contained package source entry. The build emits JavaScript and declarations into package-local `dist/`. Root `predev`, `pretypecheck`, `pretest`, and `prebuild` hooks build core before any consumer needs its declared exports.

The package has one export-map entry, `@agentbook/core`. It exposes no wildcard or internal subpath. Packing uses the package `files` allowlist and the Test 06 harness independently requires an exact four-file tarball manifest.

### B. Public API exports and rationale

Classification of the previous and required surface:

| Export | Classification | Rationale |
| --- | --- | --- |
| `defineAgent`, `defineStory` | `PUBLIC — REQUIRED` | Code-first authoring contract from Tests 01, 02, and 05. |
| `Agent`, `Story`, `StoryInput`, `StoryExpectation` | `PUBLIC — REQUIRED` | Consumer authoring and reusable typed Story factories. |
| `ExpectationMatcher`, `ToolCalledMatcher`, `ToolNotCalledMatcher` | `PUBLIC — REQUIRED` | Generic matcher authoring and discrimination. |
| `defineExecutionProfile` | `PUBLIC — JUSTIFIED` | Smallest way to preserve Test 05's consumer-owned execution integration without a new package or migration. |
| `ExternalExecutionProfile`, `ExternalExecutionContext`, `ExternalExecutionOutcome`, `ExternalToolDefinition`, `ExternalToolSet` | `PUBLIC — JUSTIFIED` | Types required to author and check the retained external profile/tool contract. |

Helper aliases used only to express exported structures remain declaration-private.

### C. Exports deliberately kept private

The package no longer exports `ObservedRun` or `EvaluationResult`. It also excludes all presentation, demo status, simulation, comparison, recorded-run, discovery, registry, loader, Runner, Evaluator, provider, UI, and internal validation contracts. `Story` includes only the authoring model and the retained `external-profile` capability; internal prototype and real-agent execution capabilities are not part of the package declaration.

### D. Test 05 execution API decision

`defineExecutionProfile` and its minimum generic types remain in `@agentbook/core`. Test 05 already validates project-owned tools and profile execution through this contract. Retaining it avoids an unnecessary second package and preserves Test 05 unchanged in meaning. Test 06 independently proved the same contract from the tarball using consumer-owned invoice tools.

### E. Package build command

```text
npm run core:build
  -> tsc -p packages/agentbook/tsconfig.build.json
```

No bundler or lifecycle-time consumer compilation was introduced.

### F. Tarball

```text
filename:          agentbook-core-0.0.0-test.6.tgz
SHA-256:           b0dd8548177b6fbc1c1f3c44d828f54ace91f4c3bd71fda6961020308769b548
npm integrity:     sha512-nWUOKECiTxNvhQtqwXyAnpJuhwFxcCSida+HbvZEjXduOujTGvQcMSFjdK2nGeZqJNlI9lpifaGkTRIfZVRvew==
compressed size:   1,768 bytes
unpacked size:     5,213 bytes
```

### G. Complete tarball manifest

```text
package/README.md
package/dist/index.d.ts
package/dist/index.js
package/package.json
```

The manifest matched both npm's pack report and a separately extracted tarball walk.

### H. Packed package.json contract

```json
{
  "name": "@agentbook/core",
  "version": "0.0.0-test.6",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md"],
  "engines": { "node": ">=20" }
}
```

Runtime dependencies: none. Packed scripts: none. The package is not marked private in the packed metadata, and no install lifecycle script is required.

### I–L. Isolated consumer roots, imports, and resolution

The validating run used:

```text
repository:
<repository-root>

consumer #1:
<os-temp-root>/agentbook-test06-<run-id>/consumer-one

consumer #2:
<os-temp-root>/agentbook-test06-<run-id>/consumer-two
```

The automated evidence records the concrete canonical paths at runtime and removes both temporary consumers afterward. Canonical relative-path checks proved both roots were outside the repository. Each consumer's complete Agentbook import list was only `@agentbook/core`. Each installed package resolved to its own canonical `node_modules/@agentbook/core/dist/index.js`. `lstat`, `realpath`, and package-lock inspection proved the installed directory was not a symlink or workspace link and was installed from the consumer-local tarball.

### M–O. TypeScript and private-subpath proofs

Both consumers compiled valid source with the existing development TypeScript compiler and consumer-local `NodeNext` configuration. Neither configuration contained `paths`, `references`, inherited Agentbook configuration, or a source include outside its own root.

The invalid fixture produced only the intended `TS2322` diagnostics:

```text
src/invalid.ts(8,3): error TS2322: Type 'true' is not assignable to type 'undefined'.
src/invalid.ts(15,3): error TS2322: Type 'string' is not assignable to type 'undefined'.
src/invalid.ts(22,3): error TS2322: Type 'true' is not assignable to type 'undefined'.
src/invalid.ts(29,3): error TS2322: Type 'string' is not assignable to type 'undefined'.
```

The lines correspond respectively to `passed`, `status`, `failed`, and `verdict`. The harness maps each field to its exact diagnostic line and rejects missing-package diagnostics as false proof.

Importing `@agentbook/core/internal-something` failed with `ERR_PACKAGE_PATH_NOT_EXPORTED` in both consumers.

### P–R. Runtime, verdict-free Story, and external profile

Both consumers created `Invoice Review Agent` and `Large Invoice Requires Review`. Runtime evidence preserved:

- `invoiceId: INV-2048`, amount `18000`, and automatic approval limit `10000`;
- prompt `Review this invoice for payment.`;
- matcher kinds `tool-called`, `tool-called`, and `tool-not-called`;
- no verdict field or `PASS`/`FAIL` value anywhere in the Story;
- runtime rejection of an injected `passed` field.

The retained profile exposed consumer-owned `lookup_invoice`, `request_invoice_review`, and `pay_invoice` tools. Execution invoked the first two local handlers in order, left `pay_invoice` available but uncalled, and returned `Request manual review`. No private Runner or Evaluator was imported.

### S. Second-location portability

Consumer #2 repeated tarball copy, offline local installation, valid compilation, invalid compilation, private-subpath rejection, runtime resolution, verdict-free checks, and profile execution independently. Its package resolution remained inside consumer #2. Result: `PASS`.

### T. Leakage, path, and secret scan

The exact manifest allowlist passed. Extracted names and text contained no application/UI directory, Next.js output, screenshot, evidence, coverage, fixture, demo, generated registry, environment file, Vercel credential marker, authorization marker, source map, lockfile, repository path, `/Users/` path, alias, or relative source-tree escape. Runtime JavaScript had no imports; declarations had no imports, parent traversal, `ObservedRun`, `EvaluationResult`, or presentation types. Result: `PASS`.

### U–V. Regressions and final quality gates

Tests 01–05 remained passing. Normal tests stayed offline, deterministic, provider-free, and cost-free.

```text
npm run test:package: PASS (1/1)
npm run typecheck:    PASS
npm test:             PASS (15/15)
npm run build:        PASS
git diff --check:     PASS
```

No Vercel AI Gateway or real provider request was made.

### W. Critical replacement answer

> If only the packed `@agentbook/core` artifact were transferred to another computer with no Agentbook repository, could a developer install it and author valid Agentbook Stories?

**YES.**

The artifact contains its complete runtime, declarations, and metadata, has no runtime dependencies, and passed two independent clean-consumer installations outside the source repository.

### X. Final Test 06 status

**IMPLEMENTED — PASS.**
