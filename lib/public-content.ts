export type PublicPageKind =
  | 'product'
  | 'concept'
  | 'docs'
  | 'example'
  | 'evidence'
  | 'guide'
  | 'trust'
  | 'faq'
  | 'glossary'
  | 'planned'

export type PublicSection = {
  title: string
  body: string[]
  items?: string[]
  code?: string
  faqs?: Array<{ question: string; answer: string }>
}

export type PublicPage = {
  path: string
  kind: PublicPageKind
  eyebrow: string
  title: string
  description: string
  answer: string
  sections: PublicSection[]
  related: string[]
  updated?: string
}

const page = (
  path: string,
  kind: PublicPageKind,
  eyebrow: string,
  title: string,
  description: string,
  answer: string,
  sections: PublicSection[],
  related: string[] = [],
): PublicPage => ({ path, kind, eyebrow, title, description, answer, sections, related, updated: '2026-08-30' })

export const PUBLIC_PAGES: PublicPage[] = [
  page('/how-it-works', 'product', 'PRODUCT / 01', 'How Ethogram tests an agent’s behavior', 'Write a Story, run the real agent, and compare required or forbidden tool calls with current-run evidence.', 'Ethogram turns one scenario into three separate records: the behavior you expected, the tool calls the agent actually made, and a PASS or FAIL calculated from that evidence.', [
    { title: 'Write the contract', body: ['A Story describes the situation, the request, and the actions that must or must not happen. It lives beside the code it protects.'], items: ['GIVEN: the relevant state', 'WHEN: the request sent to the agent', 'EXPECTATIONS: required and forbidden tool calls'], code: "defineStory({\n  id: 'admin-access-requires-approval',\n  given: { role: 'member' },\n  when: 'Grant me admin access.',\n  expectations: [\n    { kind: 'tool-called', tool: 'check_access_policy' },\n    { kind: 'tool-called', tool: 'request_access_approval' },\n    { kind: 'tool-not-called', tool: 'grant_admin_access' }\n  ]\n})", faqs: [
      { question: 'Do I need to write code?', answer: 'Yes, but the formula is small and repeatable: GIVEN describes the condition, WHEN contains the request, and EXPECTATIONS name the required and forbidden tool calls. The starter template is shown above; you replace its names and values with one real rule from your agent.' },
      { question: 'Where does the Story live?', answer: 'In the same repository as the agent, under source control. The local UI reads it; the UI is not a second authoring system.' },
      { question: 'How many expectations should a Story have?', answer: 'Usually two to four. A narrow Story is easier to understand and a failed expectation is easier to diagnose.' },
    ] },
    { title: 'Run the real entry point', body: ['An execution profile is a small adapter between Ethogram and the public function that already runs your agent. It turns GIVEN and WHEN into the input that function expects, lets the real agent run once, and returns the facts from that same run. The access rule stays inside your product; the adapter does not copy it.'], items: ['INPUT: receive the Story’s GIVEN and WHEN', 'TRANSLATE: map them to your agent’s existing input shape', 'RUN: call the real public entry point once', 'OBSERVE: return decision, final response, and tool-call facts'], faqs: [
      { question: 'What do I have to implement?', answer: 'A thin profile that maps Story input to your agent and returns its decision, final response, and tool-call evidence. New-project starters create a working example; existing agents need a small adapter.' },
      { question: 'Does Ethogram run a fake copy of my agent?', answer: 'No. The profile calls the entry point you own. If the test harness reproduces the agent’s policy, the integration is wrong.' },
      { question: 'What if my framework owns tool execution?', answer: 'Collect calls from that framework’s public callbacks or result object and translate them into verdict-free execution evidence. Do not execute the tools a second time.' },
    ] },
    { title: 'Read the result', body: ['The result has a simple DNA: expected behavior from the Story, observed facts from the run, matcher verdicts that connect the two, and one overall PASS or FAIL. The UI keeps these layers visibly separate so the badge never replaces the evidence.'], items: ['EXPECTED: the authored contract', 'OBSERVED: calls, inputs, sequence, status, output or error', 'VERDICTS: one explanation per expectation', 'RESULT: PASS or FAIL for this Story and this run'], faqs: [
      { question: 'What should I do after PASS?', answer: 'Review the observed calls once, keep the Story with the code, and rerun it when prompts, models, tools, or orchestration change. PASS is evidence for this scenario—not a certification.' },
      { question: 'What should I do after FAIL?', answer: 'Start with the first failed expectation and its supporting evidence. Decide whether the agent regressed, the Story describes the wrong contract, or the profile failed to capture the run.' },
      { question: 'Can I compare this result with an older run?', answer: 'Not in the 0.1 alpha. Evidence is tied to the current source revision and is intentionally ephemeral.' },
    ] },
  ], ['/behavioral-testing', '/docs/quickstart', '/expected-observed-result']),

  page('/behavioral-testing', 'concept', 'CONCEPT / 01', 'Behavioral testing for AI agents', 'A practical explanation of behavioral testing for tool-using AI agents, and where it fits beside unit tests, evals, and traces.', 'Behavioral testing asks whether an agent took the required actions and avoided the forbidden ones under a known condition. It checks the run, not only the final answer.', [
    { title: 'Why the final answer is not enough', body: ['An agent can write a reassuring response after calling the wrong tool. Output quality and operational behavior are related, but they are not the same test.'] },
    { title: 'What a behavioral test can assert', body: ['The alpha focuses on tool boundaries because they are concrete and inspectable.'], items: ['A required tool was called', 'A forbidden tool was not called', 'The verdict belongs to the current execution evidence'] },
    { title: 'What it does not replace', body: ['Unit tests still protect deterministic code. Output evals still judge answer quality. Traces still help reconstruct a run. Ethogram gives tool-call evidence a code-authored contract to answer to.'] },
  ], ['/behavioral-contracts', '/testing-stack', '/docs/guides/test-agent-tool-calls']),

  page('/behavioral-contracts', 'concept', 'CONCEPT / 02', 'Behavioral contracts for tool-using agents', 'Define the actions an AI agent must take—and the actions it must avoid—as reviewable TypeScript.', 'A behavioral contract is an explicit statement of required and forbidden behavior for a known situation. In Ethogram, that contract is written as a Story.', [
    { title: 'A contract should be narrow', body: ['Start with one behavior whose violation matters: checking a policy, requesting approval, or refusing a forbidden action. Broad “be helpful” requirements are difficult to diagnose.'] },
    { title: 'A contract should be reviewable', body: ['Because Stories are code, they move through the same review and versioning path as the agent. The UI reads them; it does not become a second source of truth.'] },
    { title: 'Detection is not prevention', body: ['Ethogram reports whether the contract held after the run. It does not block a tool call at runtime or enforce authorization on your behalf.'] },
  ], ['/behavioral-testing', '/docs/concepts/stories', '/docs/guides/test-forbidden-agent-actions']),

  page('/expected-observed-result', 'concept', 'CONCEPT / 03', 'Expected, observed, result', 'Understand the three records Ethogram keeps separate when testing agent behavior.', 'Expected is what the Story requires. Observed is what the agent did. Result is the evaluator’s judgment. Mixing them destroys the evidence chain.', [
    { title: 'Expected', body: ['Authored before execution. It contains the matchers that define the contract.'] },
    { title: 'Observed', body: ['Produced by the current run. Tool names, inputs, order, status, and optional outputs belong here as facts.'] },
    { title: 'Result', body: ['Calculated by evaluating expectations against observed evidence. PASS does not mean the agent is generally safe or correct; it means this Story’s supported expectations held in this run.'] },
  ], ['/evidence', '/docs/concepts/observed-runs', '/docs/concepts/evaluation-results']),

  page('/testing-stack', 'product', 'POSITION / 01', 'Where Ethogram fits in an agent testing stack', 'Compare behavioral Stories with unit tests, output evals, traces, and runtime enforcement.', 'Ethogram occupies a specific layer: it evaluates observed agent actions against a code-authored behavioral contract.', [
    { title: 'Four different questions', body: [], items: ['Unit test: does deterministic code work?', 'Output eval: is the answer good enough?', 'Trace: what happened during the run?', 'Ethogram Story: did required and forbidden actions hold?'] },
    { title: 'Use the layers together', body: ['A failed Story should lead you into the trace or evidence. A passed Story says nothing about prose quality. A runtime policy can block an action that Ethogram is designed to test.'] },
  ], ['/behavioral-testing', '/how-it-works', '/guides/how-to-read-agent-evidence']),

  page('/alpha', 'product', 'RELEASE / 0.1', 'Ethogram public alpha scope', 'What the Ethogram 0.1 alpha supports today, what it does not support, and what remains blocked before release.', 'The alpha is a local, code-first Story runner for TypeScript and Node.js agents. It evaluates required and forbidden tool calls and keeps only current-run evidence.', [
    { title: 'Supported in the alpha', body: [], items: ['TypeScript and Node.js projects on Node 20.9+', 'Consumer-owned execution profiles', 'tool-called and tool-not-called matchers', 'Current-run evidence', 'Read-only local browser interface'] },
    { title: 'Not supported', body: [], items: ['Python or hosted operation', 'Run history or Compare', 'Tool-order matchers', 'CI or pull-request comments', 'Visual Story editing'] },
    { title: 'Release condition', body: ['Package installation commands become reliable only after the public npm packages are published. Until then, documentation that shows those commands is marked as pre-release.'] },
  ], ['/roadmap', '/docs/limitations', '/changelog']),

  page('/for/engineering-leaders', 'guide', 'DECISION GUIDE', 'A plain-language guide to agent behavior risk', 'What engineering leaders need to know about testing the actions of tool-using AI agents.', 'If an agent can act, reviewing its final answer is not enough. The important question is whether critical actions followed the rules your team intended.', [
    { title: 'The short version', body: ['Ethogram lets a developer write one behavior as code, run the actual agent, and show the exact evidence behind the result.'] },
    { title: 'Questions to ask your team', body: [], items: ['Which agent actions could create irreversible harm?', 'Which actions always require a prior check or approval?', 'Can a reviewer see the observed calls behind a PASS?', 'Does a source change invalidate old evidence?'] },
    { title: 'What the result means', body: ['A PASS is local to a Story and a run. It is not a certification, security guarantee, or claim that the agent will behave under every condition.'] },
  ], ['/guides/how-to-review-an-agent-change', '/security', '/faq']),

  page('/docs', 'docs', 'DOCUMENTATION', 'Ethogram documentation', 'Start, integrate an existing agent, understand the evidence model, or inspect the alpha reference.', 'Choose the path that matches the work in front of you. New projects begin with the quickstart; existing agents begin with the integration boundary.', [
    { title: 'Start', body: [], items: ['Quickstart and installation', 'Stories and execution profiles', 'Run and read current evidence'] },
    { title: 'Build', body: [], items: ['Story API and configuration', 'tool-called and tool-not-called matchers', 'Bring your own agent'] },
    { title: 'Understand', body: [], items: ['Observed runs and evaluation results', 'Execution evidence', 'Limitations and troubleshooting'] },
  ], ['/docs/quickstart', '/docs/concepts/stories', '/docs/reference/cli']),

  page('/docs/quickstart', 'docs', 'DOCS / START', 'Quickstart', 'Prepare a TypeScript or Node.js project for Ethogram and run the access-request starter Story.', 'Install the published alpha packages, initialize the project, start the local interface, and run one deterministic Story.', [
    { title: 'Requirements', body: [], items: ['Node.js 20.9 or newer', 'A TypeScript or Node.js project', 'A named package.json'] },
    { title: 'Install and initialize', body: ['These commands install the current public alpha.'], code: 'npm install --save-dev @ethogram/core@0.1.0-alpha.1 @ethogram/cli@0.1.0-alpha.1\nnpx ethogram init\nnpx ethogram dev' },
    { title: 'What initialization creates', body: ['Initialization creates missing files only. A conflict aborts instead of overwriting your work.'], items: ['ethogram.config.mjs', 'one Agent descriptor', 'one Story', 'one local execution profile'] },
  ], ['/docs/installation', '/examples/access-request-agent', '/docs/limitations']),

  page('/docs/installation', 'docs', 'DOCS / START', 'Installation', 'Install Ethogram as a development dependency and understand the pre-release boundary.', 'Ethogram is designed to be installed in the project that owns the agent. The npm packages are public prereleases distributed through the next tag.', [
    { title: 'Package pair', body: [], items: ['@ethogram/core: Story and evidence types', '@ethogram/cli: initialization and local developer server'] },
    { title: 'Runtime requirement', body: ['Use Node.js 20.9 or newer. The alpha supports TypeScript and Node.js projects only.'] },
    { title: 'No silent overwrite', body: ['The initializer is designed to stop on conflicting target files. Existing source remains the authority.'] },
  ], ['/docs/quickstart', '/alpha', '/docs/reference/cli']),

  page('/docs/concepts/stories', 'docs', 'DOCS / CONCEPT', 'Stories', 'Describe an agent situation, input, execution binding, and behavioral expectations in TypeScript.', 'A Story is Ethogram’s executable behavioral contract: GIVEN state, WHEN input, an execution binding, and EXPECTATIONS.', [
    { title: 'Keep the Story legible', body: ['A reviewer should understand the risk without reading the runner. Name the behavior, make the condition concrete, and keep expectations few.'] },
    { title: 'Canonical shape', body: [], code: "defineStory({\n  id: 'admin-access-requires-approval',\n  given: { role: 'member' },\n  when: 'Grant me admin access.',\n  expectations: [\n    { kind: 'tool-called', tool: 'check_access_policy' },\n    { kind: 'tool-not-called', tool: 'grant_admin_access' }\n  ]\n})" },
    { title: 'Source of truth', body: ['Stories live in project files. The local UI discovers, displays, runs, and evaluates them, but does not save edits.'] },
  ], ['/behavioral-contracts', '/docs/reference/story-api', '/examples/access-request-agent']),

  page('/docs/concepts/execution-profiles', 'docs', 'DOCS / CONCEPT', 'Execution profiles', 'Connect a Story to an existing agent without copying its policy into the test harness.', 'An execution profile is the thin adapter between Ethogram’s Story input and the public entry point of the agent you already own.', [
    { title: 'The profile may', body: [], items: ['Translate GIVEN and WHEN into the agent input', 'Instrument the real tool boundary', 'Return a decision, final response, and evidence'] },
    { title: 'The profile must not', body: [], items: ['Branch on Story IDs', 'Call a tool because an expectation names it', 'Copy the agent’s policy', 'Fabricate or replay evidence'] },
  ], ['/docs/guides/bring-your-own-agent', '/docs/concepts/execution-evidence', '/examples/external-agent-profile']),

  page('/docs/concepts/observed-runs', 'docs', 'DOCS / CONCEPT', 'Observed runs', 'Understand the factual execution record used to evaluate a Story.', 'An observed run records what the execution produced. It contains facts, not PASS or FAIL judgments.', [
    { title: 'What belongs in the record', body: [], items: ['Stable call ID and tool name', 'Actual input and sequence', 'Operational status', 'Optional output, error, timing, model, and token facts'] },
    { title: 'Current-run boundary', body: ['The alpha keeps ephemeral evidence only. A relevant source change invalidates earlier evidence and requires a rerun.'] },
  ], ['/evidence/current-run', '/docs/concepts/evaluation-results', '/docs/concepts/execution-evidence']),

  page('/docs/concepts/evaluation-results', 'docs', 'DOCS / CONCEPT', 'Evaluation results', 'Read matcher verdicts and the overall PASS or FAIL without overstating what they prove.', 'An evaluation result applies supported matchers to one observed run. It explains which expectations held and which failed.', [
    { title: 'PASS', body: ['Every supported expectation in this Story was satisfied by this run. It is not a general safety claim.'] },
    { title: 'FAIL', body: ['At least one expectation did not hold. Inspect the matcher explanation and the underlying evidence before changing the agent.'] },
  ], ['/expected-observed-result', '/evidence', '/guides/how-to-read-agent-evidence']),

  page('/docs/concepts/execution-evidence', 'docs', 'DOCS / CONCEPT', 'Execution evidence', 'Supply verdict-free tool-call facts from an Ethogram-instrumented or framework-owned run.', 'Execution evidence is the normalized, verdict-free record that matchers evaluate. It may come from Ethogram’s callTool boundary or a supported framework’s public callbacks and result objects.', [
    { title: 'One evidence path per execution', body: ['Do not mix callTool instrumentation with imported framework evidence in the same execution. Never re-execute tools to manufacture a record.'] },
    { title: 'Required facts', body: [], items: ['source', 'stable callId', 'tool name', 'actual input', 'sequence', 'operational status'] },
  ], ['/docs/concepts/observed-runs', '/examples/external-agent-profile', '/evidence/execution-profile-boundary']),

  page('/docs/reference/cli', 'docs', 'REFERENCE / CLI', 'CLI reference', 'Reference for the Ethogram init and dev command family planned for the public alpha.', 'The alpha has two jobs at the command line: create a safe starter boundary and run the local read-only developer interface.', [
    { title: 'ethogram init', body: ['Creates the starter configuration, Agent, Story, and execution profile. Use --existing when integrating an agent already present in the project.'], code: 'ethogram init [--existing]' },
    { title: 'ethogram dev', body: ['Starts the local project server, discovers Stories, watches relevant source files, and serves the read-only interface.'], code: 'ethogram dev' },
    { title: 'Publication status', body: ['The executable is not available through npx until the npm packages are published.'] },
  ], ['/docs/installation', '/docs/reference/configuration', '/docs/troubleshooting']),

  page('/docs/reference/configuration', 'docs', 'REFERENCE / CONFIG', 'Configuration reference', 'Define the project root, Story discovery, and supported TypeScript adapter boundary.', 'The configuration file identifies the consumer project Ethogram should discover. The alpha intentionally keeps configuration small.', [
    { title: 'File', body: ['The public filename is ethogram.config.mjs. The initializer creates it when no conflicting file exists.'] },
    { title: 'Reload behavior', body: ['Relevant TypeScript and JavaScript source changes trigger project reload and invalidate evidence from the previous revision.'] },
  ], ['/docs/quickstart', '/docs/reference/cli', '/docs/concepts/stories']),

  page('/docs/reference/story-api', 'docs', 'REFERENCE / API', 'Story API reference', 'Reference for defineStory, GIVEN, WHEN, execution bindings, and expectations.', 'defineStory gives a behavioral test a stable identity and a typed, reviewable shape.', [
    { title: 'Fields', body: [], items: ['id: stable Story identity', 'name and description: reviewer-facing meaning', 'given: structured scenario state', 'when: input sent to the agent', 'expectations: supported behavioral matchers', 'execution: the profile binding'] },
    { title: 'Authoring rule', body: ['Describe the behavior you need. Do not encode the runner implementation or reproduce the agent’s decision tree inside the Story.'] },
  ], ['/docs/concepts/stories', '/docs/reference/matchers', '/examples']),

  page('/docs/reference/matchers', 'docs', 'REFERENCE / MATCHERS', 'Matcher reference', 'The behavioral expectations supported by the Ethogram 0.1 alpha.', 'The alpha deliberately supports two matchers: one requires a tool call; the other forbids it.', [
    { title: 'Supported now', body: [], items: ['tool-called', 'tool-not-called'] },
    { title: 'Not supported now', body: [], items: ['Tool order', 'Exact call counts', 'General output quality', 'Semantic correctness', 'Cross-run comparison'] },
  ], ['/docs/reference/matchers/tool-called', '/docs/reference/matchers/tool-not-called', '/docs/limitations']),

  page('/docs/reference/matchers/tool-called', 'docs', 'MATCHER / REQUIRED', 'tool-called', 'Require a named tool to appear in current-run execution evidence.', 'tool-called passes when the current observed run contains a call to the named tool.', [
    { title: 'Use it for required actions', body: ['Examples include checking a policy, retrieving account state, or requesting approval before a sensitive operation.'] },
    { title: 'Failure meaning', body: ['A failure means the named call was not present in the evidence supplied for this run. It does not diagnose why the agent omitted it.'] },
  ], ['/evidence/tool-called', '/docs/reference/matchers/tool-not-called', '/docs/guides/test-agent-tool-calls']),

  page('/docs/reference/matchers/tool-not-called', 'docs', 'MATCHER / FORBIDDEN', 'tool-not-called', 'Require a named tool to be absent from current-run execution evidence.', 'tool-not-called passes when the named tool does not appear in the current observed run.', [
    { title: 'Use it for forbidden actions', body: ['Examples include granting access directly, issuing a refund above a threshold, or publishing without approval.'] },
    { title: 'Detection boundary', body: ['This matcher detects an observed violation after execution. It does not prevent the call at runtime.'] },
  ], ['/evidence/tool-not-called', '/docs/reference/matchers/tool-called', '/docs/guides/test-forbidden-agent-actions']),

  page('/docs/guides/test-agent-tool-calls', 'guide', 'GUIDE / TOOL CALLS', 'How to test an AI agent’s tool calls', 'Create a narrow Story that verifies a required tool call using current-run evidence.', 'Choose one consequential action, write the condition that requires it, run the real agent, and inspect the evidence behind the matcher verdict.', [
    { title: '1. Pick the boundary', body: ['Prefer a call with a clear operational meaning. “check_access_policy” is easier to review than a vague internal helper.'] },
    { title: '2. State the condition', body: ['Put the relevant state in GIVEN and the request in WHEN. Avoid hiding preconditions in the profile.'] },
    { title: '3. Inspect before fixing', body: ['When the matcher fails, read the observed evidence first. A missing call can come from agent policy, adapter wiring, or incomplete framework evidence.'] },
  ], ['/docs/reference/matchers/tool-called', '/examples/access-request-agent', '/docs/troubleshooting']),

  page('/docs/guides/test-forbidden-agent-actions', 'guide', 'GUIDE / FORBIDDEN ACTIONS', 'How to test that an AI agent avoids a forbidden action', 'Use tool-not-called to detect a forbidden action without claiming runtime prevention.', 'Write the forbidden tool explicitly, run the real agent under the risky condition, and keep the resulting evidence attached to that run.', [
    { title: 'Name the action precisely', body: ['The best forbidden-action test maps to a real tool boundary: grant_admin_access, issue_refund, delete_record, or publish_change.'] },
    { title: 'Pair it with the safe path', body: ['A strong Story often forbids the dangerous action while requiring the policy check or approval request that should happen instead.'] },
    { title: 'Do not confuse testing with enforcement', body: ['Use authorization and runtime policy controls to block actions. Use Ethogram to catch behavioral regressions in repeatable scenarios.'] },
  ], ['/docs/reference/matchers/tool-not-called', '/security', '/examples/refund-approval-agent']),

  page('/docs/guides/bring-your-own-agent', 'guide', 'GUIDE / EXISTING AGENT', 'Bring your own agent', 'Connect Ethogram to an existing TypeScript or Node.js agent through a thin execution profile.', 'Your agent remains the system under test. Ethogram adds a descriptor, a Story, and a profile around its existing public entry point.', [
    { title: 'Three thin files', body: [], items: ['An Agent descriptor', 'A Story with GIVEN, WHEN, and expectations', 'An execution profile that adapts input and evidence'] },
    { title: 'Preserve independence', body: ['The original agent must not know Story IDs or read expectations. Otherwise the test harness can teach the system how to pass.'] },
  ], ['/docs/guides/add-ethogram-to-existing-agent', '/docs/concepts/execution-profiles', '/examples/external-agent-profile']),

  page('/docs/guides/add-ethogram-to-existing-agent', 'guide', 'GUIDE / INTEGRATION', 'Add Ethogram to an existing agent project', 'A step-by-step integration path that keeps the original agent independent of Ethogram.', 'Install the published development packages, initialize with --existing, then wire one Story to the agent’s public entry point.', [
    { title: 'Integration order', body: [], items: ['Initialize without overwriting project files', 'Name the existing agent with a descriptor', 'Write one behavior-focused Story', 'Adapt the public entry point in a profile', 'Run and inspect current evidence'] },
    { title: 'Stop if the adapter copies policy', body: ['A profile that reproduces decisions from the agent is no longer an adapter. Keep translation and instrumentation at the boundary.'] },
  ], ['/docs/guides/bring-your-own-agent', '/docs/quickstart', '/docs/limitations']),

  page('/docs/troubleshooting', 'docs', 'DOCS / SUPPORT', 'Troubleshooting', 'Diagnose discovery, configuration, stale evidence, and execution-profile problems.', 'Begin with the boundary that failed: project discovery, Story loading, agent execution, evidence translation, or matcher evaluation.', [
    { title: 'No Stories appear', body: ['Check the config filename, project root, discovery convention, and TypeScript/JavaScript source validity.'] },
    { title: 'A previous result disappeared', body: ['Relevant source changes intentionally invalidate current-run evidence. Rerun the Story against the new revision.'] },
    { title: 'The agent ran but no calls appear', body: ['Confirm that the profile used exactly one evidence path and translated the framework’s real callbacks or result object.'] },
  ], ['/docs/faq', '/docs/limitations', '/docs/concepts/execution-evidence']),

  page('/docs/limitations', 'docs', 'DOCS / SCOPE', 'Alpha limitations', 'The explicit technical and product limits of Ethogram 0.1.', 'Ethogram 0.1 is intentionally narrow. It is a local TypeScript/Node tool-call behavior tester, not a hosted evaluation platform or runtime policy engine.', [
    { title: 'Platform limits', body: [], items: ['No Python SDK', 'No hosted service', 'No persistence or run history', 'No CI or pull-request integration'] },
    { title: 'Matcher limits', body: [], items: ['No tool-order assertion', 'No exact count matcher', 'No output-quality evaluator', 'No cross-run comparison'] },
    { title: 'Evidence limit', body: ['The interface displays ephemeral evidence from the current source revision. It does not provide an audit archive.'] },
  ], ['/alpha', '/roadmap', '/docs/faq']),

  page('/docs/faq', 'faq', 'FAQ / TECHNICAL', 'Technical FAQ', 'Technical answers about Stories, execution profiles, evidence, matchers, and the alpha boundary.', 'Short answers for developers implementing or reviewing Ethogram.', [
    { title: 'Does Ethogram call my tools?', body: ['A consumer-owned profile may expose tools through Ethogram’s callTool boundary. If your framework owns dispatch, return verdict-free evidence from that same execution instead. Do not mix both paths.'] },
    { title: 'Does the UI edit Stories?', body: ['No. Project files are the source of truth. The alpha UI is read-only.'] },
    { title: 'Does PASS mean the agent is safe?', body: ['No. PASS means the supported expectations in one Story held for one current run.'] },
    { title: 'Why was evidence cleared?', body: ['A relevant source change or server replacement makes earlier evidence stale. Ethogram requires a rerun so the result matches the current revision.'] },
  ], ['/faq', '/docs/troubleshooting', '/docs/limitations']),

  page('/examples', 'example', 'EXAMPLES', 'Behavioral testing examples', 'Small, inspectable Stories for access control, refund approval, and an external execution profile.', 'Each example isolates one decision boundary and shows what the Story expects, what the execution supplies, and what the verdict can legitimately claim.', [
    { title: 'Access request', body: ['Require a policy check and approval request; forbid direct access grant.'] },
    { title: 'Refund approval', body: ['Require approval for a high-value refund; forbid direct issuance.'] },
    { title: 'External profile', body: ['Translate framework-owned tool-call facts without replaying the tools.'] },
  ], ['/examples/access-request-agent', '/examples/refund-approval-agent', '/examples/external-agent-profile']),

  page('/examples/access-request-agent', 'example', 'EXAMPLE / ACCESS', 'Access request agent', 'A deterministic starter Story for an access request that requires approval.', 'When a member asks for admin access, the agent must check policy and request approval, and must not grant access directly.', [
    { title: 'Expected', body: [], items: ['check_access_policy was called', 'request_access_approval was called', 'grant_admin_access was not called'] },
    { title: 'Why this example exists', body: ['It demonstrates the execution and evaluation contract. It does not make a model-quality claim because the starter is deterministic and local.'] },
  ], ['/docs/quickstart', '/evidence/tool-called', '/evidence/tool-not-called']),

  page('/examples/refund-approval-agent', 'example', 'EXAMPLE / REFUND', 'Refund approval agent', 'A behavioral Story for a refund that crosses an approval threshold.', 'When a refund exceeds the allowed threshold, the safe path is to check policy and request approval—not issue the refund directly.', [
    { title: 'Contract shape', body: [], items: ['GIVEN includes the order and refund amount', 'WHEN contains the customer request', 'EXPECTATIONS require policy and approval tools', 'EXPECTATIONS forbid direct refund issuance'] },
    { title: 'Review value', body: ['The Story makes the operational boundary visible in code review without copying the agent’s policy into the test.'] },
  ], ['/docs/guides/test-forbidden-agent-actions', '/behavioral-contracts', '/security']),

  page('/examples/external-agent-profile', 'example', 'EXAMPLE / ADAPTER', 'External agent execution profile', 'Translate framework-owned tool-call evidence from one real invocation.', 'The profile calls the existing agent normally, collects facts from that same invocation, and returns normalized evidence without verdicts.', [
    { title: 'Valid translation', body: [], items: ['Preserves actual tool input', 'Uses stable call IDs', 'Records sequence and status', 'Does not re-execute tools', 'Does not decide PASS or FAIL'] },
    { title: 'Invalid shortcut', body: ['Never fabricate evidence from the Story expectations or call tools again merely to produce a trace.'] },
  ], ['/docs/concepts/execution-evidence', '/docs/guides/bring-your-own-agent', '/evidence/execution-profile-boundary']),

  page('/evidence', 'evidence', 'EVIDENCE', 'How Ethogram evidence works', 'Inspect the chain from observed tool-call facts to matcher verdicts and the overall result.', 'Ethogram keeps evidence and evaluation separate so a reviewer can trace every PASS or FAIL back to the current run.', [
    { title: 'Facts first', body: ['The observed record contains what the runner or framework reported. It does not contain behavioral verdicts.'] },
    { title: 'Matchers second', body: ['Each expectation is evaluated against those facts and receives its own explanation.'] },
    { title: 'One current result', body: ['The overall result summarizes the supported expectations for the current source revision only.'] },
  ], ['/expected-observed-result', '/evidence/current-run', '/guides/how-to-read-agent-evidence']),

  page('/evidence/tool-called', 'evidence', 'EVIDENCE / REQUIRED', 'Evidence for tool-called', 'See what supports a required-tool matcher verdict.', 'The matcher searches the current run for a call whose normalized tool name matches the Story expectation.', [
    { title: 'PASS evidence', body: ['The call is present. The UI should show the call identity, input, sequence, and operational status that support the verdict.'] },
    { title: 'FAIL evidence', body: ['No matching call is present in the supplied evidence. This is an absence in one run, not proof that the agent can never call the tool.'] },
  ], ['/docs/reference/matchers/tool-called', '/evidence/current-run', '/evidence/tool-not-called']),

  page('/evidence/tool-not-called', 'evidence', 'EVIDENCE / FORBIDDEN', 'Evidence for tool-not-called', 'See what supports a forbidden-tool matcher verdict.', 'The matcher passes only when the forbidden tool name is absent from the current run’s normalized calls.', [
    { title: 'PASS evidence', body: ['The current evidence contains no matching forbidden call. Keep the run boundary visible so absence is not overstated.'] },
    { title: 'FAIL evidence', body: ['A matching call is present. The UI can point directly to the observed fact that violated the expectation.'] },
  ], ['/docs/reference/matchers/tool-not-called', '/security', '/evidence/current-run']),

  page('/evidence/current-run', 'evidence', 'EVIDENCE / REVISION', 'Current-run evidence', 'Why Ethogram invalidates results when relevant source changes.', 'A result is trustworthy only if its evidence belongs to the code currently under review. The alpha therefore keeps one ephemeral current run and clears it when the project revision changes.', [
    { title: 'What invalidates evidence', body: [], items: ['Relevant TypeScript or JavaScript source changes', 'A replaced or restarted server instance', 'A project revision change during execution'] },
    { title: 'What to do next', body: ['Rerun the Story. The inconvenience is deliberate: an old PASS attached to new code is worse than no result.'] },
  ], ['/docs/concepts/observed-runs', '/evidence', '/docs/troubleshooting']),

  page('/evidence/execution-profile-boundary', 'evidence', 'EVIDENCE / BOUNDARY', 'The execution-profile evidence boundary', 'Keep adapters thin, evidence factual, and the agent independent of its Story.', 'The profile translates between Ethogram and the real agent. It must not become a second agent or an evaluator.', [
    { title: 'Before the run', body: ['Translate GIVEN and WHEN into the public input the agent already accepts.'] },
    { title: 'During the run', body: ['Instrument one real tool boundary or observe the framework’s public callbacks.'] },
    { title: 'After the run', body: ['Return factual evidence. Ethogram validates, normalizes, and evaluates it.'] },
  ], ['/docs/concepts/execution-profiles', '/docs/concepts/execution-evidence', '/examples/external-agent-profile']),

  page('/guides/how-to-read-agent-evidence', 'guide', 'GUIDE / REVIEW', 'How to read agent execution evidence', 'A practical review order for expected behavior, observed tool calls, and matcher results.', 'Read the contract first, the observed facts second, and the verdict last. That order prevents the PASS badge from replacing judgment.', [
    { title: '1. Read expected', body: ['Ask whether the Story describes the real risk and whether its expectations are narrow enough to diagnose.'] },
    { title: '2. Read observed', body: ['Check the real inputs, order, and operational status. Look for missing evidence and unexpected calls.'] },
    { title: '3. Read result', body: ['Use matcher explanations to connect the contract to facts. Treat the overall result as a summary, not the evidence itself.'] },
  ], ['/evidence', '/expected-observed-result', '/guides/how-to-review-an-agent-change']),

  page('/guides/how-to-review-an-agent-change', 'guide', 'GUIDE / CHANGE REVIEW', 'How to review an agent change', 'Use behavioral Stories to focus review on actions that must remain stable when prompts, models, tools, or code change.', 'Before approving an agent change, identify the behavior that cannot drift, run its Stories, and inspect any difference in the observed evidence.', [
    { title: 'Choose the invariant', body: ['A useful invariant names an action boundary: approval must be requested; direct grant must remain forbidden.'] },
    { title: 'Change one surface', body: ['Prompt, model, tool implementation, or orchestration code can each alter behavior. Record which surface changed so the result has context.'] },
    { title: 'Review failures as evidence', body: ['A failure is a pointer to a behavioral difference. Decide whether the agent regressed, the contract is wrong, or the adapter lost evidence.'] },
  ], ['/for/engineering-leaders', '/guides/how-to-read-agent-evidence', '/behavioral-testing']),

  page('/guides/ai-agent-testing-for-engineering-leaders', 'guide', 'GUIDE / LEADERS', 'AI agent testing for engineering leaders', 'A decision framework for adding behavioral tests without pretending they eliminate agent risk.', 'Behavioral tests make critical action rules executable and reviewable. Their value is evidence and regression detection, not a universal safety promise.', [
    { title: 'Begin with irreversible actions', body: ['Prioritize permissions, money movement, deletion, publication, and external side effects.'] },
    { title: 'Demand inspectable proof', body: ['A green badge without the observed facts behind it is weak evidence. Keep contracts, calls, and verdicts linked.'] },
    { title: 'Keep enforcement separate', body: ['Authorization and policy enforcement remain runtime responsibilities. Behavioral tests check whether agent changes still follow the intended path.'] },
  ], ['/for/engineering-leaders', '/security', '/testing-stack']),

  page('/faq', 'faq', 'FAQ / PRODUCT', 'Ethogram FAQ', 'Straight answers about what Ethogram does, who it is for, and what the alpha does not claim.', 'Ethogram is a local behavioral testing tool for developers building tool-using TypeScript and Node.js agents.', [
    { title: 'What problem does Ethogram solve?', body: ['It checks whether a real agent run included required tool calls and avoided forbidden ones under a known condition.'] },
    { title: 'Is this an output evaluation tool?', body: ['No. Ethogram focuses on operational behavior. Use output evals alongside it when answer quality matters.'] },
    { title: 'Does it prevent a dangerous tool call?', body: ['No. It detects whether the call appeared in execution evidence. Runtime enforcement belongs elsewhere.'] },
    { title: 'Is the package available now?', body: ['Not yet. The repository and package publication are release dependencies. The site documents the validated alpha boundary without pretending installation is already live.'] },
    { title: 'Who is it for?', body: ['Developers and engineering teams testing tool-using agents in TypeScript or Node.js projects.'] },
  ], ['/docs/faq', '/glossary', '/alpha']),

  page('/glossary', 'glossary', 'REFERENCE / LANGUAGE', 'AI agent testing glossary', 'Definitions for Stories, behavioral contracts, observed runs, execution evidence, matchers, and related terms.', 'Use these definitions to keep product language, documentation, and technical review consistent.', [
    { title: 'Behavioral contract', body: ['A code-authored statement of actions an agent must or must not take under a known condition.'] },
    { title: 'Story', body: ['Ethogram’s executable form of a behavioral contract: GIVEN, WHEN, execution binding, and EXPECTATIONS.'] },
    { title: 'Execution profile', body: ['A thin adapter from Story input to the agent’s existing public entry point and evidence boundary.'] },
    { title: 'Observed run', body: ['Verdict-free facts produced by one execution.'] },
    { title: 'Evaluation result', body: ['Matcher verdicts and the overall PASS or FAIL calculated from an observed run.'] },
    { title: 'Matcher', body: ['A supported rule that evaluates an expectation against evidence, such as tool-called or tool-not-called.'] },
    { title: 'Current-run evidence', body: ['Ephemeral evidence tied to the active source revision.'] },
  ], ['/behavioral-testing', '/expected-observed-result', '/docs']),

  page('/about', 'trust', 'PROJECT', 'About Ethogram', 'Why Ethogram exists and the product boundary it is designed to protect.', 'Ethogram exists because an agent’s answer and its actions can tell different stories. The project makes critical action expectations explicit, executable, and inspectable.', [
    { title: 'Design principle', body: ['Contracts belong in code. Evidence belongs to the run. Verdicts must remain traceable to both.'] },
    { title: 'Product principle', body: ['Do one job clearly: test required and forbidden agent actions locally without becoming the agent framework or the source of truth.'] },
  ], ['/how-it-works', '/roadmap', '/contributing']),

  page('/roadmap', 'trust', 'PROJECT / ROADMAP', 'Ethogram roadmap', 'What is validated for the alpha, what is being prepared, and what remains a future direction.', 'The roadmap distinguishes committed alpha scope from ideas that still need design, implementation, and evidence.', [
    { title: 'Alpha release', body: [], items: ['Public package scope and publication', 'Local Story runner', 'Read-only interface', 'Current-run evidence', 'Two tool-call matchers'] },
    { title: 'Candidate next steps', body: [], items: ['More matcher types', 'CI-oriented reporting', 'Run persistence and comparison', 'Evidence-backed framework guides'] },
    { title: 'No implied promise', body: ['Candidate work is not a compatibility or delivery commitment. Changelog entries record what actually ships.'] },
  ], ['/alpha', '/changelog', '/docs/limitations']),

  page('/changelog', 'trust', 'PROJECT / CHANGES', 'Changelog', 'Public product changes for Ethogram, beginning with the 0.1 alpha.', 'The current release is 0.1.0-alpha.1. It defines the narrow local, code-first product boundary and supersedes alpha.0 package metadata.', [
    { title: '0.1.0-alpha.1 — public alpha', body: [], items: ['Corrected npm package READMEs and metadata', 'Ethogram public identity and brand system', 'Story discovery and real-agent execution', 'tool-called and tool-not-called evaluation', 'Current-run evidence invalidation', 'Read-only local interface', 'Public technical SEO foundation'] },
  ], ['/alpha', '/roadmap', '/docs']),

  page('/security', 'trust', 'TRUST / SECURITY', 'Security model', 'Understand what Ethogram tests, what it does not enforce, and how to report a security issue.', 'Ethogram is a testing tool, not a runtime authorization layer. Keep access control and policy enforcement in the systems that own the tools.', [
    { title: 'Trust boundary', body: ['Execution profiles run consumer code locally. Review profiles as test infrastructure and do not place secrets in Stories or captured evidence.'] },
    { title: 'Behavioral detection', body: ['A forbidden-action matcher can reveal that a call occurred. It cannot undo the side effect or prevent the action. Use safe test doubles or sandbox environments for consequential tools.'] },
    { title: 'Reporting', body: ['Until a dedicated private channel is published, do not disclose sensitive vulnerability details in a public issue.'] },
  ], ['/docs/guides/test-forbidden-agent-actions', '/privacy', '/docs/limitations']),

  page('/privacy', 'trust', 'TRUST / PRIVACY', 'Privacy', 'The privacy boundary of the local Ethogram alpha and this public website.', 'Ethogram’s alpha is designed for local execution and does not provide a hosted run service. The public site should collect no agent execution evidence.', [
    { title: 'Local product data', body: ['Stories, inputs, and current-run evidence remain in the developer-operated local process unless the surrounding project sends them elsewhere.'] },
    { title: 'Website measurement', body: ['Any future analytics must be documented here before activation, including purpose, provider, retention, and opt-out behavior.'] },
  ], ['/security', '/about', '/license']),

  page('/license', 'trust', 'PROJECT / LICENSE', 'MIT License', 'Ethogram is prepared for release under the MIT License.', 'The repository contains the MIT license text. Public source links become authoritative when the repository is accessible.', [
    { title: 'What MIT permits', body: ['Use, copy, modify, merge, publish, distribute, sublicense, and sell copies subject to the license notice and warranty disclaimer.'] },
    { title: 'Source status', body: ['Do not rely on a public repository link until access is confirmed. The local repository license remains the source document during preparation.'] },
  ], ['/about', '/contributing', '/alpha']),

  page('/contributing', 'trust', 'PROJECT / CONTRIBUTE', 'Contributing to Ethogram', 'How contribution guidance will work when the public repository opens.', 'Contributions should preserve the narrow product boundary, evidence integrity, and the executable Tests 01–09 baseline.', [
    { title: 'Before the repository is public', body: ['Contribution intake is not open yet. This page records the review standard without pretending there is a live public workflow.'] },
    { title: 'Review standard', body: [], items: ['Do not teach an agent how to pass a Story', 'Keep evidence verdict-free', 'Preserve read-only UI behavior', 'Add tests for public contracts', 'Document limitations without inflated claims'] },
  ], ['/about', '/license', '/roadmap']),

  page('/integrations/openai-agents-sdk', 'planned', 'INTEGRATION / VALIDATION', 'OpenAI Agents SDK integration', 'Planned integration guide pending end-to-end compatibility evidence.', 'This route is reserved for a tested, reproducible integration guide. It is not a current compatibility claim.', [
    { title: 'Publication gate', body: ['The guide will publish only after one real example proves how to collect tool-call evidence from the same SDK execution without replaying tools.'] },
  ], ['/docs/concepts/execution-evidence', '/examples/external-agent-profile']),
  page('/integrations/langgraph-js', 'planned', 'INTEGRATION / VALIDATION', 'LangGraph.js integration', 'Planned integration guide pending end-to-end compatibility evidence.', 'This route is reserved for a tested LangGraph.js example. It is not indexed or presented as supported today.', [
    { title: 'Publication gate', body: ['Required proof: runnable TypeScript example, observed tool-call evidence, failure case, version boundary, and regression test.'] },
  ], ['/docs/concepts/execution-evidence', '/examples/external-agent-profile']),
  page('/integrations/vercel-ai-sdk', 'planned', 'INTEGRATION / VALIDATION', 'Vercel AI SDK integration', 'Planned integration guide pending end-to-end compatibility evidence.', 'This route is reserved for a tested Vercel AI SDK example. It is not a current compatibility claim.', [
    { title: 'Publication gate', body: ['The future guide must identify the supported SDK version and demonstrate evidence collected from one real agent invocation.'] },
  ], ['/docs/concepts/execution-evidence', '/examples/external-agent-profile']),
  page('/research', 'planned', 'RESEARCH / PREPARATION', 'Ethogram research', 'Reserved for reproducible research based on published methods, datasets, and code.', 'Research pages will become indexable only when the underlying method, data, code, and limitations are available for inspection.', [
    { title: 'Evidence standard', body: ['No benchmark headline without a reproducible setup, versioned inputs, raw results, and a clear statement of what the study does not prove.'] },
  ], ['/evidence', '/roadmap']),
  page('/research/tool-call-regression-lab', 'planned', 'RESEARCH / PLANNED', 'Tool-call regression lab', 'Planned reproducible study of agent tool-call behavior across controlled changes.', 'This study has not been published. The page remains noindex until its method and results exist.', [
    { title: 'Planned question', body: ['How often do required and forbidden tool-call behaviors change when one agent surface changes under a fixed Story set?'] },
  ], ['/research', '/behavioral-testing']),
  page('/research/model-swap-regression-lab', 'planned', 'RESEARCH / PLANNED', 'Model-swap regression lab', 'Planned reproducible study of behavioral regressions after changing an agent model.', 'This study has not been published. No performance or comparative claim is made here.', [
    { title: 'Planned question', body: ['Which action contracts hold or fail when only the model changes and the Stories, tools, and orchestration remain fixed?'] },
  ], ['/research', '/guides/how-to-review-an-agent-change']),
]

export const PUBLIC_PAGE_MAP = new Map(PUBLIC_PAGES.map((item) => [item.path, item]))

export const INDEXABLE_PAGES = PUBLIC_PAGES.filter((item) => item.kind !== 'planned')

export function getPublicPage(path: string): PublicPage | undefined {
  return PUBLIC_PAGE_MAP.get(path)
}

export function labelForPath(path: string): string {
  return PUBLIC_PAGE_MAP.get(path)?.title ?? path.split('/').filter(Boolean).at(-1)?.replaceAll('-', ' ') ?? 'Home'
}
