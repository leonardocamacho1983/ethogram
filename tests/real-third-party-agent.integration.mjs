import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createGithubAgent, PRESET_TOOLS } from '@github-tools/sdk'
import { EthogramEngine } from '../packages/cli/dist/generic-engine.js'
import { TypeScriptAdapter } from '../packages/cli/dist/typescript-adapter.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const fixtureRoot = path.join(repositoryRoot, 'tests/fixtures/github-tools-agent')
const revision = '0dfd7d6d4bec7863363774401d88ca00d9860faa'
const repositoryUrl = 'https://github.com/vercel-labs/github-tools.git'
const expectedHashes = {
  'packages/github-tools/src/agents.ts': '91cf674a599d6ecc127fef8492efc18e7e04caa059099e96f2ed21ef00b6d8c3',
  'packages/github-tools/src/core/presets.ts': 'f4d96687e6c84ee1ad90e10646c13505442229cd9a2ae9522f4dad8a189cc8ca',
  'packages/github-tools/src/core/context.ts': '5bb0eb85d353bde3ec86acce59a2c78d7a2fd41e693748a8a25ce149d49a2d90',
  'packages/github-tools/src/core/token.ts': '78f8a165cb508ba1f14414348de6a3aa5724eb7d8f27b9ecf153029f154b6932',
  'packages/github-tools/package.json': '3e0ad9487133d251683e3d3af6aa2086eb71d9bb4d459ec641549511b69aeef7',
}
const expectedRepoExplorerTools = [
  'getRepository', 'listBranches', 'getFileContent', 'getRepositoryTree',
  'listPullRequests', 'getPullRequest', 'listPullRequestFiles', 'listPullRequestReviews', 'listPullRequestReviewThreads', 'getPullRequestContext',
  'listIssues', 'getIssue', 'getIssueContext', 'listIssueComments',
  'listDiscussions', 'getDiscussion', 'listLabels',
  'listCommits', 'getCommit', 'getBlame', 'compareCommits',
  'searchCode', 'searchRepositories', 'searchIssues',
  'listGists', 'getGist', 'listGistComments',
  'listWorkflows', 'listWorkflowRuns', 'getWorkflowRun', 'listWorkflowJobs', 'getWorkflowJobLogs', 'listCheckRuns', 'getCombinedStatus', 'getCiFailureContext',
  'listReleases', 'getLatestRelease', 'getRelease', 'getReleaseContext',
]
const writeToolNames = [
  'createOrUpdateFile', 'createPullRequest', 'mergePullRequest', 'updatePullRequest', 'addPullRequestComment',
  'createIssue', 'addIssueComment', 'closeIssue', 'updateIssue', 'addLabels', 'removeLabel',
  'createGist', 'updateGist', 'deleteGist', 'triggerWorkflow', 'cancelWorkflowRun', 'rerunWorkflowRun',
  'createRelease', 'updateRelease', 'deleteRelease',
]

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', env: process.env, timeout: 60_000 })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`)
  }
  return result.stdout.trim()
}

function unavailableReport(reason) {
  return {
    test09ExecutionStatus: 'NOT COMPLETE',
    infrastructureStatus: 'UNAVAILABLE',
    storyEvaluation: 'NOT EVALUATED',
    requiredEnvironmentVariable: 'AGENTBOOK_TEST09_GITHUB_TOKEN',
    requiredCredential: 'A least-privilege GitHub token with read-only Contents and Metadata access to vercel-labs/github-tools.',
    command: 'npm run test:third-party-agent',
    ...(reason === undefined ? {} : { reason }),
  }
}

function isInfrastructureUnavailable(error) {
  const message = error instanceof Error ? error.message : String(error)
  return /TEST09_INFRASTRUCTURE_UNAVAILABLE|git fetch .* failed|timed out|timeout|rate.?limit|\b401\b|\b403\b|ENOTFOUND|ETIMEDOUT|ECONN(?:RESET|REFUSED)/i.test(message)
}

