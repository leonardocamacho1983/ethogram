# `@ethogram/cli`

The local Ethogram initializer and read-only developer interface for TypeScript and Node.js projects.

> Public alpha `0.1.0-alpha.2`. APIs may change between `0.x` releases. Node.js 20.9 or newer is required.

## Install

```bash
npm install --save-dev @ethogram/core@next @ethogram/cli@next
```

Install core as a direct dependency because generated and hand-written Stories import it. The locally installed CLI is available through `npx ethogram`.

## Try the starter

Run these commands from a project whose `package.json` has a non-empty `name`:

```bash
npx ethogram init
npx ethogram dev
```

`init` adds a deterministic Access Request example: configuration, an Agent descriptor, a Story, and an execution profile. It checks every target before writing. If it finds conflicting content, it preserves all existing files and writes nothing.

`dev` binds to `127.0.0.1`, opens a read-only browser interface, and uses the current directory as the project root. Select the generated Story and choose **Run Story**. The starter makes no model call and has no external side effects.

## Connect an existing agent

```bash
npx ethogram init --existing
```

This mode creates only `ethogram.config.mjs`. Add your own Agent descriptor, Story, and execution profile, then start the interface with `npx ethogram dev`.

## Commands

```text
ethogram init [--existing]
ethogram dev [--project <path>] [--port <number>] [--no-open]
ethogram --help
ethogram --version
```

- `--project` loads a project outside the current directory.
- `--port` changes the default port, `4317`. Port `0` selects an available port.
- `--no-open` starts the server without opening a browser.

Relevant TypeScript and JavaScript changes reload automatically. A previous result is cleared or marked stale until you run the Story against the new revision. Ethogram does not persist run history.

The package exports `@ethogram/cli/runtime` only for the isolated worker used by `@ethogram/mcp`. It is not a general engine extension API.

Read the [starter guide](https://github.com/leonardocamacho1983/ethogram/blob/main/docs/quickstart.md), [existing-agent guide](https://github.com/leonardocamacho1983/ethogram/blob/main/docs/existing-agent.md), and [alpha limitations](https://github.com/leonardocamacho1983/ethogram/blob/main/docs/limitations.md).

License: MIT. Issues: <https://github.com/leonardocamacho1983/ethogram/issues>
