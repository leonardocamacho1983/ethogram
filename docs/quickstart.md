# New-project quickstart

This guide describes the public `0.1.0-alpha.0` journey. The npm commands become usable after the packages are published.

## Requirements

- Node.js 20.9 or newer
- a TypeScript or Node.js project with a named `package.json`

## Install and initialize

```bash
npm install --save-dev @ethogram/core@0.1.0-alpha.0 @ethogram/cli@0.1.0-alpha.0
npx ethogram init
npx ethogram dev
```

Initialization is non-destructive. It creates missing files only when every existing target either matches the starter exactly or is absent. A conflicting file aborts the operation without overwriting anything.

The starter contains:

- `ethogram.config.mjs`
- `agents/access-request.agent.ts`
- `stories/admin-access-requires-approval.agent.stories.ts`
- `execution/access-request.profile.ts`

The Agent, Story, and profile files are the source of truth. The browser UI is read-only. It presents GIVEN, WHEN, and EXPECTATIONS, then runs the selected Story when you choose **Run Story**.

Ethogram reloads the project when relevant TypeScript or JavaScript files change. Any previous PASS or FAIL is cleared or marked stale; rerun the Story for evidence from the new revision.

The Access Request starter is deterministic and local. It demonstrates the execution and evaluation contract; it does not make a model-quality claim.
