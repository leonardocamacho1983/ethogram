'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const ENTRIES = [
  ['/docs/quickstart', 'Quickstart', 'Run the deterministic starter Story'],
  ['/docs/installation', 'Installation', 'Packages, Node.js, and release status'],
  ['/docs/concepts/stories', 'Stories', 'GIVEN, WHEN, and EXPECTATIONS'],
  ['/docs/concepts/execution-profiles', 'Execution profiles', 'Connect the real agent entry point'],
  ['/docs/concepts/observed-runs', 'Observed runs', 'Facts from one execution'],
  ['/docs/concepts/evaluation-results', 'Evaluation results', 'Matcher verdicts and PASS or FAIL'],
  ['/docs/concepts/execution-evidence', 'Execution evidence', 'Translate framework-owned tool calls'],
  ['/docs/reference/cli', 'CLI reference', 'ethogram init and ethogram dev'],
  ['/docs/reference/configuration', 'Configuration', 'Project root and discovery'],
  ['/docs/reference/story-api', 'Story API', 'defineStory fields and bindings'],
  ['/docs/reference/matchers', 'Matchers', 'Supported behavioral expectations'],
  ['/docs/reference/matchers/tool-called', 'tool-called', 'Require a named tool call'],
  ['/docs/reference/matchers/tool-not-called', 'tool-not-called', 'Forbid a named tool call'],
  ['/docs/guides/bring-your-own-agent', 'Bring your own agent', 'Integrate an existing agent'],
  ['/docs/guides/test-forbidden-agent-actions', 'Forbidden actions', 'Detect a forbidden tool call'],
  ['/docs/troubleshooting', 'Troubleshooting', 'Discovery, execution, and evidence problems'],
  ['/docs/limitations', 'Alpha limitations', 'What Ethogram does not support'],
] as const

export function DocsSearch() {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return []
    return ENTRIES.filter((entry) => entry.join(' ').toLowerCase().includes(needle)).slice(0, 6)
  }, [query])
  return <div className="eg-docs-search-wrap"><label className="eg-docs-search"><Search aria-hidden="true" size={16} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a concept, matcher, or guide" /><kbd>⌘ K</kbd></label>{query ? <div className="eg-docs-search-results" aria-live="polite">{results.length ? results.map(([href, title, description]) => <Link href={href} key={href}><strong>{title}</strong><span>{description}</span></Link>) : <p>No matching documentation. Try “Story”, “evidence”, or “matcher”.</p>}</div> : null}</div>
}
