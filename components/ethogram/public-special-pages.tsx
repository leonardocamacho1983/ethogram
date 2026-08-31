import Link from 'next/link'
import { ArrowRight, BookOpen, Braces, CircleHelp, Play, ShieldCheck } from 'lucide-react'
import { DocsSearch } from '@/components/ethogram/docs-search'
import { BehaviorProfile, VerdictBadge } from '@/components/ethogram/lab-primitives'
import { PublicFooter, PublicHeader } from '@/components/ethogram/public-site'
import { StoryExplorer } from '@/components/ethogram/story-explorer'
import type { PublicPage, PublicSection } from '@/lib/public-content'

function QuestionAnswers({ label, questions }: { label: string; questions: Array<{ question: string; answer: string }> }) {
  return <div className="eg-context-faq"><span>{label}</span><div>{questions.map((faq) => <section key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></section>)}</div></div>
}

function ContextFaq({ section }: { section: PublicSection }) {
  if (!section.faqs?.length) return null
  return <QuestionAnswers label="COMMON QUESTIONS / DIRECT ANSWERS" questions={section.faqs} />
}

function StoryFormula() {
  return <div className="eg-authoring-formula"><span>A REUSABLE SENTENCE</span><p>When <b>[this condition is true]</b> and someone asks <b>[this request]</b>, the agent must <b>[take the safe action]</b> and must not <b>[take the forbidden action]</b>.</p><div><code>GIVEN = condition</code><code>WHEN = request</code><code>EXPECTATIONS = must + must not</code></div></div>
}

function ProfileTemplate() {
  return <div className="eg-profile-template"><span>STARTER SHAPE · REPLACE THE NAMES WITH YOURS</span><pre><code>{`defineExecutionProfile({
  id: 'access-agent',
  tools: realAccessTools,
  async execute({ story, callTool }) {
    return runAccessAgent({
      role: story.given.role,
      request: story.when,
      callTool
    })
  }
})`}</code></pre><p>The profile translates the Story into the input your agent already accepts. It does not contain the access rule and it does not call tools just because the Story expects them.</p></div>
}

function RunGraph() {
  const nodes = [
    ['YOU WRITE', 'Story', 'GIVEN · WHEN · EXPECTATIONS'],
    ['YOU CONNECT', 'Execution profile', 'thin adapter · one evidence path'],
    ['ETHOGRAM RUNS', 'Your real agent', 'existing entry point · actual tools'],
    ['ETHOGRAM RECORDS', 'Observed evidence', 'calls · inputs · sequence · status'],
    ['ETHOGRAM EVALUATES', 'Current result', 'matcher verdicts · PASS / FAIL'],
  ]
  return <div className="eg-run-graph" aria-label="Flow from Story to current result">
    <div className="eg-run-graph-rail" aria-hidden="true"><span /></div>
    {nodes.map(([owner, title, detail], index) => <div className="eg-run-node" key={title}><span>{String(index + 1).padStart(2, '0')} · {owner}</span><strong>{title}</strong><code>{detail}</code>{index < nodes.length - 1 ? <ArrowRight aria-hidden="true" size={15} /> : <VerdictBadge tone="pass">PASS</VerdictBadge>}</div>)}
  </div>
}

