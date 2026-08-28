import { defineAgent } from '@/lib/agentbook'

export const customerSupportAgent = defineAgent({
  id: 'support',
  name: 'Customer Support Agent',
  description: 'Handles customer conversations and resolutions',
  icon: 'headset',
})

export const salesQualifierAgent = defineAgent({
  id: 'sales',
  name: 'Sales Qualifier',
  description: 'Qualifies leads and routes opportunities',
  icon: 'target',
})

export const researchAssistantAgent = defineAgent({
  id: 'research',
  name: 'Research Assistant',
  description: 'Finds sources and summarizes complex topics',
  icon: 'search',
})
