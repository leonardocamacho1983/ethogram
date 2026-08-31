# Ethogram OSS Alpha Release Readiness

Status: **historical `0.1.0-alpha.1` release record — not the current candidate checklist**
Audit date: 2026-08-29  
Architectural baseline: Tests 01–09, through commit `2a114db`  
Release name: **Ethogram**

> This document preserves the decisions and evidence for the published `0.1.0-alpha.1` core/CLI release. The later coordinated `0.1.0-alpha.2` release adds `@ethogram/mcp`; see [`MCP-SERVER-PLAN.md`](MCP-SERVER-PLAN.md), [`mcp.md`](mcp.md), and [`packages.md`](packages.md) for its scope. Statements below about a two-package release are historical.

## Executive conclusion

The validated prototype is technically sufficient for a narrow OSS alpha. It does not need another architecture test or another product capability. The smallest credible release is the existing TypeScript/Node, local, code-first Story runner and read-only developer UI, published as two prerelease npm packages with one CLI command family:

```text
@ethogram/core
@ethogram/cli
ethogram init [--existing]
ethogram dev
```

The release includes the MIT license, public documentation, an explicit read-only/code-first contract, automatic project reload, stale-evidence invalidation, confirmed ownership of the `@ethogram` npm scope, and the atomic public package-name migration. `0.1.0-alpha.0` proved registry publication and installation but shipped stale pre-publication README copy. `@ethogram/core@0.1.0-alpha.1` and `@ethogram/cli@0.1.0-alpha.1` supersede it with corrected package metadata.

Tests 01–09 remain the frozen architectural baseline. Their behavioral contracts must continue to pass after release preparation. Historical test specifications and recorded evidence should retain the Agentbook name so the record is not rewritten; executable consumers may be mechanically updated to exercise the released Ethogram names.

## Release boundary

The alpha is:

- TypeScript/Node only, with the existing Node engine floor of Node 20.9 or later;
- local and developer-operated;
- code-first: Agents, Stories, expectations, and execution profiles live in the consumer project;
- read-only at runtime: the UI discovers, displays, runs, and evaluates code, but is not the authoring source of truth;
- one current TypeScript adapter;
- the existing `tool-called` and `tool-not-called` matchers only;
- compatible with both Ethogram-instrumented tools and facts-only evidence translated from framework-owned execution;
- ephemeral: no run persistence or history claim.

The alpha is not a hosted service, general agent framework, workflow system, test-management platform, or framework compatibility promise.

## 1. Naming migration audit

### Required public migration map

| Pre-alpha public name | Alpha name | Status | Reason |
| --- | --- | --- | --- |
| Agentbook / agentbook in product prose | Ethogram | COMPLETED | The codename does not appear as the released product identity. |
| `@agentbook/core` | `@ethogram/core` | COMPLETED | It is the import path emitted into consumer source. |
| `@agentbook/cli` | `@ethogram/cli` | COMPLETED | It is the installed package and owns the executable. |
| `agentbook` executable and `npx agentbook ...` | `ethogram` and `npx ethogram ...` | COMPLETED | This is the primary user journey. |
| `agentbook.config.mjs` | `ethogram.config.mjs` | COMPLETED | The filename is generated, required, and named in errors. |
| `AGENTBOOK_PROJECT_ROOT` | `ETHOGRAM_PROJECT_ROOT` | COMPLETED | It is an operator-facing configuration name in the root prototype launcher. |
| `AGENTBOOK_RUNTIME_ERROR`, `MISSING_AGENTBOOK_CONFIG`, `INVALID_AGENTBOOK_CONFIG` | Ethogram-neutral or `ETHOGRAM_*` codes | COMPLETED | These codes can appear in CLI/API errors. |
| public `__agentbookType` discriminator in core declarations | `__ethogramType` | COMPLETED | The public TypeScript contract now uses the released identity. |

### Inventory: MUST RENAME BEFORE PUBLIC RELEASE

The following tracked surfaces contain public or user-visible Agentbook naming and must migrate together:

