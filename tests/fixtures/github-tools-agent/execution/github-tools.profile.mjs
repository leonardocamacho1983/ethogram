import { defineExecutionProfile } from '@agentbook/core'
import { MockLanguageModelV4 } from 'ai/test'
import {
  describeNormalizedPromptShape,
  extractNormalizedUserText,
  translateAiSdkExecutionEvidence,
} from '../ai-sdk-evidence.mjs'

const usage = {
  inputTokens: { total: 12, noCache: 12, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 8, text: 8, reasoning: 0 },
}

function structuredContext(given) {
  if (!given || Array.isArray(given) || typeof given !== 'object') {
    throw new Error('The github-tools integration requires structured Story GIVEN.')
  }
  for (const key of ['owner', 'repo', 'ref']) {
    if (typeof given[key] !== 'string' || !given[key]) throw new Error(`Story GIVEN.${key} is required.`)
  }
  return { owner: given.owner, repo: given.repo, ref: given.ref }
}

export const githubToolsProfile = defineExecutionProfile({
  id: 'github-tools-repo-explorer',
  tools: {},
  async execute({ story }) {
    const token = process.env.AGENTBOOK_TEST09_GITHUB_TOKEN
    if (!token) throw new Error('AGENTBOOK_TEST09_GITHUB_TOKEN is required for the opt-in Test 09 execution.')
    const candidateModule = process.env.AGENTBOOK_TEST09_CANDIDATE_MODULE
    if (!candidateModule) throw new Error('AGENTBOOK_TEST09_CANDIDATE_MODULE is required for the installed Test 09 candidate.')
    const { createGithubAgent } = await import(candidateModule)
    if (typeof createGithubAgent !== 'function') throw new Error('The installed candidate does not export createGithubAgent().')
    const context = structuredContext(story.given)
    const starts = []
    const ends = []
    const model = new MockLanguageModelV4({
      provider: 'ai-sdk-test',
      modelId: 'test09-deterministic-github-tools',
      doGenerate: [
        {
          content: [{
            type: 'tool-call',
            toolCallId: 'test09-get-file-content-1',
            toolName: 'getFileContent',
            input: JSON.stringify({ path: 'packages/github-tools/src/agents.ts' }),
          }],
          finishReason: { unified: 'tool-calls', raw: undefined },
          usage,
          warnings: [],
        },
        {
          content: [{ type: 'text', text: 'The exported factory is createGithubAgent().' }],
          finishReason: { unified: 'stop', raw: undefined },
          usage,
          warnings: [],
        },
      ],
    })
    const agent = createGithubAgent({
      model,
      token,
      preset: 'repo-explorer',
      context,
      onToolExecutionStart(event) {
        starts.push({ ...event, observedAt: new Date().toISOString() })
      },
      onToolExecutionEnd(event) {
        ends.push({ ...event, observedAt: new Date().toISOString() })
      },
    })
    let result
    try {
      result = await agent.generate({ prompt: story.prompt, abortSignal: AbortSignal.timeout(30_000) })
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown GitHub execution error.'
      throw new Error(`TEST09_INFRASTRUCTURE_UNAVAILABLE: ${detail}`)
    }
    const evidence = translateAiSdkExecutionEvidence({
      result,
      starts,
      ends,
      provider: model.provider,
      model: model.modelId,
    })
    const failedCall = evidence.toolCalls.find((call) => call.status === 'error')
    if (failedCall) {
      throw new Error(`TEST09_INFRASTRUCTURE_UNAVAILABLE: GitHub tool ${failedCall.name} did not complete successfully.`)
    }
    const normalizedPrompt = model.doGenerateCalls[0]?.prompt
    globalThis.__AGENTBOOK_TEST09_NATIVE_EVIDENCE__ = {
      factoryConstructed: Boolean(agent && typeof agent.generate === 'function'),
      agentConstructor: agent?.constructor?.name,
      context,
      storyPrompt: story.prompt,
      normalizedUserText: extractNormalizedUserText(normalizedPrompt),
      normalizedPromptShape: describeNormalizedPromptShape(normalizedPrompt),
      offeredTools: model.doGenerateCalls[0]?.tools?.map((tool) => tool.name) ?? [],
      starts,
      ends,
      stepCalls: result.steps.map((step) => step.toolCalls),
      stepResults: result.steps.map((step) => step.toolResults),
      evidence,
    }
    return {
      decision: 'Identified createGithubAgent',
      finalResponse: result.text,
      evidence,
    }
  },
})
