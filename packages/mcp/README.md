# `@ethogram/mcp`

Local Model Context Protocol server for understanding Ethogram, inspecting a configured project, and deliberately running one revision-bound behavioral Story.

Public alpha `0.1.0-alpha.2`. APIs may change between `0.x` releases. Node.js 20.9 or newer is required.

## Start

From npm:

```bash
npx -y @ethogram/mcp@0.1.0-alpha.2 --project /absolute/path/to/your-agent-project
```

From a source checkout:

```bash
npm install
npm run mcp:build
node /absolute/path/to/ethogram/packages/mcp/dist/cli.js \
  --project /absolute/path/to/your-agent-project
```

The server uses local stdio. stdout is reserved for MCP frames; startup and protocol diagnostics use stderr. Use absolute paths in desktop-host configuration.

For hosts that use an `mcpServers`-style configuration:

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

Host formats and capabilities differ. This package is verified with the official MCP SDK clients over stdio in both the 2026-07-28 protocol era and the supported 2025-era compatibility path.

Options:

- `--project <path>`: fixed project root; defaults to the server working directory.
- `--load-timeout-ms <100–120000>`: project-load timeout; defaults to 15,000 ms.
- `--run-timeout-ms <100–900000>`: Story-run timeout; defaults to 120,000 ms.
- `--help` and `--version`.

## What it exposes

### Tools

- `ethogram_explain`: answers from bundled, versioned Ethogram knowledge without loading project code. It reports `exact`, `partial`, or `unknown`, returns the real topic index, and can tailor emphasis for developer, QA, management, product/domain, platform, security, privacy/compliance, support, maintainer, and MCP-host audiences.
- `ethogram_doctor`: checks Node, project, package, and configuration. Static mode does not evaluate project modules; load mode does.
- `ethogram_get_project`: returns the normalized project, Agents, counts, and a content revision without exposing the absolute root.
- `ethogram_list_stories`: returns bounded summaries in stable, revision-bound pages. Summaries intentionally omit execution digests.
- `ethogram_get_story`: returns the complete public contract and the revision/digest needed for deliberate execution. A truncated contract returns `storyDigest: null` and `executionAllowed: false`.
- `ethogram_run_story`: runs one inspected Story after an explicit external-effects acknowledgement. It requires the exact revision and Story digest, allows only one active run, and is never safe to retry automatically.

The run worker rechecks contract completeness on the same stable snapshot before profile invocation. A truncated contract is rejected with `STORY_CONTEXT_TRUNCATED`, even if its digest was learned outside the MCP surface.

Every tool has strict input and typed output schemas. Returned Story text and evidence are untrusted data, never instructions.

### Resources

- `ethogram://docs`
- `ethogram://docs/{topic}`
- `ethogram://project`
- `ethogram://agents/{canonicalPercentEncodedId}`
- `ethogram://stories/{canonicalPercentEncodedId}`

Static documentation remains discoverable when a project is invalid. Agent and Story instances are not enumerated during `resources/list`; deliberate inspection tools return resource links. Direct reads of project resources evaluate trusted project modules and always use a fresh stable snapshot.

### Prompts

- `learn-ethogram`: audience-specific learning grounded in the bundled corpus.
- `diagnose-ethogram-story`: prepares a diagnostic workflow around one complete revision-bound contract. It does not run the Story and does not claim that observed evidence is present.

## Safe execution contract

Run input has this shape:

```json
{
  "storyId": "admin-access-requires-approval",
  "expectedRevision": "<64 lowercase hex characters>",
  "expectedStoryDigest": "<64 lowercase hex characters>",
  "acknowledgeExternalEffects": true
}
```

The acknowledgement reduces accidental execution; it is not proof of human consent. Inspect the complete Story first. Never invoke a run automatically, concurrently, or in a retry loop.

Interpret results narrowly:

- PASS: all supported matchers passed for one completed execution.
- FAIL: execution completed and at least one matcher failed.
- Operational error: profile, tool, evidence, or runtime failed; not evaluated.
- Stale project: inspected preconditions changed before execution.
- Stale execution: sources changed after execution began; effects may have occurred.
- Timeout, cancellation, or worker exit: completion is unknown; effects may have occurred.

`tool-called` counts an observed call attempt even when its operational status is `error`. That does not mean the tool succeeded.

## Trust, privacy, and process isolation

Ethogram supports trusted local projects. Config, Agent, Story, profile, and dependency modules are executable Node.js code. Loading them may access files, network, subprocesses, and environment variables. The disposable worker protects protocol framing and contains ordinary logs, crashes, exits, and hangs; it is not an OS sandbox.

The project root is canonicalized once. Config/package/source-file symlinks, directories that resolve outside it, and project-relative imports that escape it are rejected. Timeout, cancellation, and shutdown wait for confirmed worker exit, escalating from `SIGTERM` to `SIGKILL` after a short grace period.

Raw worker IPC is capped at 4 MiB. Public DTOs also bound string length, collection size, object keys, depth, total nodes, and total bytes; truncation is explicit. These are availability controls, not semantic secret or PII redaction. A host may send context to its model, and an execution profile may call external providers. Review those data policies before exposing evidence.

## Doctor and support

Doctor status meanings:

- `static-ready`: static prerequisites pass; project modules were not evaluated.
- `ready`: load mode also completed a stable trusted-project load.
- `not-ready`: a requested check failed; inspect its code and remediation.

Start with static doctor, then use load mode only for a trusted project. Public errors include a local `operationId`, effect uncertainty, retry safety, and remediation where available. The id is for local correlation, not telemetry or stored history.

A safe support bundle contains package/Node versions, OS, host name/version, static doctor output, and the operation id. Review and redact all evidence locally. Never attach raw prompts, credentials, environment variables, tool inputs, or tool outputs by default.

Issues: <https://github.com/leonardocamacho1983/ethogram/issues>

## Package API and lifecycle

The primary supported surface is the `ethogram-mcp` binary. The package also exports `createEthogramMcpServer`, `ProjectWorkerClient`, and `EthogramMcpError` for local integration tests and advanced embedders. Closing a created server also closes its project workers; `ProjectWorkerClient.close()` is idempotent.

## Verification

The repository runs protocol/integration, runtime JavaScript and invalid-output validation, broad-intent/adversarial-negative/audience-matrix retrieval, direct lookup beyond list bounds, schema-preserving truncation, PASS/FAIL/malformed-profile errors, payload-bound, confinement, worker-lifecycle, modern/legacy negotiation, revision/pagination, and clean packed-install tests:

```bash
npm run test:mcp
npm run typecheck
npm test
```

License: MIT.