| Surface | Current locations | Required treatment |
| --- | --- | --- |
| Repository identity and primary documentation | `README.md`; repository title/description/topics; any release notes | Replace the scaffold/v0 README with the Ethogram OSS README. Rename the repository slug to `ethogram` under an owner the maintainer controls. |
| Package identity | `packages/agentbook/package.json`; `packages/cli/package.json`; root `package.json`; `package-lock.json`; `pnpm-lock.yaml` | Rename packages, descriptions, workspace script references, CLI dependency, and lockfile records. Use one aligned prerelease version. Regenerate lockfiles rather than hand-editing them. |
| Package documentation | `packages/agentbook/README.md`; `packages/cli/README.md` | Rename headings, imports, commands, descriptions, and codename disclaimers; replace test-oriented wording with supported alpha contracts and limitations. |
| CLI executable and help | `packages/cli/package.json`; `packages/cli/src/cli.ts` | Change the `bin` key, usage, examples, next-step output, usage errors, initialization output, and all product/error prefixes to Ethogram. |
| Generated consumer files | `packages/cli/src/templates.ts` | Generate `ethogram.config.mjs`; import `@ethogram/core`; use the released terminology in comments or messages. The starter behavior itself does not change. |
| Config discovery and config errors | `packages/cli/src/typescript-adapter.ts` | Load `ethogram.config.mjs`; update missing/invalid config codes and messages; update `Run "ethogram init" first.` |
| Packaged developer server | `packages/cli/src/server.ts` | Rename server output, shutdown text, safe fallback errors, reinstall guidance, and `AgentbookEngine` only where it can surface. |
| Packaged developer UI | `packages/cli/src/runtime/index.html`; `packages/cli/src/runtime/app.js` | Rename title, brand, loading/empty/error text, and the `A` brand mark. Remove the `codename` label. |
| Root prototype UI | `app/layout.tsx`; `app/page.tsx`; `app/actions/*.ts`; user-visible messages in `lib/agentbook/discovery.ts`; `scripts/generate-story-registry.mjs` | Rename title, brand mark/text, loading and failure messages, discovery output, and operator-facing configuration. This root app is visible in the public repository and cannot present a second product name. |
| Public core type surface | `packages/agentbook/index.ts` and emitted declarations | Rename the exported brand discriminator and all user-facing error prose. Keep the semantic APIs `defineAgent`, `defineStory`, and `defineExecutionProfile`. |
| Consumer examples and release-verification fixtures | starter template plus executable fixtures/tests that install or import the packages | Mechanically consume the final package, config, and executable names so clean-room tests validate the actual release artifacts. Do not change the behavior being tested. |

The name migration was performed as one release-preparation change so package names, generated imports, configuration, CLI output, and public documentation remain coherent.

### Inventory: CAN REMAIN INTERNAL TEMPORARILY

These identifiers do not need to block the alpha if they do not appear in packed artifacts, generated consumer code, CLI output, browser copy, or public examples:

- source directories and internal import paths such as `lib/agentbook/` and `packages/agentbook/`;
- internal filenames such as `load-agentbook-project.ts`, internal type/function names such as `LoadedAgentbookProject`, `loadAgentbookProject`, and `AgentbookEngine`;
- CSS selectors such as `.agentbook`;
- root-only build script names such as `core:build` and paths in `.gitignore`;
- internal test scratch-directory prefixes;
- Test 08 diagnostic variable `AGENTBOOK_KEEP_TEST08`;
- Test 09 harness-only variables and global evidence hooks: `AGENTBOOK_TEST09_GITHUB_TOKEN`, `AGENTBOOK_TEST09_CANDIDATE_MODULE`, and `__AGENTBOOK_TEST09_NATIVE_EVIDENCE__`.

Keeping these is technical debt, not a compatibility promise. They should be renamed later only as a mechanical cleanup, after the public migration is stable. Package contents must be inspected with `npm pack --dry-run` to ensure internal names classified here do not leak unexpectedly.

### Inventory: SHOULD NOT RENAME