export function HowItWorksPage({ page }: { page: PublicPage }) {
  return <main className="eg-public eg-special-page eg-how-page"><div className="eg-public-shell"><PublicHeader />
    <article>
      <header className="eg-special-hero"><div><span>{page.eyebrow}</span><h1>{page.title}</h1><p>{page.description}</p></div><div className="eg-special-mark"><BehaviorProfile ghostRadii={[22, 21, 20, 22, 19, 21]} radii={[22, 20, 9, 19, 16, 21]} size={220} /><p><span>CONTRACT</span><span>EXECUTION</span><span>EVIDENCE</span><span>RESULT</span></p></div></header>
      <section className="eg-flow-overview"><div className="eg-flow-intro"><span>THE WHOLE LOOP</span><h2>One Story enters. Inspectable evidence comes out.</h2><p>Only two pieces are yours to add: a behavioral Story and a thin execution profile. The agent remains the system under test.</p></div><RunGraph /></section>
      <div className="eg-how-sections">
        {page.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.title}><header><span>{String(index + 1).padStart(2, '0')} / {index === 0 ? 'CONTRACT' : index === 1 ? 'EXECUTION' : 'DECISION'}</span><h2>{section.title}</h2></header>{index === 0 ? <StoryFormula /> : null}<div className="eg-how-content"><div>{section.body.map((body) => <p key={body}>{body}</p>)}{section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}</div>{section.code ? <pre><code>{section.code}</code></pre> : index === 1 ? <div className="eg-profile-teaching"><div className="eg-profile-boundary"><div><span>STORY INPUT</span><code>given + when</code></div><ArrowRight aria-hidden="true" /><div className="is-profile"><span>YOUR PROFILE</span><code>translate + observe</code></div><ArrowRight aria-hidden="true" /><div><span>REAL AGENT</span><code>existing entry point</code></div></div><ProfileTemplate /></div> : <div className="eg-result-dna"><div><span>EXPECTED</span><strong>contract</strong></div><b>+</b><div><span>OBSERVED</span><strong>facts</strong></div><b>+</b><div><span>VERDICTS</span><strong>reasons</strong></div><b>=</b><div className="is-result"><span>RESULT</span><strong>PASS</strong></div></div>}</div><ContextFaq section={section} /></section>)}
      </div>
      <section className="eg-next-action"><span>READY TO SEE THE SHAPE?</span><h2>Read one Story from contract to verdict.</h2><Link href="/examples/access-request-agent">Open the access-request example <ArrowRight aria-hidden="true" /></Link></section>
    </article><PublicFooter /></div></main>
}

const DOC_GROUPS = [
  { label: 'START', links: [['/docs/quickstart', 'Quickstart'], ['/docs/installation', 'Installation']] },
  { label: 'CORE CONCEPTS', links: [['/docs/concepts/stories', 'Stories'], ['/docs/concepts/execution-profiles', 'Execution profiles'], ['/docs/concepts/observed-runs', 'Observed runs'], ['/docs/concepts/evaluation-results', 'Evaluation results'], ['/docs/concepts/execution-evidence', 'Execution evidence']] },
  { label: 'REFERENCE', links: [['/docs/reference/cli', 'CLI'], ['/docs/reference/configuration', 'Configuration'], ['/docs/reference/story-api', 'Story API'], ['/docs/reference/matchers', 'Matchers'], ['/docs/reference/matchers/tool-called', 'tool-called'], ['/docs/reference/matchers/tool-not-called', 'tool-not-called']] },
  { label: 'GUIDES', links: [['/docs/guides/test-agent-tool-calls', 'Test tool calls'], ['/docs/guides/test-forbidden-agent-actions', 'Test forbidden actions'], ['/docs/guides/bring-your-own-agent', 'Bring your own agent'], ['/docs/guides/add-ethogram-to-existing-agent', 'Existing project setup']] },
  { label: 'HELP', links: [['/docs/troubleshooting', 'Troubleshooting'], ['/docs/limitations', 'Alpha limitations'], ['/docs/faq', 'Technical FAQ']] },
] as const

