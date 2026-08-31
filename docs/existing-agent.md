# Integrate an existing agent

Ethogram sits beside your agent. It does not replace the agent's framework, public entry point, tools, model provider, or policy.

## Install configuration only

From the root of the existing TypeScript or Node.js project:

```bash
npm install --save-dev @ethogram/core@next @ethogram/cli@next
npx ethogram init --existing
```

This mode creates only `ethogram.config.mjs`. It does not create or edit agent code.

## Add the three integration files

1. **Agent descriptor:** gives the existing agent a stable id, name, description, and icon inside Ethogram. It is metadata, not another implementation of the agent.
2. **Story:** supplies `given` data and a `when` request, then declares the tool calls that must or must not occur.
3. **Execution profile:** validates and maps Story input, calls the agent's existing public entry point, and exposes the real tool boundary through `callTool`.

The profile is an adapter. It may translate input and output, but it must not:

- copy the agent's policy;
- branch on Story or expectation ids;
- call a tool because an expectation names it;
- fabricate a trace;
- teach the original agent about Ethogram.

Start the interface with:

```bash
npx ethogram dev
```

Run the Story and inspect expected behavior, observed calls, and the resulting verdict separately. After a source reload, run the Story again before treating its evidence as current.

If the agent's framework owns tool construction and dispatch, continue with [Framework-owned execution evidence](execution-evidence.md). Use facts from the same framework invocation; never re-execute a tool merely to create evidence.