function safeInfrastructureReason(error) {
  const raw = error instanceof Error ? error.message : 'GitHub infrastructure was unavailable.'
  const token = process.env.AGENTBOOK_TEST09_GITHUB_TOKEN
  return raw
    .replace(/^.*TEST09_INFRASTRUCTURE_UNAVAILABLE:\s*/, '')
    .replace(/authorization:\s*\S+/gi, 'authorization: [REDACTED]')
    .replace(token ? new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : /$^/, '[REDACTED]')
    .slice(0, 300)
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex')
}

async function installedSourceHashes(packageRoot) {
  const distRoot = path.join(packageRoot, 'dist')
  const maps = (await readdir(distRoot)).filter((name) => name.endsWith('.mjs.map'))
  const hashes = {}
  for (const mapName of maps) {
    const sourceMap = JSON.parse(await readFile(path.join(distRoot, mapName), 'utf8'))
    sourceMap.sources?.forEach((source, index) => {
      const relativePath = source.replace(/^\.\.\/src\//, 'packages/github-tools/src/')
      if (!Object.prototype.hasOwnProperty.call(expectedHashes, relativePath)) return
      const sourceContent = sourceMap.sourcesContent?.[index]
      if (typeof sourceContent !== 'string') throw new Error(`Installed source map lacks source content for ${relativePath}.`)
      hashes[relativePath] = createHash('sha256').update(sourceContent).digest('hex')
    })
  }
  return hashes
}

function assertVerdictFree(value) {
  const serialized = JSON.stringify(value)
  assert.equal(/"(?:verdict|passed|failed|expectations|evaluationResult)"\s*:/.test(serialized), false)
  assert.equal(/"(?:PASS|FAIL)"/.test(serialized), false)
}

function safeObservedRun(run) {
  return {
    ...run,
    toolCalls: run.toolCalls.map((call) => ({
      callId: call.callId,
      name: call.name,
      status: call.status,
      input: call.input,
      outputPresent: call.output !== undefined,
      errorPresent: call.error !== undefined,
      duration: call.duration,
      startedAtPresent: call.startedAt !== undefined,
      endedAtPresent: call.endedAt !== undefined,
    })),
  }
}

function assertExactToolMembership(observedToolOrder, expectedToolOrder, label) {
  assert.ok(Array.isArray(observedToolOrder), `${label} must be an array.`)
  assert.ok(Array.isArray(expectedToolOrder), 'The pinned repo-explorer allowlist must be an array.')
  assert.equal(observedToolOrder.length, 39, `${label} must expose exactly 39 tools.`)
  assert.equal(expectedToolOrder.length, 39, 'The pinned repo-explorer allowlist must contain exactly 39 tools.')
  assert.equal(
    observedToolOrder.every((name) => typeof name === 'string' && name.length > 0),
    true,
    `${label} must contain only non-empty tool names.`,
  )
  assert.equal(
    expectedToolOrder.every((name) => typeof name === 'string' && name.length > 0),
    true,
    'The pinned repo-explorer allowlist must contain only non-empty tool names.',
  )
  const observedSet = new Set(observedToolOrder)
  const expectedSet = new Set(expectedToolOrder)
  assert.equal(observedSet.size, observedToolOrder.length, `${label} must not contain duplicate tool names.`)
  assert.equal(expectedSet.size, expectedToolOrder.length, 'The pinned repo-explorer allowlist must not contain duplicate tool names.')
  const canonicalToolMembership = [...observedSet].sort()
  const canonicalExpectedMembership = [...expectedSet].sort()
  assert.deepEqual(canonicalToolMembership, canonicalExpectedMembership, `${label} must exactly match the pinned repo-explorer membership.`)
  return {
    observedToolOrder: [...observedToolOrder],
    canonicalToolMembership,
  }
}

async function main() {
  const installedPresetMembership = assertExactToolMembership(
    PRESET_TOOLS['repo-explorer'],
    expectedRepoExplorerTools,
    'The installed repo-explorer preset',
  )
  assert.deepEqual(expectedRepoExplorerTools.filter((name) => writeToolNames.includes(name)), [])

  if (!process.env.AGENTBOOK_TEST09_GITHUB_TOKEN) {
    process.stdout.write(`${JSON.stringify(unavailableReport(), null, 2)}\n`)
    process.exitCode = 2
    return
  }

  const scratchRoot = await mkdtemp(path.join(tmpdir(), 'agentbook-test09-'))
  const candidateRoot = path.join(scratchRoot, 'github-tools')
  const previousCandidateModule = process.env.AGENTBOOK_TEST09_CANDIDATE_MODULE
  try {
    await import('node:fs/promises').then(({ mkdir }) => mkdir(candidateRoot))
    run('git', ['init', '--quiet'], candidateRoot)
    run('git', ['remote', 'add', 'origin', repositoryUrl], candidateRoot)
    run('git', ['fetch', '--quiet', '--depth', '1', 'origin', revision], candidateRoot)
    run('git', ['checkout', '--quiet', '--detach', 'FETCH_HEAD'], candidateRoot)
    assert.equal(run('git', ['rev-parse', 'HEAD'], candidateRoot), revision)
    assert.equal(run('git', ['status', '--porcelain'], candidateRoot), '')

    const sourceEvidence = {}
    for (const [relativePath, expectedHash] of Object.entries(expectedHashes)) {
      const absolute = path.join(candidateRoot, relativePath)
      const source = await readFile(absolute, 'utf8')
      const actualHash = await sha256(absolute)
      assert.equal(actualHash, expectedHash, relativePath)
      sourceEvidence[relativePath] = { sha256: actualHash, lines: source.split('\n').length }
    }
    const candidatePackage = JSON.parse(await readFile(path.join(candidateRoot, 'packages/github-tools/package.json'), 'utf8'))
    assert.equal(candidatePackage.name, '@github-tools/sdk')
    assert.equal(candidatePackage.version, '1.13.0')
    assert.equal(candidatePackage.license, 'MIT')

    const installedPackageRoot = path.join(repositoryRoot, 'node_modules/@github-tools/sdk')
    const installedPackage = JSON.parse(await readFile(path.join(installedPackageRoot, 'package.json'), 'utf8'))
    assert.equal(installedPackage.name, '@github-tools/sdk')
    assert.equal(installedPackage.version, candidatePackage.version)
    const installedHashes = await installedSourceHashes(installedPackageRoot)
    for (const [relativePath, expectedHash] of Object.entries(expectedHashes)) {
      if (relativePath.endsWith('package.json')) continue
      assert.equal(installedHashes[relativePath], expectedHash, `installed ${relativePath}`)
    }
    assert.equal(typeof createGithubAgent, 'function')

    process.env.AGENTBOOK_TEST09_CANDIDATE_MODULE = import.meta.resolve('@github-tools/sdk')
    globalThis.__AGENTBOOK_TEST09_NATIVE_EVIDENCE__ = undefined
    const adapter = new TypeScriptAdapter()
    const engine = new EthogramEngine(adapter)
    const project = await engine.loadProject(fixtureRoot)
    const story = project.stories.find((entry) => entry.id === 'identifies-github-agent-factory')
    assert.ok(story)
    const authoredStory = structuredClone(story)
    const result = await engine.runStory(story.id)
    const { observedRun, evaluationResult } = result.execution
    const native = globalThis.__AGENTBOOK_TEST09_NATIVE_EVIDENCE__
    assert.ok(native)

    assert.equal(native.factoryConstructed, true)
    assert.equal(native.agentConstructor, 'ToolLoopAgent')
    assert.deepEqual(native.context, story.given)
    assert.equal(native.storyPrompt, story.prompt)
    assert.equal(native.normalizedUserText, story.prompt)
    const offeredToolMembership = assertExactToolMembership(
      native.offeredTools,
      expectedRepoExplorerTools,
      'The framework-observed repo-explorer tools',
    )
    assert.equal(native.starts.length, 1)
    assert.equal(native.ends.length, 1)
    assert.equal(native.stepCalls.flat().length, 1)
    assert.equal(native.stepResults.flat().length, 1)

    const nativeCall = native.stepCalls.flat()[0]
    const nativeResult = native.stepResults.flat()[0]
    const externalCall = native.evidence.toolCalls[0]
    const canonicalCall = observedRun.toolCalls[0]
    assert.equal(nativeCall.toolCallId, 'test09-get-file-content-1')
    assert.equal(nativeCall.toolCallId, nativeResult.toolCallId)
    assert.equal(nativeCall.toolCallId, native.starts[0].toolCall.toolCallId)
    assert.equal(nativeCall.toolCallId, native.ends[0].toolCall.toolCallId)
    assert.equal(nativeCall.toolCallId, externalCall.callId)
    assert.equal(nativeCall.toolCallId, canonicalCall.callId)
    assert.equal(canonicalCall.name, 'getFileContent')
    assert.equal(canonicalCall.status, 'success')
    assert.equal(canonicalCall.output !== undefined, true)
    assert.deepEqual(observedRun.toolCalls.map(({ name }) => name), ['getFileContent'])
    assert.equal(native.offeredTools.includes('searchCode'), true)
    assert.equal(observedRun.toolCalls.some(({ name }) => name === 'searchCode'), false)
    assert.equal(evaluationResult.verdict, 'PASS')
    assert.deepEqual(evaluationResult.expectations, {
      'reads-agent-source': 'PASS',
      'does-not-search-known-path': 'PASS',
    })
    assert.equal(result.boundaryEvidence.storyUnchanged, true)
    assert.deepEqual(story, authoredStory)
    assertVerdictFree(native.evidence)
    assertVerdictFree(observedRun)
    assert.equal(run('git', ['status', '--porcelain'], candidateRoot), '')

    const evidenceReport = {
      test09ExecutionStatus: 'PASS',
      infrastructureStatus: 'AVAILABLE',
      storyEvaluation: evaluationResult.verdict,
      thirdPartySourceChangedForIntegration: 'NO',
      thirdPartySourceLocModified: 0,
      existingPublicCreateGithubAgentInvoked: 'YES',
      frameworkOwnedToolDispatch: 'YES',
      actualOriginalGithubHandlerExecutions: native.ends.length,
      observationSource: 'EXTERNAL',
      observationSourceExclusivity: 'PASS',
      nativeEvidenceCorrelation: 'PASS',
      thinIntegrationCriterion: 'PASS',
      normalTestSuiteOffline: 'YES',
      candidate: {
        repository: repositoryUrl,
        revision,
        packageVersion: candidatePackage.version,
        sourceEvidence,
        installedSourceHashes: installedHashes,
      },
      preset: {
        name: 'repo-explorer',
        toolCount: native.offeredTools.length,
        observedToolOrder: offeredToolMembership.observedToolOrder,
        canonicalToolMembership: offeredToolMembership.canonicalToolMembership,
        installedPresetObservedToolOrder: installedPresetMembership.observedToolOrder,
        installedPresetCanonicalToolMembership: installedPresetMembership.canonicalToolMembership,
        selected: ['getFileContent'],
        unselectedAvailable: ['searchCode'],
      },
      story: {
        given: story.given,
        prompt: story.prompt,
        normalizedUserText: native.normalizedUserText,
        normalizedPromptShape: native.normalizedPromptShape,
        unchanged: result.boundaryEvidence.storyUnchanged,
      },
      correlation: {
        toolCallId: nativeCall.toolCallId,
        nativeCall: nativeCall.toolName,
        nativeResult: nativeResult.toolName,
        startCallback: native.starts[0].toolCall.toolName,
        endCallback: native.ends[0].toolCall.toolName,
        externalEvidence: externalCall.name,
        canonicalObservedCall: canonicalCall.name,
      },
      observedRun: safeObservedRun(observedRun),
      evaluationResult,
    }
    process.stdout.write(`TEST09_EVIDENCE ${JSON.stringify(evidenceReport, null, 2)}\n`)
  } finally {
    if (previousCandidateModule === undefined) delete process.env.AGENTBOOK_TEST09_CANDIDATE_MODULE
    else process.env.AGENTBOOK_TEST09_CANDIDATE_MODULE = previousCandidateModule
    delete globalThis.__AGENTBOOK_TEST09_NATIVE_EVIDENCE__
    await rm(scratchRoot, { recursive: true, force: true })
  }
}

main().catch((error) => {
  if (isInfrastructureUnavailable(error)) {
    process.stdout.write(`${JSON.stringify(unavailableReport(safeInfrastructureReason(error)), null, 2)}\n`)
    process.exitCode = 2
    return
  }
  process.stderr.write(`Test 09 integration failed: ${error instanceof Error ? error.message : 'Unknown error.'}\n`)
  process.exitCode = 1
})
