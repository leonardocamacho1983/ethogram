# Packages

The public packages are `@ethogram/core`, `@ethogram/cli`, and `@ethogram/mcp`. The npm `next` tag points to the coordinated `0.1.0-alpha.2` release.

Install the authoring API and local interface together:

```bash
npm install --save-dev @ethogram/core@next @ethogram/cli@next
```

Use the exact MCP prerelease in host configuration so a later alpha cannot change underneath a saved command:

```bash
npx -y @ethogram/mcp@0.1.0-alpha.2 --project /absolute/path/to/your-agent-project
```

## Core

`@ethogram/core` exports `defineAgent`, `defineStory`, and `defineExecutionProfile`, plus TypeScript types for Stories, GIVEN data, EXPECTATIONS, tool contracts, and framework-owned evidence. `expectations` is canonical; `then` remains a backward-compatible alias during the alpha.

Core fails closed on empty expectation lists, duplicate expectation ids, unsupported matcher kinds, empty matcher tool names, and authored verdict fields.

## CLI

`@ethogram/cli` exposes `ethogram` with:

- `ethogram init [--existing]`
- `ethogram dev [--project <path>] [--port <number>] [--no-open]`
- `ethogram --help`
- `ethogram --version`

`dev` binds to localhost, loads the selected consumer project, watches relevant source files, and serves a read-only UI. It does not persist run history.

The CLI exports `@ethogram/cli/runtime` only as a narrow isolated-worker facade for `@ethogram/mcp`. The generic engine and TypeScript adapter are not public extension APIs.

## MCP

`@ethogram/mcp` exposes `ethogram-mcp` with:

- `ethogram-mcp [--project <path>]`
- `ethogram-mcp [--load-timeout-ms <number>] [--run-timeout-ms <number>]`
- `ethogram-mcp --help`
- `ethogram-mcp --version`

It uses local stdio, MCP SDK v2, and supports modern MCP 2026-07-28 negotiation plus the SDK's 2025-era compatibility path. The package depends on the exact matching CLI release and keeps consumer project evaluation outside the protocol process.

All three packages are versioned `0.1.0-alpha.2`, with exact Ethogram package dependencies where runtime compatibility matters.
