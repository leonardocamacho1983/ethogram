# Ethogram CLI

Local Ethogram initialization and read-only developer runtime for TypeScript/Node projects.

The public alpha is available as `@ethogram/cli@0.1.0-alpha.1` under the npm `next` tag.

```bash
npx ethogram init
npx ethogram init --existing
npx ethogram dev
```

Use `ethogram init --existing` to create only `ethogram.config.mjs` in a project that already owns an agent implementation. Normal `ethogram init` adds the deterministic Access Request starter. Both modes preserve conflicting user-owned files and abort without partial writes.

`ethogram dev` accepts `--project <path>`, `--port <number>`, and `--no-open`. It serves a localhost-only, code-first UI: project files are the source of truth and the UI does not save edits. Relevant source changes reload automatically, and previous execution evidence is cleared or marked stale until the Story is rerun.

Node.js 20.9 or newer is required. Ethogram does not persist run history.
