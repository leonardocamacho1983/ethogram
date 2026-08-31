# Ethogram MCP server

`@ethogram/mcp` is the local Model Context Protocol surface for Ethogram. It lets a compatible host learn the product, diagnose setup, inspect the current behavioral contracts, and deliberately execute one selected Story.

This guide covers the public `0.1.0-alpha.2` release. APIs may change between `0.x` versions.

## Why the MCP has three surfaces

Tools, resources, and prompts serve different host capabilities:

- **Tools** are model-controlled actions. A tools-only client can still learn Ethogram, diagnose setup, inspect project/Story context, and run one Story.
- **Resources** are host-controlled context at stable `ethogram://` URIs.
- **Prompts** are user-selected workflows for audience-specific learning and Story diagnosis.

The server bundles versioned knowledge rather than relying on a model's memory. The corpus covers positioning, Expected/Observed/Result, authoring, execution evidence, matcher semantics, architecture, adoption, existing-agent integration, MCP usage, security/privacy, limitations, troubleshooting, stakeholders, and the glossary. Explanations report whether an answer is exact, partial, or unknown. The source corpus is currently English; a host model may explain it in the user's language.

## Start the server

From this source checkout:

```bash
npm install
npm run mcp:build
node packages/mcp/dist/cli.js --project /absolute/path/to/your-agent-project
```

From npm:

```bash
npx -y @ethogram/mcp@0.1.0-alpha.2 --project /absolute/path/to/your-agent-project
```

Example for hosts that use an `mcpServers`-style configuration:

```json
{
  "mcpServers": {
    "ethogram": {
      "command": "npx",
      "args": [
        "-y",
        "@ethogram/mcp@0.1.0-alpha.2",
        "--project",
        "/absolute/path/to/your-agent-project"
      ]
    }
  }
}
```

Use absolute paths because desktop hosts often start servers from an unexpected working directory. The current directory is used when `--project` is omitted. `--load-timeout-ms` defaults to 15,000 and accepts 100–120,000; `--run-timeout-ms` defaults to 120,000 and accepts 100–900,000. Node.js 20.9 or newer is required. Host configuration formats differ; this repository verifies the official MCP SDK clients over local stdio, not every product host.

> Connecting and listing static resources does not evaluate project modules. Calls that load project context—load-mode doctor, project/Story tools, direct project resource reads, and the diagnostic Story prompt—do. Some hosts invoke tools or read linked resources automatically, so keep their approval settings conservative.

## Tools

### `ethogram_explain`

Never loads project code. Accepts `topic`, `question`, `audience`, and `detail`; returns a deterministic explanation, matching article links, answerability, language, docs version, product version, and limitations.

### `ethogram_doctor`

`mode: "static"` checks Node, the fixed project directory, `package.json`, and `ethogram.config.mjs` without evaluating project modules. `mode: "load"` additionally loads the trusted project in an isolated worker. Load mode may trigger top-level module effects and is conservatively annotated.

### `ethogram_get_project`

Returns the normalized project name, adapter, content revision, counts, and Agent summaries. It omits the absolute project root.

### `ethogram_list_stories`

Returns deterministic, paginated Story summaries with an opaque revision-bound cursor. Filters are available for Agent id and a bounded text query.

### `ethogram_get_story`

Returns the public Story contract with Agent, GIVEN, WHEN, EXPECTATIONS, relative source, project revision, and Story digest. The revision and digest are execution preconditions. Story summaries never expose the digest. If the complete public contract exceeds the safe DTO budget, the response is marked `truncated`, `storyDigest` is `null`, and `executionAllowed` is false.

The run worker checks that completeness again against the same stable snapshot immediately before invoking the profile. A truncated Story is rejected with `STORY_CONTEXT_TRUNCATED` even if a caller obtained its raw digest through some other local integration.

### `ethogram_run_story`

Requires:

```json
{
  "storyId": "admin-access-requires-approval",
  "expectedRevision": "<64-character project digest>",
  "expectedStoryDigest": "<64-character Story digest>",
  "acknowledgeExternalEffects": true
}
```

The acknowledgement reduces accidental calls; it is not proof of human consent. Only one run can be active. A second is rejected with `RUN_IN_PROGRESS`. The server never retries automatically.

Success contains the overall verdict, ordered expectation results, matchers, observed call counts, matching call ids, bounded observed evidence, and an operation id. A source change, timeout, cancellation, or worker exit after execution started reports that effects may have occurred and retry is unsafe. These states do not receive PASS/FAIL.

## Resources

- `ethogram://docs`
- `ethogram://docs/{topic}`
- `ethogram://project`
- `ethogram://agents/{encodedAgentId}`
- `ethogram://stories/{encodedStoryId}`