export function DocsHomePage({ page }: { page: PublicPage }) {
  return <main className="eg-public eg-docs-home"><div className="eg-public-shell"><PublicHeader />
    <div className="eg-docs-layout">
      <aside className="eg-docs-nav"><Link href="/docs" className="is-current">Documentation home</Link>{DOC_GROUPS.map((group) => <div key={group.label}><span>{group.label}</span>{group.links.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}</div>)}</aside>
      <article className="eg-docs-main">
        <header className="eg-docs-hero"><span>ETHOGRAM DOCUMENTATION · 0.1 ALPHA</span><h1>Build one Story.<br />See what the agent did.</h1><p>{page.description}</p><DocsSearch /></header>
        <section className="eg-docs-start"><div><span>START HERE</span><h2>Choose the path that matches your codebase.</h2></div><div className="eg-docs-paths"><Link href="/docs/quickstart"><Play aria-hidden="true" /><span>NEW PROJECT</span><strong>Run the deterministic starter</strong><p>See the complete contract → execution → result loop first.</p><b>About 5 minutes <ArrowRight aria-hidden="true" /></b></Link><Link href="/docs/guides/bring-your-own-agent"><Braces aria-hidden="true" /><span>EXISTING AGENT</span><strong>Connect the entry point you already own</strong><p>Add a descriptor, one Story, and a thin execution profile.</p><b>Integration guide <ArrowRight aria-hidden="true" /></b></Link></div></section>
        <section className="eg-docs-map"><div className="eg-docs-map-head"><span>MENTAL MODEL</span><h2>Four objects. One evidence chain.</h2></div><div className="eg-docs-object-grid"><Link href="/docs/concepts/stories"><BookOpen /><span>01</span><strong>Story</strong><p>The condition and behavioral contract.</p></Link><Link href="/docs/concepts/execution-profiles"><Braces /><span>02</span><strong>Profile</strong><p>The adapter to the real agent.</p></Link><Link href="/docs/concepts/execution-evidence"><ShieldCheck /><span>03</span><strong>Evidence</strong><p>Verdict-free facts from the run.</p></Link><Link href="/docs/concepts/evaluation-results"><BehaviorProfile size={42} /><span>04</span><strong>Result</strong><p>Matcher verdicts for this Story.</p></Link></div></section>
        <section className="eg-docs-resources"><div><span>REFERENCE</span><h2>Look up the exact shape.</h2></div><div>{[['/docs/reference/story-api','Story API','Fields, bindings, and authoring rules.'],['/docs/reference/matchers','Matchers','The two expectations supported now.'],['/docs/reference/cli','CLI','init and dev command behavior.'],['/docs/concepts/execution-evidence','Evidence','Required facts and one-path rule.']].map(([href,title,copy])=><Link href={href} key={href}><strong>{title}</strong><p>{copy}</p><ArrowRight /></Link>)}</div></section>
        <section className="eg-docs-help"><CircleHelp /><div><span>STUCK?</span><h2>Start with the boundary that failed.</h2><p>Discovery, Story loading, execution, evidence translation, and evaluation have different fixes.</p></div><Link href="/docs/troubleshooting">Open troubleshooting <ArrowRight /></Link></section>
      </article>
    </div><PublicFooter /></div></main>
}

export function ExamplesHomePage({ page }: { page: PublicPage }) {
  return <main className="eg-public eg-examples-home"><div className="eg-public-shell"><PublicHeader /><article>
    <header className="eg-examples-hero"><span>{page.eyebrow}</span><div><h1>Stories you can read from both sides.</h1><p>A scenario on the left. The code-authored contract and current-run evidence on the right. No sample is useful until you can see why it passed.</p></div></header>
    <section className="eg-example-reading"><span>READ LEFT TO RIGHT · NOTHING IS IMPLIED</span><h2>First understand the rule. Then inspect the code and the run.</h2><div>{[
      ['01','SITUATION · GIVEN','Who is involved, what state are they in, and which limit or permission applies?'],
      ['02','REQUEST · WHEN','What exact sentence or input is sent to the agent?'],
      ['03','RULE · EXPECTATIONS','Which safe actions must happen, and which dangerous action must not happen?'],
      ['04','RUN · OBSERVED','Which tool calls actually occurred in this execution, in what order and with what status?'],
      ['05','DECISION · RESULT','Which expectation passed or failed, and which observed fact supports that verdict?'],
    ].map(([n,t,c])=><div key={n}><span>{n}</span><strong>{t}</strong><p>{c}</p></div>)}</div><p className="eg-reading-example"><b>Access example:</b> member + “Grant me admin access” → check policy + request approval + do not grant directly.</p></section>
    <StoryExplorer />
  </article><PublicFooter /></div></main>
}

export function ExampleDetailPage({ page }: { page: PublicPage }) {
  const initial = page.path.includes('refund') ? 'refund' : page.path.includes('external') ? 'external' : 'access'
  return <main className="eg-public eg-example-detail"><div className="eg-public-shell"><PublicHeader /><article><header className="eg-example-detail-hero"><span>{page.eyebrow}</span><h1>{page.title}</h1><p>{page.answer}</p></header><StoryExplorer compact initial={initial} /><div className="eg-example-faq"><QuestionAnswers label="WHAT THIS EXAMPLE PROVES — AND WHAT IT DOESN’T" questions={[
    { question: 'What does PASS mean here?', answer: 'Every supported expectation in this Story held in this current run. It does not mean the agent is safe in every situation.' },
    { question: 'What should I change first for my own agent?', answer: 'Keep the formula, then replace GIVEN, WHEN, the tool names, and the execution profile with one real behavior from your system.' },
    { question: 'Can the profile make the agent pass?', answer: 'It must not. A valid profile translates inputs and records facts. It cannot branch on Story IDs, copy policy, or fabricate calls.' },
  ]} /></div></article><PublicFooter /></div></main>
}
