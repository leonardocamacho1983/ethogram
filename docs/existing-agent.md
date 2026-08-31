# Integrate an existing agent

Install the published alpha packages, then create configuration only:

```bash
npm install --save-dev @ethogram/core@0.1.0-alpha.1 @ethogram/cli@0.1.0-alpha.1
npx ethogram init --existing
```

Add three thin integration surfaces:

1. An Agent descriptor names the existing agent for Ethogram.
2. A Story supplies GIVEN context, WHEN input, and behavioral EXPECTATIONS.
3. An execution profile maps the Story input to the agent's existing public entry point and instruments its real tool boundary through `callTool`.

The profile may translate inputs and outputs. It must not copy agent policy, branch on Story IDs, inspect an expectation to decide which tool to call, fabricate a trace, or teach the original agent about Ethogram.

Start the read-only UI with `npx ethogram dev`. Source changes reload automatically. A Story must be rerun after a reload before its evidence is current.