Agent and Story ids use canonical percent encoding, including reserved characters and Unicode. Documentation remains available when the project is invalid. Dynamic Agent and Story instances are not enumerated during `resources/list`; tools return deliberate resource links after inspection. Direct project-resource reads always load a fresh stable snapshot and do not serve stale fallback data.

## Prompts

- `learn-ethogram` tailors an explanation to developers, technical leaders, managers, QA, platform/SRE, security, privacy/compliance, product/domain owners, support, maintainers, or MCP host integrators.
- `diagnose-ethogram-story` validates the id, embeds a complete revision-bound normalized contract, treats project content as untrusted data, and prepares a diagnostic workflow. It never runs the Story or pretends observed evidence is present when only the contract is available.

## Trust and safety model

Ethogram supports trusted local projects. Config, Agents, Stories, profiles, and imported dependencies are executable Node.js modules. Discovery may therefore access files, network, subprocesses, or environment variables even before a Story run.

The MCP protocol process never imports those modules. It launches a disposable child worker over Node IPC, drains consumer stdout/stderr, enforces a timeout, waits for confirmed process exit, and escalates from `SIGTERM` to `SIGKILL` when necessary. The fixed project identity is canonicalized once. Config, package, source entrypoint symlinks, escaping directories, and project-relative imports that resolve outside the root are rejected.

This is failure containment, not an OS sandbox. Run the MCP only for projects you trust.

GIVEN, WHEN, tool inputs/outputs, model responses, and provider/model metadata can contain sensitive or regulated data. Raw worker IPC is capped at 4 MiB; public DTOs also have per-field, collection, depth, node, and total-byte budgets and are marked when truncated. Ethogram does not claim semantic redaction. The host may send returned context to its model, and the execution profile may contact external services.

## Interpreting results

- **PASS:** every supported expectation matcher passed for one completed execution.
- **FAIL:** execution completed and at least one supported matcher failed.
- **Operational error:** the agent/profile/evidence operation failed; not evaluated.
- **Stale project:** preconditions no longer match; execution did not start.
- **Stale execution:** sources changed after execution started; effects may have occurred; no verdict is published through MCP.
- **Timeout/cancellation/worker exit:** completion is unknown; effects may have occurred during a run.

`tool-called` means a call attempt was observed. An attempt whose operational status is `error` still satisfies presence; it does not prove the tool succeeded.

## Troubleshooting

1. Call `ethogram_doctor` in static mode.
2. Fix package/config issues.
3. Use load mode only for a trusted project.
4. Inspect the public error code and operation id.
5. Do not attach raw evidence to a support ticket without reviewing and redacting it.
6. Do not automatically retry an effectful run.

Common public codes include `MISSING_ETHOGRAM_CONFIG`, `INVALID_STORY_EXPORT`, `PROFILE_EXECUTION_FAILED`, `STORY_CONTEXT_TRUNCATED`, `PROJECT_PAYLOAD_TOO_LARGE`, `PROJECT_PATH_ESCAPE`, `STALE_PROJECT`, `STALE_EXECUTION`, `RUN_IN_PROGRESS`, `PROJECT_WORKER_TIMEOUT`, and `PROJECT_WORKER_EXITED`.

`operationId` is a local correlation value for the current error or run. It is not telemetry and does not imply a recoverable server-side history. A safe support bundle contains Ethogram/MCP/Node versions, OS, host name/version, static doctor output, and the operation id. Never attach raw evidence, prompts, credentials, or environment variables without local review and redaction. Report issues at [GitHub Issues](https://github.com/leonardocamacho1983/ethogram/issues).

Doctor statuses mean:

- `static-ready`: Node, project path, package, and config checks pass without evaluating project modules.
- `ready`: load mode also completed a stable trusted-project load.
- `not-ready`: at least one requested check failed; inspect its code and remediation.

## Verification

```bash
npm run test:mcp
npm run typecheck
npm test
```

The MCP suite covers typed strict schemas, runtime JavaScript contract validation, and invalid-output rejection; grounded broad-intent, adversarial capability-negative, compliance, and audience-matrix knowledge retrieval; static/load diagnostics; bounded project lists with direct Agent lookup; schema-preserving wide-Story truncation and execution refusal; PASS, FAIL, malformed profile outcome/tool I/O, serialization failure, stale, timeout, cancellation, concurrency, acknowledgement, and oversized-evidence behavior; directory, file-symlink, and relative-import escape; stdout isolation; worker crash containment; real modern and legacy stdio negotiation; revision-bound pagination; and clean package installation outside the monorepo.
