# Try Ethogram with the local starter

This path gives you a complete passing Story before you connect Ethogram to your own agent. The starter is deterministic, makes no model call, and has no external side effects.

## Before you start

You need:

- Node.js 20.9 or newer;
- a TypeScript or Node.js project;
- a non-empty `name` in the project's `package.json`.

If you need an empty project, create one with:

```bash
mkdir ethogram-demo
cd ethogram-demo
npm init -y
```

## Install and run

From the project root:

```bash
npm install --save-dev @ethogram/core@next @ethogram/cli@next
npx ethogram init
npx ethogram dev
```

The project installs both packages because generated source imports `@ethogram/core` directly, while `@ethogram/cli` provides the `ethogram` command.

Initialization creates:

- `ethogram.config.mjs`, which tells the CLI where to discover files;
- `agents/access-request.agent.ts`, a metadata descriptor for the example behavior;
- `stories/admin-access-requires-approval.agent.stories.ts`, the scenario and its expectations;
- `execution/access-request.profile.ts`, the local behavior and observable tool boundary.

Initialization is non-destructive. Ethogram first checks every target. If one contains different content, it reports the conflict and writes nothing.

## Run the first Story

`npx ethogram dev` starts a server on `127.0.0.1`, opens the read-only interface, and loads the generated project.

1. Select **Admin Access Requires Approval**.
2. Choose **Run Story**.
3. Confirm that the overall result and all three expectations show PASS.
4. Inspect the observed calls to `check_access_policy` and `request_access_approval`.
5. Confirm that `grant_admin_access` was not called.

The Story owns the input and expectations. The profile reads that input, runs the behavior, and exposes the calls that occurred. Ethogram owns evaluation.

Change `requesterRole` in the Story from `developer` to `manager`, save the file, and run it again. The profile now follows the other policy branch, the observed calls change, and the original expectations fail. This proves that the result comes from current Story input rather than a copied scenario hidden in the profile.

Relevant TypeScript and JavaScript changes reload automatically. Previous results are cleared or marked stale because they belong to an older source revision.

## Next step

When you are ready to test your own behavior, continue with [Integrate an existing agent](existing-agent.md). The starter is an explanation of the boundary, not a model-quality benchmark.
