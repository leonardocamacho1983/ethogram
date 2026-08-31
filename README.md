# Ethogram

Ethogram is a local, code-first behavioral testing tool for TypeScript and Node.js agents.

> Public alpha preparation: `0.1.0-alpha.0`. The `@ethogram` npm scope is controlled and the package manifests use the final public names. Nothing has been published yet.

Ethogram is read-only by design. Agents, Stories, execution profiles, GIVEN values, WHEN input, and EXPECTATIONS live in your project files. The local UI discovers and runs that code; it does not edit or save it.

## Alpha scope

- TypeScript/Node projects on Node.js 20.9 or newer
- local developer operation through `ethogram init` and `ethogram dev`
- `tool-called` and `tool-not-called` expectations
- consumer-owned execution profiles and framework-owned, verdict-free execution evidence
- ephemeral current-run evidence only

Ethogram does not currently provide Python support, hosted or cloud operation, a PR bot, CI comments, run history, Compare, or tool-order matchers.

## Quickstart

After the alpha packages are published:

```bash
npm install --save-dev @ethogram/core@0.1.0-alpha.0 @ethogram/cli@0.1.0-alpha.0
npx ethogram init
npx ethogram dev
```

`ethogram init` creates `ethogram.config.mjs`, an Agent descriptor, a Story, and a local execution profile. The generated Story uses `given`, `when`, and canonical `expectations`. The UI evaluates those EXPECTATIONS against tool-call facts produced by the execution.

Editing an Agent, Story, execution profile, or imported TypeScript/JavaScript source triggers an automatic project reload. Rerun the Story to produce current evidence.

## Guides

- [New-project quickstart](docs/quickstart.md)
- [Integrate an existing agent](docs/existing-agent.md)
- [Framework-owned execution evidence](docs/execution-evidence.md)
- [Packages](docs/packages.md)
- [Alpha limitations](docs/limitations.md)
- [Release preparation and package-scope migration](docs/RELEASE-READINESS.md)

The executable Tests 01–09 under [`tests/`](tests/) are the frozen architectural baseline. Their historical records retain the Agentbook name where that was accurate at the time.

## License and feedback

Ethogram is available under the [MIT License](LICENSE). Report alpha issues in the [GitHub repository](https://github.com/leonardocamacho1983/ethogram/issues).
