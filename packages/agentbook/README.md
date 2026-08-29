# @agentbook/core

The code-first public authoring contract for Agentbook Agents, Stories, behavioral matchers, and consumer-owned local execution profiles.

This package is currently versioned for local architectural validation. It is not published to a registry.

## Public API

Runtime values:

- `defineAgent`
- `defineStory`
- `defineExecutionProfile`

Public types cover Agent and Story authoring, legacy and structured GIVEN values, `tool-called` and `tool-not-called` matchers, and the generic external execution-profile/tool contract.

Story expectations declare required behavior. They never contain behavioral verdicts.