- `tests/01-*.md` through `tests/09-*.md`, including their execution records, baseline hashes, historical commit descriptions, and statements about what Agentbook proved at the time. They are frozen evidence.
- Historical names inside archived Test 01–09 evidence that identify the pre-release artifacts under test.
- Generic domain vocabulary: Agent, Story, GIVEN, WHEN, expectation, `ObservedRun`, `EvaluationResult`, execution profile, and the `*.agent.stories.ts`, `.agent.*`, and `.profile.*` discovery conventions. These are not Agentbook branding.
- Third-party project and package names recorded in Test 09.

Executable tests and live fixtures are different from historical prose: they may need mechanical package/config/command updates so the same assertions run against Ethogram. Such updates must not alter the architectural claim or acceptance criteria.

### External name and ownership checks

Authenticated npm access confirmed on 2026-08-30 that `leonardocamacho` is an owner of the `ethogram` organization. The repository is controlled at `github.com/leonardocamacho1983/ethogram`.

- `@ethogram/core` and `@ethogram/cli` use the controlled `@ethogram` npm organization/scope and were published successfully.
- The unscoped npm name `ethogram` returned 404 from the public registry during this audit. That is only a point-in-time observation, not a reservation. The proposed release does not need an unscoped package if `@ethogram/cli` exposes the `ethogram` binary.
- `@ethogram/core` and `@ethogram/cli` returned 404 during the original audit; both now resolve from the public registry, with `next` pointing to `0.1.0-alpha.1`.
- `github.com/Ethogram` is already an organization created in 2014. Do not assume it is available or controlled. Publish the repository as `<controlled-owner>/ethogram` unless ownership of that organization is independently established.
- Confirm the `Ethogram` word mark, package names, repository name, and relevant domains/handles with an appropriate trademark/brand clearance process. This audit does not provide legal clearance.

Do not ship temporary `@agentbook/*` packages under the Ethogram brand.

## 2. Dogfood UX findings

| Finding | Classification | Minimum alpha treatment |
| --- | --- | --- |
| Conceptual EXPECT is authored as `then` while the UI says Assertions | SHOULD FIX BEFORE ALPHA | Make `expectations` the canonical form in the starter and public docs, which the current core already accepts. Label the UI section **Expectations**. Keep `then` as a documented shorthand/compatibility alias for now. Do not redesign the UI or matcher model. |
| The code-first, read-only nature is not explicit enough | RELEASE BLOCKER | State it in the first screenful of the repository README, package README, CLI `dev` help/output, and developer UI. Explain that files are the source of truth and the UI does not save edits. Remove or clearly disable copy that implies saving, run history, or comparison if those controls remain visible. This is scope clarification, not a new capability. |
| Source changes previously required restarting `ethogram dev` | IMPLEMENTED | The server fingerprints relevant TypeScript/JavaScript project sources, atomically reloads the adapter/project, and the browser polls for revision changes. |
| An open browser tab could show stale execution evidence after restart | IMPLEMENTED | Server instance and project revision identities invalidate prior evidence. Source changes clear it; server loss/replacement marks it stale; changes during a Run reject the result and require rerun. |

The trust distinction is important: restart friction is inconvenient, while stale evidence can cause a developer to believe an old PASS or FAIL belongs to the current code.

## 3. Minimum public developer journey

Public documentation should contain one copy-pasteable path for each supported integration shape. It should not reproduce the test specifications or explain internal engine architecture.

### A. New project

Document this exact journey:

```bash
npm install --save-dev @ethogram/core@next @ethogram/cli@next
npx ethogram init
npx ethogram dev
```

The guide must then show:

1. What `init` creates: `ethogram.config.mjs`, one Agent descriptor, one `*.agent.stories.ts` Story, and one execution profile.
2. That the generated Access Request starter is deterministic and local; it demonstrates the contract rather than claiming model quality.
3. The smallest Story shape using `defineStory`, structured `given`, `when`, canonical `expectations`, and an `external-profile` binding.
4. That `npx ethogram dev` opens a local read-only UI and automatically reloads relevant source changes.
5. How to select the Story and press **Run Story**.
6. How to read the result: observed tool calls are facts; expectation verdicts and the overall PASS/FAIL are evaluator output.

The generated starter is the new-project example. Do not maintain a second, drifting copy merely for documentation.

### B. Existing agent

Document this exact journey:

