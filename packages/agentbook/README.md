# Ethogram core

The code-first authoring contract for Ethogram Agents, Stories, behavioral matchers, and consumer-owned local execution profiles.

This package is prepared as `@ethogram/core@0.1.0-alpha.0` but has not been published yet.

## Public API

Runtime values:

- `defineAgent`
- `defineStory`
- `defineExecutionProfile`

Public types cover Agent and Story authoring, legacy and structured GIVEN values, `tool-called` and `tool-not-called` matchers, the generic external execution-profile/tool contract, and framework-neutral verdict-free external execution evidence.

Stories use `given`, `when`, and canonical `expectations`. `then` remains a backward-compatible alias for the alpha.

Execution profiles always declare `tools`, including `tools: {}` when a third-party framework owns tool dispatch. A completed profile may return optional `ExternalExecutionEvidence`; Ethogram retains ownership of canonical observation normalization and behavioral evaluation.

Story expectations declare required behavior. They never contain behavioral verdicts.

The current matchers are `tool-called` and `tool-not-called`. Node.js 20.9 or newer is required. See the repository documentation for the framework-owned evidence contract and alpha limitations.
