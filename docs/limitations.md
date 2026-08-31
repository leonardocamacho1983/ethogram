# Alpha limitations

Ethogram `0.1.0-alpha.2` is a deliberately narrow public alpha.

Supported:

- local TypeScript/Node projects on Node.js 20.9+
- code-authored Agents, Stories, GIVEN data, WHEN input, and EXPECTATIONS
- consumer-owned execution profiles
- framework-owned verdict-free execution evidence
- `tool-called` and `tool-not-called` matchers
- automatic developer-UI source reload with current-evidence invalidation
- local MCP knowledge, diagnostics, project discovery, resources, prompts, and one revision-bound Story execution

Not supported:

- a general `ethogram run` command or batch MCP execution
- Python
- hosted or cloud operation
- PR bots or CI comments
- persistence or run history
- Compare
- tool-order or tool-success matchers
- a visual editor
- automatic secret/PII redaction
- an OS sandbox for trusted project modules
- proof that an agent is generically safe, correct, fair, compliant, or production-ready

Important semantics:

- `tool-called` counts an observed call attempt even when its operational status is `error`.
- PASS covers only the supported matchers for one completed execution.
- An operational error, timeout, cancellation, worker exit, or stale revision is not evaluated and receives no PASS/FAIL.
- Project discovery evaluates trusted project-owned Node.js modules. Worker isolation protects MCP framing and contains crashes; it does not revoke filesystem, network, subprocess, or environment authority.
- Story evidence can contain sensitive data. Payloads are bounded, but semantic secret redaction is not provided.

The `0.x` API may change between prereleases. `then` is accepted only as a compatibility alias; new examples should use `expectations`.
