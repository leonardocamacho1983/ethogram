import { defineStory } from '@agentbook/core'
import { githubRepositoryAgent } from '../agents/github-repository.agent.ts'

export const identifiesGithubAgentFactory = defineStory({
  id: 'identifies-github-agent-factory',
  name: 'Identifies the GitHub Agent Factory',
  agent: githubRepositoryAgent,
  description: 'Reads the pinned third-party source through its existing repository-explorer agent.',
  given: {
    owner: 'vercel-labs',
    repo: 'github-tools',
    ref: '0dfd7d6d4bec7863363774401d88ca00d9860faa',
  },
  when: 'Read packages/github-tools/src/agents.ts at the configured ref and identify the exported factory that constructs the GitHub ToolLoopAgent.',
  then: [
    {
      id: 'reads-agent-source',
      description: 'Reads the pinned agent source file',
      matcher: { kind: 'tool-called', tool: 'getFileContent' },
    },
    {
      id: 'does-not-search-known-path',
      description: 'Does not search code when the exact file path is supplied',
      matcher: { kind: 'tool-not-called', tool: 'searchCode' },
    },
  ],
  execution: { kind: 'external-profile', profile: 'github-tools-repo-explorer' },
})