```bash
npm install --save-dev @ethogram/core@next @ethogram/cli@next
npx ethogram init --existing
```

Then explain the three thin integration files the developer adds:

1. an Agent descriptor that names the existing agent for Ethogram;
2. a Story whose `given` and `when` provide scenario input and whose expectations declare behavior;
3. one execution profile that maps Story input to the existing public agent entry point and adapts the existing tool boundary through `callTool`.

The profile may translate input/output and instrument tools. It must not copy policy, branch on Story IDs, call tools because an expectation names them, fabricate a trace, or modify the original agent to understand Ethogram. End with:

```bash
npx ethogram dev
```

Use a reduced, public version of the Test 08 purchase-approval fixture as the reference example. Exclude baseline hashing, mutation-test machinery, and Test 08 vocabulary from the public guide.

### C. Framework-owned execution evidence

This needs one focused package-README section, not a general framework integration system.

Explain that when a framework owns tool construction and dispatch, the profile should:

1. call the existing framework/agent normally;
2. collect tool-call and tool-result facts from that same invocation using the framework's public callbacks/result object;
3. translate those facts once into `ExternalExecutionEvidence`;
4. return `{ decision, finalResponse, evidence }` with `tools: {}`;
5. never call Ethogram `callTool` in the same execution and never re-execute tools to manufacture evidence.

Document the required evidence fields—`source`, stable `callId`, tool `name`, actual `input`, `sequence`, and operational `status`—plus optional output/error, step, timing, provider/model, finish reason, and token usage. State that evidence is verdict-free and that Ethogram performs validation, canonical normalization, and matcher evaluation. Reuse a compact translation excerpt derived from Test 09; do not claim compatibility with every framework or publish the credential-backed harness as the onboarding path.

## 4. Minimum public release surface

### Repository README

Replace the current generated Next.js/v0 README. The minimum README should contain, in this order:

1. one sentence: Ethogram is a local, code-first behavioral testing tool for TypeScript/Node agents;
2. an alpha/read-only notice and the explicit non-goals;
3. requirements: Node 20.9+ and a TypeScript/Node project;
4. the three-command quickstart for a new project;
5. a minimal Story example and what Run evaluates;
6. the existing-agent link/path;
7. the framework-owned evidence link/path;
8. automatic reload and current-evidence invalidation behavior;
9. supported scope and current limitations;
10. package links, license, issue link, and security/contact route.

No origin story, launch copy, testimonials, roadmap, hosted-product CTA, analytics pitch, or large architecture narrative is needed.

### Package READMEs

`@ethogram/core` needs its supported exports, Story example, expectation semantics, execution-profile contracts, framework-owned evidence contract, Node support, version status, and repository/license links.

`@ethogram/cli` needs install, `init`, `init --existing`, `dev`, all flags, generated files, conflict-preserving behavior, read-only/reload behavior, troubleshooting, Node support, and repository/license links.

Both package READMEs must be included in their tarballs and must not describe themselves as Test 06/07 artifacts or unpublished codenames.

### Examples

The minimum is:

- the `ethogram init` generated Access Request starter as the canonical new-project example;
- one checked-in `examples/existing-agent/` adaptation of Test 08, showing an untouched ordinary agent plus the descriptor, Story, and thin profile;
- one compact framework-owned evidence example in the core README or `examples/framework-owned-evidence/`, derived from Test 09 without making credentials part of the basic path.

Every checked-in example must be run in release verification. Do not add a gallery, multiple frameworks, or additional matchers before alpha.

### LICENSE

A root `LICENSE` is P0. Choose and record an OSI-approved license before external access. MIT is the smallest conventional choice for this repository; Apache-2.0 is also reasonable if an explicit patent grant is preferred. The copyright holder must make the choice. Add the selected SPDX identifier to both package manifests and ensure third-party assets/code retained in the repository are compatible and attributed where required.

### CONTRIBUTING

A full contribution program is not needed for the first alpha. If public pull requests will be accepted, add a short `CONTRIBUTING.md` covering setup, build/typecheck/test commands, the frozen Tests 01–09 rule, scope constraints, and how to propose changes. If the alpha is feedback-first and maintainer-authored, the README can ask testers to open issues and `CONTRIBUTING.md` can wait.

