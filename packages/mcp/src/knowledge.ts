import { ETHOGRAM_RELEASE_VERSION } from './version.js'

export const ETHOGRAM_VERSION = ETHOGRAM_RELEASE_VERSION
export const DOCS_VERSION = ETHOGRAM_RELEASE_VERSION
export const CONTENT_LANGUAGE = 'en'

export const KNOWLEDGE_AUDIENCE_VALUES = [
  'agent-developer',
  'application-developer',
  'technical-leader',
  'engineering-manager',
  'qa',
  'platform-sre',
  'security',
  'privacy-compliance',
  'product-domain-owner',
  'support',
  'maintainer',
  'mcp-host-integrator',
] as const

export type KnowledgeAudience = typeof KNOWLEDGE_AUDIENCE_VALUES[number]

export type KnowledgeArticle = {
  id: string
  title: string
  summary: string
  audiences: readonly string[]
  keywords: readonly string[]
  related: readonly string[]
  body: string
}

export const KNOWLEDGE_ARTICLES: readonly KnowledgeArticle[] = Object.freeze([
  {
    id: 'overview',
    title: 'What Ethogram is',
    summary: 'Ethogram is a local, code-first behavioral contract testing tool for TypeScript and Node.js AI agents.',
    audiences: ['all'],
    keywords: ['what', 'why', 'ethogram', 'agent testing', 'behavioral contract', 'o que é', 'para que serve'],
    related: ['mental-model', 'limitations', 'stakeholders'],
    body: `# What Ethogram is

Ethogram turns critical agent behavior into version-controlled behavioral contracts called Stories. A Story describes a scenario and the tool behavior that must or must not occur. Ethogram runs the real consumer-owned agent, records observable tool-call evidence, and evaluates deterministic matchers.

Ethogram is not an agent framework, generic quality score, hosted tracing suite, or output-only evaluator. The existing agent keeps its runtime, tools, model, policies, and public entry point. Project files remain the source of truth.

A PASS means only that the supported matchers passed for one observed execution. It does not prove that the agent is generally correct, safe, fair, secure, production-ready, or compliant.`,
  },
  {
    id: 'mental-model',
    title: 'Expected, observed, and result',
    summary: 'Ethogram separates the authored behavioral contract, execution evidence, and evaluator-owned verdict.',
    audiences: ['all'],
    keywords: ['expected', 'observed', 'result', 'verdict', 'pass', 'fail', 'evidence', 'modelo mental'],
    related: ['authoring', 'evaluation-semantics'],
    body: `# Expected, observed, and result

**Expected** is owned by the Story: GIVEN data, WHEN input, and EXPECTATIONS. It says what behavior matters without containing runtime verdicts.

**Observed** is owned by the real execution: decisions, final response, tool-call attempts, operational statuses, timeline, and provider/model metadata when supplied. Observed evidence must remain verdict-free.

**Result** is owned by Ethogram's deterministic evaluator. It compares each supported matcher with observed calls and returns PASS or FAIL per expectation plus the overall Story verdict.

Keeping these records separate prevents an execution profile from declaring its own success and keeps the result inspectable.`,
  },
  {
    id: 'authoring',
    title: 'Agents and Stories',
    summary: 'The public authoring model is Agent, Story, GIVEN, WHEN, EXPECTATIONS, matcher, and execution capability.',
    audiences: ['agent-developer', 'application-developer', 'qa', 'technical-leader'],
    keywords: ['agent', 'story', 'given', 'when', 'expectations', 'matcher', 'defineStory', 'como escrever'],
    related: ['mental-model', 'workflows', 'existing-agent'],
    body: `# Agents and Stories

An **Agent descriptor** gives a stable id, name, description, and icon to the consumer's existing agent.

A **Story** is a version-controlled behavioral contract. **GIVEN** is scenario data, **WHEN** is the input sent through the execution profile, and **EXPECTATIONS** are deterministic behavioral requirements.

The alpha supports two matcher kinds: \`tool-called\` and \`tool-not-called\`. Expectation ids must be unique and every matcher names a non-empty tool. Stories are ordinary TypeScript or JavaScript modules and remain the source of truth; the MCP server does not edit them.`,
  },
  {
    id: 'execution',
    title: 'Execution profiles and evidence',
    summary: 'A thin consumer-owned profile maps a Story to the existing agent and returns verdict-free evidence.',
    audiences: ['agent-developer', 'application-developer', 'maintainer', 'security'],
    keywords: ['profile', 'execution', 'callTool', 'external evidence', 'framework evidence', 'tool calls'],
    related: ['existing-agent', 'security-privacy', 'evaluation-semantics'],
    body: `# Execution profiles and evidence

An execution profile adapts a Story to the consumer's existing agent. It may expose Ethogram-observed tools through \`callTool\`, or translate framework-owned trace data into Ethogram's verdict-free external-evidence contract. One run cannot mix both observation sources.

The profile must report what happened, not whether the Story passed. Inputs, outputs, errors, timing, token usage, provider, and model are evidence. Provider/model values are framework-reported metadata, not independently verified facts.

Profiles execute real code and can call external systems. Running a Story can therefore have cost and irreversible side effects.`,
  },
  {
    id: 'evaluation-semantics',
    title: 'Matcher and verdict semantics',
    summary: 'The alpha evaluator deterministically checks presence or absence of named tool-call attempts.',
    audiences: ['agent-developer', 'qa', 'technical-leader', 'security', 'product-domain-owner'],
    keywords: ['tool-called', 'tool-not-called', 'matcher', 'attempt', 'error', 'pass', 'fail', 'semantics'],
    related: ['mental-model', 'limitations'],
    body: `# Matcher and verdict semantics

\`tool-called\` passes when at least one observed call attempt has the named tool. \`tool-not-called\` passes when no observed call attempt has that name. A call with operational status \`error\` still counts as called; behavioral presence and operational success are different questions.

Each expectation result includes its matcher, verdict, observed call count, and matching call ids. The Story passes only when every expectation passes. An operational execution error is **not evaluated** and never receives PASS or FAIL.`,
  },
  {
    id: 'architecture',
    title: 'Architecture and source-of-truth boundary',
    summary: 'Core owns authoring contracts, the CLI owns adapters/runtime/evaluation, and the repository owns Stories.',
    audiences: ['technical-leader', 'platform-sre', 'maintainer', 'mcp-host-integrator'],
    keywords: ['architecture', 'core', 'cli', 'mcp', 'source of truth', 'local', 'read-only ui'],
    related: ['mcp', 'security-privacy'],
    body: `# Architecture and source-of-truth boundary

\`@ethogram/core\` provides authoring contracts. \`@ethogram/cli\` discovers consumer modules, invokes the language adapter and execution profile, records evidence, and owns deterministic evaluation. \`@ethogram/mcp\` exposes versioned knowledge and isolated project operations to MCP hosts.

The repository remains authoritative. Neither the developer UI nor MCP creates a parallel database of Agents, Stories, or verdicts. The alpha keeps only the current operation result and has no run history.`,
  },
  {
    id: 'workflows',
    title: 'New-project workflow',
    summary: 'Install core and CLI, initialize a deterministic starter, then author and run one high-value Story.',
    audiences: ['agent-developer', 'application-developer', 'platform-sre', 'support'],
    keywords: ['install', 'init', 'dev', 'quickstart', 'new project', 'setup', 'começar'],
    related: ['authoring', 'existing-agent', 'troubleshooting'],
    body: `# New-project workflow

Install the matching Ethogram packages, run \`ethogram init\`, and start \`ethogram dev\`. Initialization is non-destructive: it creates only missing starter files and aborts without partial writes on conflicts.

Start with one behavior the product cannot afford to regress. Keep the Story close to the agent, use deterministic fixtures where appropriate, and review the contract with the domain owner and people affected by the agent's decision.`,
  },
  {
    id: 'existing-agent',
    title: 'Integrating an existing agent',
    summary: 'Add a descriptor, Story, and thin profile without moving the existing agent into Ethogram.',
    audiences: ['application-developer', 'agent-developer', 'maintainer'],
    keywords: ['existing agent', 'bring your own agent', 'integration', 'framework', 'profile', 'evidence mapping'],
    related: ['execution', 'authoring'],
    body: `# Integrating an existing agent

Run \`ethogram init --existing\` to create configuration only. Add an Agent descriptor, one or more Stories, and a thin execution profile that calls the agent's existing public entry point.

If the framework owns tool dispatch, translate evidence from that same invocation. Do not re-execute tools to manufacture a trace and do not place PASS/FAIL inside external evidence. Validate that the profile maps GIVEN and WHEN without changing the behavior under test.`,
  },
  {
    id: 'mcp',
    title: 'Using the Ethogram MCP server',
    summary: 'The local stdio server explains Ethogram, diagnoses setup, exposes project context, and runs one acknowledged revision-bound Story.',
    audiences: ['agent-developer', 'platform-sre', 'mcp-host-integrator', 'support'],
    keywords: ['mcp', 'tools', 'resources', 'prompts', 'stdio', 'run story', 'revision', 'acknowledge'],
    related: ['security-privacy', 'troubleshooting', 'architecture'],
    body: `# Using the Ethogram MCP server

Documentation tools and resources work without a valid Ethogram project. Project discovery evaluates trusted project modules in an isolated worker. Inspect the project and Story first; execution requires the returned project revision, Story digest, and an explicit acknowledgement that external effects are possible.

The tools are \`ethogram_explain\`, \`ethogram_doctor\`, \`ethogram_get_project\`, \`ethogram_list_stories\`, \`ethogram_get_story\`, and \`ethogram_run_story\`. Resources expose the documentation index/topics plus the current project, Agents, and Stories. Prompts provide audience-specific learning and revision-bound Story diagnosis.

Do not invoke \`ethogram_run_story\` automatically, concurrently, or in a retry loop. PASS, FAIL, operational error, stale, timeout, cancellation, and not evaluated are distinct states. MCP resources provide context, prompts provide reusable workflows, and tools provide model-controlled actions.`,
  },
  {
    id: 'security-privacy',
    title: 'Trust, safety, privacy, and data movement',
    summary: 'Ethogram does not certify GDPR or other compliance; it is local but trusted code and evidence may reach the host, model, or external profile.',
    audiences: ['security', 'privacy-compliance', 'platform-sre', 'technical-leader', 'mcp-host-integrator'],
    keywords: ['security', 'privacy', 'pii', 'secrets', 'side effects', 'trusted project', 'sandbox', 'data movement', 'gdpr', 'compliance', 'certification'],
    related: ['execution', 'mcp', 'limitations'],
    body: `# Trust, safety, privacy, and data movement

Ethogram supports trusted local projects. Loading config, Agents, Stories, and profiles evaluates consumer-owned Node.js modules with the consumer process's filesystem, network, subprocess, and environment authority. Worker isolation protects MCP protocol framing and contains crashes; it is not an OS security sandbox.

GIVEN, WHEN, tool inputs/outputs, model responses, provider metadata, and errors may contain sensitive data. The MCP server bounds payloads but does not claim semantic secret redaction. A host may send returned context to its model, and a profile may contact external providers. Review host and model data policies before exposing regulated evidence.

Ethogram provides behavioral evidence, not GDPR certification, legal compliance assessment, or a guarantee that processing is lawful.`,
  },
  {
    id: 'limitations',
    title: 'Current alpha capabilities and limitations',
    summary: 'The alpha is intentionally narrow: local TypeScript/Node, focused current runs, and two tool-presence matchers.',
    audiences: ['all'],
    keywords: ['limitations', 'unsupported', 'roadmap', 'python', 'ci', 'history', 'compare', 'cloud', 'limitações'],
    related: ['overview', 'evaluation-semantics'],
    body: `# Current alpha capabilities and limitations

Supported now: local TypeScript/Node projects on Node 20.9+, code-authored contracts, consumer-owned profiles, framework-owned verdict-free evidence, \`tool-called\`, \`tool-not-called\`, the read-only developer UI, and one focused MCP Story run.

Not supported now: Python, hosted/cloud operation, persistence or run history, Compare, tool-order matchers, visual authoring, a general \`ethogram run\` command, CI gates, PR comments, universal framework compatibility, automatic secret redaction, or proof of generic agent safety/quality. Future ideas must not be described as current features.`,
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting and support',
    summary: 'Use doctor first, keep operational errors separate from FAIL, and share codes rather than sensitive evidence.',
    audiences: ['agent-developer', 'platform-sre', 'support', 'maintainer'],
    keywords: ['doctor', 'error', 'troubleshooting', 'support', 'not ready', 'stale', 'timeout', 'resolver problema'],
    related: ['mcp', 'workflows', 'security-privacy'],
    body: `# Troubleshooting and support

Use \`ethogram_doctor\` in static mode first. Missing package/config checks include remediation without evaluating project modules. Load mode validates the trusted project in an isolated worker and may trigger module top-level effects.

A behavioral FAIL means execution completed and at least one matcher failed. An operational error, stale revision, timeout, cancellation, or worker exit means not evaluated. Do not retry effectful operations automatically. For support, share the public error code and operation id; inspect and redact evidence locally before attaching it.`,
  },
  {
    id: 'stakeholders',
    title: 'Who should care and who should review Stories',
    summary: 'Behavioral contracts are useful beyond agent developers and should be reviewed by technical and domain stakeholders.',
    audiences: ['engineering-manager', 'product-domain-owner', 'qa', 'security', 'support', 'all'],
    keywords: ['stakeholders', 'manager', 'product', 'qa', 'domain owner', 'governance', 'review', 'quem deve'],
    related: ['overview', 'mental-model', 'security-privacy'],
    body: `# Who should care and who should review Stories

Developers and QA use Stories for regression feedback, including repeated runs when nondeterminism matters and explicit discussion of what is not covered. Tech leads review architecture and evidence integrity. Domain owners and representatives of affected users can review GIVEN, WHEN, and EXPECTATIONS as a business rule without reading the execution adapter. Security, privacy, compliance, and Responsible AI reviewers inspect high-impact tool boundaries, retention, data movement, and the absence of any certification claim. Platform/SRE and support teams need lifecycle, compatibility, logs, operational codes, and retry semantics. Managers and product leaders own rollout and adoption, and use coverage to discuss critical behavior—not as a generic quality score.

Change an expectation when the intended rule genuinely changed or the contract was wrong—not merely to make a regression pass.`,
  },
  {
    id: 'glossary',
    title: 'Ethogram glossary',
    summary: 'Definitions for the public vocabulary used by Ethogram.',
    audiences: ['all'],
    keywords: ['glossary', 'definitions', 'agent', 'story', 'given', 'when', 'expectation', 'evidence', 'verdict'],
    related: ['authoring', 'mental-model'],
    body: `# Ethogram glossary

- **Agent:** stable descriptor for the consumer's existing agent.
- **Story:** version-controlled behavioral contract.
- **GIVEN:** scenario facts or structured input data.
- **WHEN:** the instruction or event applied in the scenario.
- **EXPECTATION:** one required or forbidden observable behavior.
- **Matcher:** deterministic rule evaluated against observed evidence.
- **Execution profile:** consumer-owned adapter from Story to real agent invocation.
- **Observed evidence:** verdict-free facts from one invocation.
- **Operational status:** whether a tool call itself succeeded or errored.
- **Behavioral verdict:** PASS/FAIL produced only by Ethogram's evaluator.
- **Revision:** content digest for the stable project snapshot.
- **Story digest:** digest binding execution to the inspected contract.`,
  },
])

