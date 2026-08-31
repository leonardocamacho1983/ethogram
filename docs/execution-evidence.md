# Framework-owned execution evidence

Some agent frameworks own tool construction and dispatch, so Ethogram cannot wrap the real tool boundary with `callTool`. In that case, the execution profile may return facts from the same framework invocation as `ExternalExecutionEvidence`.

The profile must:

1. invoke the existing framework or agent normally;
2. collect tool-call and tool-result facts from that invocation through the framework's public callbacks or result object;
3. translate those facts once into `ExternalExecutionEvidence`;
4. return `{ decision, finalResponse, evidence }` with `tools: {}`;
5. never mix external evidence with Ethogram `callTool`, re-execute tools, or add PASS/FAIL verdicts.

Each tool call requires a stable `callId`, `name`, actual `input`, `sequence`, and operational `status`. It may include output or error, step, timing, provider, model, finish reason, and token usage.

Ethogram validates and normalizes these verdict-free facts, then evaluates the Story EXPECTATIONS. This is a contract, not a claim of compatibility with every framework.
