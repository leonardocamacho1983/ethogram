# Alpha limitations

Ethogram `0.1.0-alpha.0` is intentionally narrow.

Supported:

- local TypeScript/Node projects on Node.js 20.9+
- code-authored Agents, Stories, GIVEN data, WHEN input, and EXPECTATIONS
- consumer-owned execution profiles
- framework-owned verdict-free execution evidence
- `tool-called` and `tool-not-called` matchers
- automatic source reload with current-evidence invalidation

Not supported:

- `ethogram run`
- Python
- hosted or cloud operation
- PR bots or CI comments
- persistence or run history
- Compare
- tool-order matchers
- a visual editor

The alpha API may change across `0.x` prereleases. `then` is accepted only as a compatibility alias; new examples should use `expectations`.
