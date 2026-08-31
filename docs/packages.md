# Packages

The public packages are `@ethogram/core` and `@ethogram/cli`. The npm scope is controlled and the repository manifests use these final names. Nothing has been published yet.

## Core

The core package exports `defineAgent`, `defineStory`, and `defineExecutionProfile`, plus TypeScript types for Stories, GIVEN data, EXPECTATIONS, tool contracts, and framework-owned evidence. `expectations` is canonical; `then` remains a backward-compatible alias during the alpha.

## CLI

The CLI exposes `ethogram` with:

- `ethogram init [--existing]`
- `ethogram dev [--project <path>] [--port <number>] [--no-open]`
- `ethogram --help`
- `ethogram --version`

`dev` binds to localhost, loads the selected consumer project, watches relevant source files, and serves a read-only UI. It does not persist run history.

Both packages are prepared at `0.1.0-alpha.0`. No npm publication is part of this release-preparation change.
