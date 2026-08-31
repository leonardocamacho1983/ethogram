const app = document.querySelector('#app')
let currentProject
let currentStoryId
let currentRuntime
let evidenceIsCurrent = false

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const prettyJson = (value) => {
  try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
}

const availableText = (value, format = (entry) => String(entry)) => value === undefined
  ? 'Unavailable'
  : format(value)

const displayGivenValue = (value) => typeof value === 'string' ? value : JSON.stringify(value)

const givenEntries = (story) => Array.isArray(story.given)
  ? story.given.map((line) => {
      const separator = line.indexOf(':')
      return separator === -1
        ? { key: line, value: '' }
        : { key: line.slice(0, separator).trim(), value: line.slice(separator + 1).trim() }
    })
  : Object.entries(story.given).map(([key, value]) => ({ key, value: displayGivenValue(value) }))

function panel(title, content, right = '') {
  return `<section class="panel"><header><strong>${title}</strong>${right}</header>${content}</section>`
}

function storyShell(project, story) {
  const agent = project.agents.find((candidate) => candidate.id === story.agent.id) ?? story.agent
  const agentStories = project.stories.filter((candidate) => candidate.agent.id === agent.id)
  const storyNavigation = agentStories.map((candidate) => `
    <button class="story-link ${candidate.id === story.id ? 'selected' : ''}" data-story-id="${escapeHtml(candidate.id)}">
      <span class="status-dot"></span>${escapeHtml(candidate.name)}<em>STORY</em>
    </button>`).join('')
  const given = givenEntries(story).map(({ key, value }) => `
    <div class="given-row"><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')
  const expectations = story.expectations.map((expectation) => `
    <div class="assertion" data-testid="assertion" data-expectation-id="${escapeHtml(expectation.id)}" data-verdict="NOT EVALUATED">
      <span class="assertion-icon pending">·</span>
      <div><strong>${escapeHtml(expectation.description)}</strong><small>Not evaluated</small></div>
    </div>`).join('')

  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand"><svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 10L49.3 22L39.8 36.5L32 51L18.1 40L13.8 21.5Z"></path></svg><span>Ethogram</span><span class="codename">alpha</span></div>
      <div class="project"><span class="online-dot"></span><strong data-testid="project-name">${escapeHtml(project.name)}</strong><span class="project-local">local</span></div>
      <label class="search"><span aria-hidden="true">⌕</span><input aria-label="Filter stories" placeholder="Filter stories"><kbd>⌘ K</kbd></label>
      <div class="nav-label">AGENTS</div>
      <button class="agent-link selected"><span class="agent-glyph" aria-hidden="true">◇</span>${escapeHtml(agent.name)} <span>${agentStories.length}</span></button>
      <div class="story-list">${storyNavigation}</div>
      <div class="sidebar-footer"><span>Code-first · read-only UI</span><small>${escapeHtml(project.adapter.label)} adapter · local</small></div>
    </aside>
    <main class="main" data-project-source="consumer" data-adapter="${escapeHtml(project.adapter.id)}">
      <header class="topbar">
        <div class="breadcrumb">Agents <span>›</span> ${escapeHtml(agent.name)} <span>›</span> <strong>${escapeHtml(story.name)}</strong></div>
        <button id="run-story" class="run-button" data-testid="run-story"><span aria-hidden="true">▶</span> Run Story</button>
      </header>
      <section class="story-meta">
        <div class="story-symbol"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 10L49.3 22L39.8 36.5L32 51L18.1 40L13.8 21.5Z"></path></svg></div>
        <div><h1>${escapeHtml(story.name)}</h1><p>${escapeHtml(story.description)}</p></div>
        <span class="source" data-testid="story-source">${escapeHtml(story.source)}</span>
      </section>
      <nav class="tabs"><button class="active">Canvas</button></nav>
      <div class="scope-banner">GIVEN · WHEN · EXPECTATIONS are defined in project files. This UI reads and runs them; it does not save edits.</div>
      <div id="execution-error" class="error-banner" hidden></div>
      <div class="canvas">
        <div class="canvas-main">
          ${panel('GIVEN', `<div class="given-grid">${given}</div>`)}
          ${panel('Configuration', `<div class="config-grid"><div><small>ADAPTER</small><strong>${escapeHtml(project.adapter.label)}</strong></div><div><small>EXECUTION</small><strong>Offline deterministic</strong></div><div><small>PROJECT</small><strong>Consumer owned</strong></div><div><small>ENVIRONMENT</small><strong><span class="online-dot"></span> localhost</strong></div></div>`)}
          ${panel('WHEN', `<div class="input-box" data-testid="story-prompt">${escapeHtml(story.prompt)}</div>`)}
          ${panel('Result', `<div id="result" class="result" data-evidence-state="empty"><div><small>STORY EVALUATION</small><strong id="story-verdict" data-testid="story-verdict">NOT EVALUATED</strong></div><div><small>DECISION</small><strong id="decision" data-testid="decision">Run the Story to observe behavior.</strong><p id="final-response" data-testid="final-response">No execution evidence yet.</p></div><div><small>EXPECTATIONS</small><strong id="assertion-count" data-testid="assertion-count">0 / ${story.expectations.length} passed</strong></div></div>`)}
        </div>
        <div class="canvas-side">
          ${panel('Execution Timeline', '<div id="timeline" class="empty">No execution timeline yet.</div>', '<small id="timeline-count">0 events</small>')}
          ${panel('Tool Calls', '<div id="tool-calls" class="empty">No tool calls observed yet.</div>', '<small id="tool-count">0 calls</small>')}
          ${panel('Expectations', `<div id="assertions" class="assertions">${expectations}</div>`, `<small id="passed-count">0 / ${story.expectations.length} passed</small>`)}
          ${panel('Metrics', '<div class="metrics"><div><small>PROVIDER</small><strong id="provider">Unavailable</strong></div><div><small>MODEL</small><strong id="model">Unavailable</strong></div><div><small>LATENCY</small><strong id="latency">Unavailable</strong></div><div><small>TOOLS CALLED</small><strong id="metric-tool-count">0</strong></div></div>')}
        </div>
      </div>
      <output hidden data-testid="execution-evidence" id="execution-evidence"></output>
    </main>`
}

function renderCompleted(story, payload) {
  evidenceIsCurrent = true
  currentRuntime = payload.runtime
  const { observedRun, evaluationResult } = payload.execution
  document.querySelector('#result').dataset.evidenceState = 'current'
  document.querySelector('#story-verdict').textContent = evaluationResult.verdict
  document.querySelector('#story-verdict').className = evaluationResult.verdict === 'PASS' ? 'pass' : 'fail'
  document.querySelector('#decision').textContent = observedRun.decision
  document.querySelector('#final-response').textContent = observedRun.finalResponse
  const passed = Object.values(evaluationResult.expectations).filter((value) => value === 'PASS').length
  document.querySelector('#assertion-count').textContent = `${passed} / ${story.expectations.length} passed`
  document.querySelector('#passed-count').textContent = `${passed} / ${story.expectations.length} passed`
  document.querySelector('#timeline-count').textContent = `${observedRun.timeline.length} events`
  document.querySelector('#timeline').className = 'timeline'
  document.querySelector('#timeline').innerHTML = observedRun.timeline.map((item, index) => `
    <div class="timeline-row"><span class="timeline-icon">✓</span><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.detail)}</small></div><code>${escapeHtml(availableText(item.duration))}</code></div>`).join('')
  document.querySelector('#tool-count').textContent = `${observedRun.toolCalls.length} calls`
  document.querySelector('#metric-tool-count').textContent = String(observedRun.toolCalls.length)
  document.querySelector('#tool-calls').className = 'tools'
  document.querySelector('#tool-calls').innerHTML = observedRun.toolCalls.map((call) => {
    const resultLabel = call.status === 'error' ? 'ERROR' : 'OUTPUT'
    const resultValue = call.status === 'error' ? call.error : call.output
    const renderedResult = resultValue === undefined
      ? 'Unavailable'
      : typeof resultValue === 'string' ? prettyJson(resultValue) : JSON.stringify(resultValue, null, 2)
    return `
    <details class="tool-call"><summary><code>${escapeHtml(call.name)}</code><span class="badge ${call.status === 'success' ? 'pass' : 'fail'}">${escapeHtml(call.status)}</span><small>${escapeHtml(availableText(call.duration))}</small></summary><div class="tool-json"><div><small>INPUT</small><pre>${escapeHtml(prettyJson(call.input))}</pre></div><div><small>${resultLabel}</small><pre>${escapeHtml(renderedResult)}</pre></div></div></details>`
  }).join('')
  document.querySelectorAll('[data-testid="assertion"]').forEach((row) => {
    const id = row.dataset.expectationId
    const verdict = evaluationResult.expectations[id]
    row.dataset.verdict = verdict
    row.querySelector('.assertion-icon').textContent = verdict === 'PASS' ? '✓' : '×'
    row.querySelector('.assertion-icon').className = `assertion-icon ${verdict === 'PASS' ? 'pass' : 'fail'}`
    const expectation = story.expectations.find((candidate) => candidate.id === id)
    row.querySelector('small').textContent = `${expectation.matcher.kind}: ${expectation.matcher.tool}`
  })
  document.querySelector('#provider').textContent = availableText(observedRun.evidence.provider)
  document.querySelector('#model').textContent = availableText(observedRun.evidence.model)
  document.querySelector('#latency').textContent = availableText(observedRun.evidence.latencyMs, (value) => `${value}ms`)
  document.querySelector('#execution-evidence').textContent = JSON.stringify(payload)
}

function markEvidenceStale(message) {
  const banner = document.querySelector('#execution-error')
  if (banner) {
    banner.hidden = false
    banner.textContent = message
  }
  if (!evidenceIsCurrent) return
  evidenceIsCurrent = false
  const result = document.querySelector('#result')
  if (!result) return
  result.dataset.evidenceState = 'stale'
  const verdict = document.querySelector('#story-verdict')
  verdict.textContent = 'STALE — RERUN REQUIRED'
  verdict.className = 'stale'
  document.querySelector('#decision').textContent = 'Previous evidence is no longer current.'
  document.querySelector('#final-response').textContent = message
  document.querySelector('#execution-evidence').textContent = ''
}

function bindStory(project, story) {
  storyShell(project, story)
  const filter = document.querySelector('.search input')
  filter?.addEventListener('input', () => {
    const query = filter.value.trim().toLowerCase()
    document.querySelectorAll('[data-story-id]').forEach((link) => {
      link.hidden = Boolean(query) && !link.textContent.toLowerCase().includes(query)
    })
  })
  document.querySelectorAll('[data-story-id]').forEach((link) => {
    link.addEventListener('click', () => {
      const selected = project.stories.find((candidate) => candidate.id === link.dataset.storyId)
      if (!selected) return
      currentStoryId = selected.id
      evidenceIsCurrent = false
      bindStory(project, selected)
    })
  })
  const button = document.querySelector('#run-story')
  button.addEventListener('click', async () => {
    if (button.disabled) return
    button.disabled = true
    button.textContent = '◌ Running…'
    document.querySelector('#execution-error').hidden = true
    try {
      const runResponse = await fetch('/api/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ storyId: story.id, ...currentRuntime }),
      })
      const payload = await runResponse.json()
      if (!runResponse.ok || payload.status !== 'completed') throw new Error(payload.error?.message ?? 'Execution failed.')
      renderCompleted(story, payload)
    } catch (error) {
      markEvidenceStale('Project or runtime changed. Previous evidence is stale; rerun this Story.')
      const banner = document.querySelector('#execution-error')
      banner.hidden = false
      banner.textContent = error instanceof Error ? error.message : 'The Story execution failed.'
    } finally {
      button.disabled = false
      button.textContent = '▶ Run Story'
    }
  })
}

async function load({ polling = false } = {}) {
  try {
    const response = await fetch('/api/project', { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error?.message ?? 'The selected project could not be loaded.')
    const runtimeChanged = currentRuntime
      && (payload.runtime.instanceId !== currentRuntime.instanceId || payload.runtime.revision !== currentRuntime.revision)
    if (polling && !runtimeChanged) return
    if (runtimeChanged) markEvidenceStale('Ethogram detected changed project sources or a replaced runtime. Rerun the Story for current evidence.')
    currentProject = payload
    currentRuntime = payload.runtime
    const story = payload.stories.find((candidate) => candidate.id === currentStoryId) ?? payload.stories[0]
    if (!story) throw new Error('No Ethogram Stories were found.')
    currentStoryId = story.id
    evidenceIsCurrent = false
    bindStory(payload, story)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ethogram could not load.'
    if (currentProject) {
      markEvidenceStale(`Ethogram cannot confirm current project state: ${message}`)
      return
    }
    app.innerHTML = `<div class="loading-card error">${escapeHtml(message)}</div>`
  }
}

await load()
setInterval(() => { void load({ polling: true }) }, 750)
