# Ethogram 0.1.0-alpha.2

This release adds a local MCP surface, tightens the behavioral contract, and makes the first run easier to understand.

## What changed

- Added `@ethogram/mcp` for versioned product knowledge, static and load diagnostics, revision-bound project inspection, and deliberate execution of one Story.
- Added worker isolation, bounded public payloads, path-confinement checks, run preconditions, timeout and cancellation handling, and explicit external-effects acknowledgement to the MCP path.
- Made `@ethogram/core` reject empty expectation lists, duplicate expectation ids, unsupported matchers, empty tool names, and authored verdict fields.
- Added stricter runtime validation around project loading, profile results, tool input/output, and external evidence.
- Changed the generated Access Request starter to use structured `given` data and read that data from the current Story during execution.
- Rewrote the root and package READMEs around the developer's first run, generated files, integration choices, result semantics, limitations, and troubleshooting.
- Added a private security-reporting policy.

## Install

```bash
npm install --save-dev @ethogram/core@next @ethogram/cli@next
npx ethogram init
npx ethogram dev
```

For a compatible MCP host:

```bash
npx -y @ethogram/mcp@0.1.0-alpha.2 --project /absolute/path/to/your-agent-project
```

## Important limits

Ethogram remains a local TypeScript and Node.js alpha. It supports `tool-called` and `tool-not-called`; a call attempt counts as called even when the tool returns an operational error. PASS applies only to the declared matchers for one completed execution.

Project modules are trusted executable Node.js code. MCP worker isolation protects protocol framing and contains crashes and hangs, but it is not an operating-system sandbox. A Story run may have external effects and is never retried automatically.

See the [README](../README.md), [MCP guide](mcp.md), and [alpha limitations](limitations.md) for the complete contract.
