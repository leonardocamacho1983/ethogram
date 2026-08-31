# Packages

The public packages are `@ethogram/core@0.1.0-alpha.1` and `@ethogram/cli@0.1.0-alpha.1`. Both are published on npm and available through the `next` tag.

## Core

The core package exports `defineAgent`, `defineStory`, and `defineExecutionProfile`, plus TypeScript types for Stories, GIVEN data, EXPECTATIONS, tool contracts, and framework-owned evidence. `expectations` is canonical; `then` remains a backward-compatible alias during the alpha.

## CLI

The CLI exposes `ethogram` with:

- `ethogram init [--existing]`
- `ethogram dev [--project <path>] [--port <number>] [--no-open]`
- `ethogram --help`
- `ethogram --version`

`dev` binds to localhost, loads the selected consumer project, watches relevant source files, and serves a read-only UI. It does not persist run history.

Both packages are published at `0.1.0-alpha.1`, with the CLI pinned to the exact matching core version.