### CLI help

`ethogram --help` must accurately document:

- `init` and its non-destructive/conflict behavior;
- `init --existing` as configuration-only;
- `dev`, `--project`, `--port`, and `--no-open`;
- the current-directory default;
- the read-only UI, automatic reload, and evidence-invalidation behavior;
- examples using installed alpha package names;
- `--version`.

Unknown commands/options must fail nonzero without a stack trace and point to `ethogram --help`, preserving the behavior already validated in Test 07.

### Versioning

- Keep both packages aligned at `0.1.0-alpha.1` for the corrective alpha release.
- Use SemVer prereleases and publish under the npm `next` dist-tag.
- Pin the CLI's dependency on core to the exact same prerelease version for reproducible alpha installs.
- Document that public API compatibility is not guaranteed across `0.x` prereleases, while avoiding gratuitous churn.
- Create one Git tag, `v0.1.0-alpha.1`, after the published artifacts pass clean-room verification.

### npm publishing

Before publishing:

1. confirm authenticated ownership of the selected scope and enable publishing security/2FA;
2. add `license`, `repository`, `homepage`, `bugs`, useful `keywords`, and correct `publishConfig.access`/files metadata;
3. build from a clean checkout and inspect `npm pack --dry-run` for both packages;
4. install the produced tarballs into fresh external temporary projects and run both public journeys;
5. publish core first, then CLI, both with `--tag next --access public`;
6. install the registry versions in another clean project and repeat init/dev/run smoke tests;
7. verify `npx ethogram --version`, package README rendering, and tarball contents.

Do not add a publishing CI integration for this alpha. A documented, repeatable manual publish is sufficient and respects the release constraints.

### GitHub repository presentation

The minimum presentation is a controlled repository named `ethogram`, a concise description, topics such as `ai-agents`, `testing`, `typescript`, and `developer-tools`, the correct license indicator, Issues enabled, and one alpha release matching the npm version. Add one current screenshot only if it accurately shows the released read-only UI. Badges, a website, Discussions, templates, social cards, and launch assets can wait.

Do not use `github.com/Ethogram` unless the maintainer proves control of the already-existing organization.

## 5. Prioritized release work

### P0 — must fix before anyone external uses it

1. **Namespace and repository ownership confirmed.** The `@ethogram` npm scope and `github.com/leonardocamacho1983/ethogram` repository path are controlled. Basic brand/trademark clearance remains a maintainer responsibility.
2. **Choose and add the OSS license.** Record the SPDX identifier in the packages and verify retained third-party material.
3. **Atomic public naming migration completed.** Packages, executable, config, generated imports, public type discriminator, error codes/messages, UI copy, READMEs, environment configuration, lockfiles, and executable release fixtures agree on Ethogram.
4. **Prevent stale evidence from appearing current across server restart/loss.** Clear or visibly invalidate the prior verdict and require reload/rerun.
5. **Make the code-first/read-only contract unmistakable.** Put it in the repository README, package/CLI guidance, startup/runtime UI, and any visible controls that currently imply saving, history, or comparison.
6. **Replace the scaffold README and prove the published installation path.** The documented new-project and existing-agent flows must work from packed artifacts in a clean project outside the repository.
7. **Preserve the architectural baseline.** Typecheck, build, all applicable executable Tests 01–09, package-boundary checks, and clean-room Run verification must pass with no product-capability expansion.

### P1 — fix before public alpha

1. Standardize public terminology on **expectations**: use `expectations` in generated code/docs and **Expectations** in UI copy; retain `then` only as an alias.
2. Publish the minimum existing-agent and framework-owned-evidence documentation/examples, including the no-fabrication/no-re-execution boundary.
3. Keep CLI help and troubleshooting aligned with automatic reload and rerun requirements.
4. Complete package metadata, aligned prerelease versioning, tarball inspection, manual npm publication under `next`, and post-publish registry smoke tests.
5. Add the minimal GitHub description/topics/release and a truthful screenshot only if useful.
6. Add a short contribution guide only if pull requests are open for the alpha.

