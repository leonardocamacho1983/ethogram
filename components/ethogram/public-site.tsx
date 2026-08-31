import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { PublicPage } from '@/lib/public-content'
import { labelForPath } from '@/lib/public-content'

const NAV = [
  ['/how-it-works', 'How it works'],
  ['/behavioral-testing', 'Concepts'],
  ['/docs', 'Docs'],
  ['/examples', 'Examples'],
  ['/evidence', 'Evidence'],
  ['/faq', 'FAQ'],
] as const

export function PublicHeader() {
  return (
    <header className="eg-public-header">
      <Link className="eg-public-brand" href="/" aria-label="Ethogram home">
        <Image alt="Ethogram" height={64} priority src="/brand/ethogram/lockups/lockup-horizontal.svg" width={260} />
      </Link>
      <nav aria-label="Primary navigation">
        {NAV.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
      <Link className="eg-public-header-cta" href="/docs/quickstart">Start here <ArrowRight aria-hidden="true" size={13} /></Link>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="eg-public-footer">
      <Link className="eg-public-footer-brand" href="/"><Image alt="Ethogram" height={64} src="/brand/ethogram/lockups/lockup-horizontal.svg" width={260} /></Link>
      <p>Behavior that holds.</p>
      <div><Link href="/about">About</Link><Link href="/roadmap">Roadmap</Link><Link href="/security">Security</Link><Link href="/privacy">Privacy</Link><Link href="/license">License</Link></div>
    </footer>
  )
}

function PageSignal({ kind }: { kind: PublicPage['kind'] }) {
  if (kind === 'planned') return <span className="eg-public-signal is-planned">NOT INDEXED · VALIDATION PENDING</span>
  if (kind === 'docs') return <span className="eg-public-signal">PUBLIC ALPHA DOCUMENTATION</span>
  return <span className="eg-public-signal">ETHOGRAM · 0.1 ALPHA</span>
}

export function PublicContentPage({ page }: { page: PublicPage }) {
  return (
    <main className="eg-public">
      <div className="eg-public-shell">
        <PublicHeader />
        <article>
          <header className="eg-public-hero">
            <div className="eg-public-hero-index"><span>{page.eyebrow}</span><PageSignal kind={page.kind} /></div>
            <h1>{page.title}</h1>
            <p className="eg-public-dek">{page.description}</p>
            <div className="eg-public-answer"><span>THE SHORT ANSWER</span><p>{page.answer}</p></div>
          </header>

          <div className="eg-public-body">
            <aside aria-label="On this page">
              <span>ON THIS PAGE</span>
              {page.sections.map((section, index) => <a href={`#section-${index + 1}`} key={section.title}>{String(index + 1).padStart(2, '0')} · {section.title}</a>)}
            </aside>
            <div className="eg-public-sections">
              {page.sections.map((section, index) => (
                <section id={`section-${index + 1}`} key={section.title}>
                  <div className="eg-public-section-index">{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <h2>{section.title}</h2>
                    {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                    {section.code ? <pre><code>{section.code}</code></pre> : null}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {page.related.length ? (
            <section className="eg-public-related">
              <span>NEXT / RELATED</span>
              <div>{page.related.map((path) => <Link href={path} key={path}><span>{labelForPath(path)}</span><ArrowRight aria-hidden="true" size={16} /></Link>)}</div>
            </section>
          ) : null}
        </article>
        <PublicFooter />
      </div>
    </main>
  )
}
