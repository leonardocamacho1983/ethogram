# Ethogram keyword map — validation and revised priorities

Date: 30 August 2026

## Decision

The opportunity map is useful as a hypothesis list. Its scores, volume labels and difficulty claims are not yet decision-grade because the underlying query data, SERP exports and scoring inputs are not included.

Two gaps have also changed:

- OpenAI now publishes an official Agents SDK testing guide, including tool workflows and workflow-drift tests.
- LangGraph.js publishes an official testing guide for graphs, nodes, edges and partial execution.

Ethogram should not claim that these ecosystems lack testing. The sharper distinction is this:

> Framework tests exercise framework-owned behavior. Ethogram runs the consumer's agent and evaluates observed tool calls against a code-authored Story.

That statement still needs an example for each integration before it becomes a public integration claim.

## Revised P0

| Cluster | Why now | Required proof | Destination |
| --- | --- | --- | --- |
| behavioral testing for TypeScript AI agents | Defines the entity and category | Current alpha, exact limitations | Homepage |
| test AI agent tool calls | Direct fit with both matchers | Reproducible Story and evidence | `/docs/guides/test-agent-tool-calls` |
| verify an AI agent does not call a tool | Strongest differentiated job | Real `tool-not-called` failure and pass | `/docs/guides/test-forbidden-agent-actions` |
| expected vs observed agent behavior | Useful mental model and GEO asset | Stable definitions and source code | `/behavioral-contracts` |
| TypeScript agent behavioral testing | Audience and implementation fit | Five-minute quickstart | `/docs/quickstart` |

## Reframe before publishing

### OpenAI Agents SDK

Do not write “the SDK has no testing.” It now has deterministic testing utilities. A useful Ethogram page must compare boundaries honestly:

- SDK test doubles: deterministic framework workflow testing;
- Ethogram: consumer-owned execution plus Story expectations over current-run evidence;
- evaluation: model and tool-selection quality across repeated runs.

Publish only after an OpenAI Agents SDK execution profile and example are verified.

### LangGraph.js

Do not write “LangGraph has no local testing.” Its documentation covers unit tests and partial graph execution. The Ethogram angle is a repository-owned behavioral Story spanning the real graph execution boundary. Publish only after the adapter works.

### Vercel AI SDK

The SDK exposes tool-call lifecycle and results, which may provide an evidence boundary. Treat the integration page as pending until a real profile is implemented and tested.

### Behavioral contracts

Agent Behavioral Contracts is already used by academic work. Do not present the phrase as an Ethogram invention or rename the product in reaction to one paper. State the distinction:

- behavioral contract: the broader idea;
- Story: Ethogram's code-authored implementation;
- expected / observed / result: Ethogram's record separation.

## Defer

These topics outrun the current alpha and should not become acquisition pages yet:

- model-swap regression benchmark;
- tool-argument validation;
- trajectory or step-order testing;
- CI/CD guides;
- run comparison and history;
- framework compatibility pages without verified adapters;
- security or safety guarantees.

They can remain research hypotheses. They cannot appear as current product capabilities.

## Initial site architecture

```text
/
├── /behavioral-contracts
├── /docs/quickstart
├── /docs/guides/test-agent-tool-calls
├── /docs/guides/test-forbidden-agent-actions
├── /docs/concepts/execution-evidence
├── /docs/limitations
├── /examples/access-request-agent
├── /evidence/tool-called
├── /evidence/tool-not-called
└── /about/ethogram
```

Add framework pages only after their examples pass end to end.

## Editorial rules

- Start with the answer, not a generic introduction.
- Name the exact tool, matcher, framework and limitation.
- Prefer one complete example to five abstract claims.
- Do not write “seamless,” “powerful,” “robust,” “unlock,” “revolutionary” or “developer-native.”
- Avoid repeated three-part slogans and mirrored sentence structures.
- Use contractions when they sound natural.
- Vary paragraph length. A one-line paragraph is allowed when it earns the pause.
- Do not manufacture authority with fake IDs, benchmarks, commits or timings.
- Attribute external concepts and distinguish them from Ethogram terminology.
- Every acquisition page must link to a reproducible example, limitations and the next concrete step.

## Measurement

Treat all traffic and conversion targets in the original map as planning guesses until Analytics and Search Console provide a baseline.

Initial events:

- `click_install`;
- `click_github`;
- `view_story`;
- `view_evidence`;
- `view_limitations`;
- `open_quickstart`.

The first meaningful web conversion is a visit to a reproducible example or quickstart. The first meaningful product conversion is a Story run, but CLI telemetry requires an explicit privacy decision before implementation.