export const KNOWLEDGE_BY_ID = new Map(KNOWLEDGE_ARTICLES.map((article) => [article.id, article]))

const stopwords = new Set([
  'about', 'and', 'are', 'at', 'be', 'been', 'being', 'by', 'can', 'como', 'com', 'da', 'das', 'de', 'do',
  'does', 'dos', 'e', 'ela', 'ele', 'em', 'ethogram', 'explain', 'fale', 'for', 'from', 'had', 'has', 'have',
  'how', 'i', 'in', 'is', 'isso', 'its', 'make', 'me', 'my', 'o', 'of', 'on', 'our', 'para', 'por', 'predict',
  'que', 'run', 'running', 'runs', 'sobre', 'support', 'supported', 'supports', 'tell', 'the', 'their', 'this',
  'to', 'um', 'uma', 'use', 'used', 'using', 'via', 'what', 'why', 'with', 'you', 'your',
])

function asksForDefinition(value: string): boolean {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  return /^(?:what\s+is|what'?s|define|explain|tell\s+me\s+about|o\s+que\s+e|que\s+e|explique|fale(?:-me)?\s+sobre)\s+(?:o\s+)?ethogram\s*[?.!]*$/.test(normalized)
    || /^(?:what\s+can\s+ethogram\s+do|what\s+does\s+ethogram\s+support|how\s+does\s+ethogram\s+work)\s*[?.!]*$/.test(normalized)
    || /^(?:o\s+que\s+(?:o\s+)?ethogram\s+faz|como\s+(?:o\s+)?ethogram\s+funciona)\s*[?.!]*$/.test(normalized)
}

function normalizedTokens(value: string): string[] {
  return (value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().match(/[a-z0-9][a-z0-9-]{1,}/g) ?? [])
    .filter((token) => !stopwords.has(token))
}

export function findKnowledge(question: string, limit = 3, audience?: KnowledgeAudience): KnowledgeArticle[] {
  if (asksForDefinition(question)) return [KNOWLEDGE_BY_ID.get('overview')!]
  const tokens = [...new Set(normalizedTokens(question))]
  if (tokens.length === 0) return []
  return KNOWLEDGE_ARTICLES.map((article) => {
    const titleTokens = new Set(normalizedTokens(`${article.id} ${article.title} ${article.summary}`))
    const keywordTokens = new Set(normalizedTokens(article.keywords.join(' ')))
    const bodyTokens = new Set(normalizedTokens(article.body))
    const lexicalScore = tokens.reduce((total, token) => total
      + (keywordTokens.has(token) ? 8 : 0)
      + (titleTokens.has(token) ? 6 : 0)
      + (bodyTokens.has(token) ? 1 : 0), 0)
    const audienceBoost = audience && (article.audiences.includes('all') || article.audiences.includes(audience)) ? 3 : 0
    return { article, lexicalScore, score: lexicalScore + audienceBoost }
  }).filter(({ lexicalScore }) => lexicalScore >= 6)
    .sort((left, right) => right.score - left.score || left.article.id.localeCompare(right.article.id))
    .slice(0, limit)
    .map(({ article }) => article)
}

const validAudiences = new Set<string>([...KNOWLEDGE_AUDIENCE_VALUES, 'all'])
for (const article of KNOWLEDGE_ARTICLES) {
  for (const audience of article.audiences) {
    if (!validAudiences.has(audience)) throw new Error(`Invalid knowledge audience ${audience} in ${article.id}.`)
  }
}
