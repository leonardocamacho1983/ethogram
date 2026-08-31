import type { ProjectSnapshot } from '@ethogram/cli/runtime'

const MAX_STRING = 4_000
const MAX_ARRAY = 100
const MAX_OBJECT_KEYS = 100
const MAX_DEPTH = 8
const MAX_TOTAL_NODES = 25_000
const MAX_TOTAL_BYTES = 2 * 1024 * 1024
const MAX_STORY_GIVEN_NODES = 10_000
const MAX_STORY_GIVEN_BYTES = 512 * 1024

type TruncationState = { truncated: boolean; nodes: number; bytes: number; nodeLimit: number; byteLimit: number }

function state(nodeLimit = MAX_TOTAL_NODES, byteLimit = MAX_TOTAL_BYTES): TruncationState {
  return { truncated: false, nodes: 0, bytes: 0, nodeLimit, byteLimit }
}

function safeString(value: string, state: TruncationState): string {
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
  if (cleaned !== value) state.truncated = true
  const clipped = cleaned.length <= MAX_STRING ? cleaned : `${cleaned.slice(0, MAX_STRING)}… [truncated]`
  if (clipped !== cleaned) state.truncated = true
  const bytes = Buffer.byteLength(clipped, 'utf8')
  if (state.bytes + bytes > state.byteLimit) {
    state.truncated = true
    return '[payload budget reached]'
  }
  state.bytes += bytes
  return clipped
}

function bounded(value: unknown, state: TruncationState, depth = 0): unknown {
  state.nodes += 1
  if (state.nodes > state.nodeLimit) {
    state.truncated = true
    return '[node budget reached]'
  }
  if (typeof value === 'string') return safeString(value, state)
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value
  if (depth >= MAX_DEPTH) {
    state.truncated = true
    return '[maximum depth reached]'
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY) state.truncated = true
    return value.slice(0, MAX_ARRAY).map((entry) => bounded(entry, state, depth + 1))
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length > MAX_OBJECT_KEYS) state.truncated = true
    return Object.fromEntries(entries.slice(0, MAX_OBJECT_KEYS).map(([key, nested]) => [
      safeString(key, state),
      bounded(nested, state, depth + 1),
    ]))
  }
  state.truncated = true
  return String(value)
}

export function encodeResourceId(id: string): string {
  return encodeURIComponent(id)
}

export function decodeResourceId(value: string | string[]): string {
  const encoded = Array.isArray(value) ? value.join('/') : value
  try {
    const decoded = decodeURIComponent(encoded)
    if (encodeURIComponent(decoded) !== encoded) throw new Error('non-canonical')
    return decoded
  } catch {
    throw new Error('INVALID_RESOURCE_ID')
  }
}

export function projectDto(snapshot: ProjectSnapshot): Record<string, unknown> {
  const truncation = state()
  const dto = bounded({
    name: snapshot.project.name,
    adapter: snapshot.project.adapter,
    revision: snapshot.revision,
    agentCount: snapshot.project.agents.length,
    storyCount: snapshot.project.stories.length,
    agents: snapshot.project.agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      icon: agent.icon,
      storyCount: snapshot.project.stories.filter((story) => story.agent.id === agent.id).length,
      resourceUri: `ethogram://agents/${encodeResourceId(agent.id)}`,
    })),
    provenance: {
      descriptors: 'consumer-authored',
      revision: 'ethogram-computed',
    },
  }, truncation) as Record<string, unknown>
  return { ...dto, truncated: truncation.truncated }
}

export function agentDto(snapshot: ProjectSnapshot, agentId: string): Record<string, unknown> | undefined {
  const agent = snapshot.project.agents.find((candidate) => candidate.id === agentId)
  if (!agent) return undefined
  const truncation = state()
  const dto = bounded({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    icon: agent.icon,
    storyCount: snapshot.project.stories.filter((story) => story.agent.id === agent.id).length,
    resourceUri: `ethogram://agents/${encodeResourceId(agent.id)}`,
  }, truncation) as Record<string, unknown>
  return { ...dto, truncated: truncation.truncated }
}

export function storyDto(snapshot: ProjectSnapshot, storyId: string): Record<string, unknown> | undefined {
  const story = snapshot.project.stories.find((candidate) => candidate.id === storyId)
  if (!story) return undefined
  const fields = state()
  const given = state(MAX_STORY_GIVEN_NODES, MAX_STORY_GIVEN_BYTES)
  const expectationLimitExceeded = story.expectations.length > MAX_ARRAY
  const dto = {
    id: safeString(story.id, fields),
    name: safeString(story.name, fields),
    description: safeString(story.description, fields),
    agent: {
      id: safeString(story.agent.id, fields),
      name: safeString(story.agent.name, fields),
      description: safeString(story.agent.description, fields),
      icon: safeString(story.agent.icon, fields),
    },
    given: bounded(story.given, given),
    when: safeString(story.prompt, fields),
    expectations: story.expectations.slice(0, MAX_ARRAY).map((expectation) => ({
      id: safeString(expectation.id, fields),
      description: safeString(expectation.description, fields),
      ...(expectation.failureDescription === undefined
        ? {}
        : { failureDescription: safeString(expectation.failureDescription, fields) }),
      matcher: {
        kind: expectation.matcher.kind,
        tool: safeString(expectation.matcher.tool, fields),
      },
    })),
    source: safeString(story.source, fields),
    executable: story.executable,
    revision: snapshot.revision,
    resourceUri: `ethogram://stories/${encodeResourceId(story.id)}`,
    executionWarning: 'Loading and running a Story evaluates trusted project code. Running may cause external effects.',
    provenance: {
      contract: 'consumer-authored',
      revision: 'ethogram-computed',
    },
  }
  const truncated = fields.truncated || given.truncated || expectationLimitExceeded
  return {
    ...dto,
    storyDigest: truncated ? null : snapshot.storyDigests[story.id],
    executionAllowed: story.executable && !truncated,
    truncated,
  }
}

export function runDto(snapshot: ProjectSnapshot, run: {
  execution: unknown
  boundaryEvidence: unknown
}): Record<string, unknown> {
  const truncation = state()
  const dto = bounded({
    status: 'completed',
    revision: snapshot.revision,
    execution: run.execution,
    boundaryEvidence: run.boundaryEvidence,
    effectsMayHaveOccurred: true,
    retrySafe: false,
    provenance: {
      story: 'consumer-authored',
      observedRun: 'consumer-observed-or-framework-reported',
      evaluationResult: 'ethogram-evaluated',
      providerAndModel: 'framework-reported-unverified',
    },
  }, truncation) as Record<string, unknown>
  return { ...dto, truncated: truncation.truncated }
}
