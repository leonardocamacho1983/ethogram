import { defineAgent } from '@agentbook/core'

export const githubRepositoryAgent = defineAgent({
  id: 'github-repository-agent',
  name: 'GitHub Repository Agent',
  description: 'The untouched third-party github-tools repository explorer.',
  icon: 'search',
})