### P2 — can wait

1. Optimize or replace the alpha polling watcher only if real-project evidence shows it is necessary.
2. Rename internal folders, CSS classes, private symbols, test scratch prefixes, and historical implementation filenames that do not leak into release artifacts.
3. Remove the `then` alias in a future explicitly breaking prerelease, if user evidence supports doing so.
4. Add richer examples, additional framework guides, polished repository assets, issue templates, or a broader contributor program.
5. Automate publishing or add CI only after the manual release process and alpha contract are stable—and only when that work is separately authorized.

## Final recommendation

### 1. Smallest credible Ethogram OSS alpha

Ship `@ethogram/core@0.1.0-alpha.1` and `@ethogram/cli@0.1.0-alpha.1` under the `next` tag, exposing `ethogram init`, `ethogram init --existing`, and `ethogram dev`. The release supports local TypeScript/Node projects, code-authored Stories, one thin execution-profile boundary, framework-owned facts-only evidence, the two validated tool-call matchers, and a read-only ephemeral UI. It includes one generated starter, one existing-agent example, focused evidence integration documentation, an OSS license, and accurate READMEs/help.

### 2. Exact work sequence

1. Confirm the controlled npm scope, package names, GitHub owner/repository path, brand clearance, and license.
2. Freeze the corrective release map and version at `0.1.0-alpha.1`; make no architecture changes.
3. Rename all P0 public surfaces atomically and regenerate lockfiles/build artifacts.
4. Add the stale-evidence invalidation and explicit code-first/read-only messaging.
5. Standardize starter/docs/UI terminology on expectations and document automatic reload.
6. Replace the root and package READMEs; add only the existing-agent and framework-evidence material defined above; add a short contribution guide only if accepting PRs.
7. Update executable tests/fixtures mechanically to consume Ethogram while preserving the historical Test 01–09 documents and behavioral assertions.
8. Run typecheck, build, all executable baseline tests, example checks, clean-room tarball installs, and both public journeys outside the monorepo.
9. Inspect tarballs, publish core then CLI under `next`, reinstall from npm, and rerun the smoke journeys.
10. Rename/present the GitHub repository, create `v0.1.0-alpha.1`, and invite the first tester with the new-project or existing-agent guide that matches their project.

### 3. Explicitly do not build before alpha

Do not build Python support, cloud hosting, authentication, billing, OKF, CI integrations, additional matchers, run history, Compare, plugins, framework auto-detection, a framework adapter marketplace, a visual editor, persistence, or launch-marketing infrastructure. Do not create Test 10. Do not broaden the Test 09 result into a claim of universal framework support.

### 4. Readiness criteria for the first external tester

The repository is ready to hand over only when all of the following are true:

- the maintainer controls the published npm scope and GitHub repository path;
- a root OSS license exists and package metadata names it;
- no Agentbook naming remains in shipped packages, generated consumer files, commands, config, UI, errors, or current public documentation; remaining occurrences are confined to the documented internal/historical exceptions;
- fresh installs of the registry packages work on Node 20.9+ without monorepo paths, unpublished dependencies, or credentials for the primary journey;
- `ethogram init`, `ethogram init --existing`, `ethogram dev`, `ethogram --help`, and `ethogram --version` behave as documented;
- a new-project tester can initialize, see the starter Story, run it, and understand the observed evidence and evaluation;
- an existing-agent tester can follow the thin-profile guide without modifying or duplicating their agent's business behavior;
- framework-owned execution evidence is documented as facts-only, same-invocation, no-re-execution integration;
- the UI clearly says it is local, code-first, read-only, and ephemeral;
- code changes reload without restarting `ethogram dev`;
- an old browser tab cannot present pre-restart execution evidence as current;
- public terminology consistently says expectations, with `then` described only as an alias;
- typecheck, production build, executable Tests 01–09, package-boundary tests, tarball inspection, and clean-room smoke tests pass against the release artifacts;
- the README describes only capabilities that exist in the alpha and explicitly lists the deferred scope.

When these criteria are met, the first tester can evaluate the validated product rather than the repository's pre-release naming, scaffolding, or unstated limitations.
