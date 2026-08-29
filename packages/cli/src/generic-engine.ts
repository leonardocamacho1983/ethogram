import { randomUUID } from 'node:crypto'
import { evaluateStory } from './evaluator.js'
import type {
  CompletedExecutionRecord,
  ExecutionRequest,
  LanguageAdapter,
  ProjectDescriptor,
  StoryDescriptor,
} from './contracts.js'

function canonical(value: unknown): string {
  return JSON.stringify(value)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const nested of Object.values(value)) deepFreeze(nested)
  }
  return value
}

export type EngineRunResult = {
  execution: CompletedExecutionRecord
  boundaryEvidence: {
    executionId: string
    completedBehavioralRuns: 1
    adapter: string
    runner: 'LanguageAdapterRunner'
    evaluator: 'deterministic'
    storyUnchanged: boolean
    mockDataUsed: false
  }
}

export class AgentbookEngine {
  private project?: ProjectDescriptor

  constructor(private readonly runner: LanguageAdapter) {}

  async loadProject(projectRoot: string): Promise<ProjectDescriptor> {
    this.project = await this.runner.loadProject(projectRoot)
    return this.project
  }

  getProject(): ProjectDescriptor {
    if (!this.project) throw new Error('PROJECT_NOT_LOADED')
    return this.project
  }

  async runStory(storyId: string): Promise<EngineRunResult> {
    const project = this.getProject()
    const story = project.stories.find((candidate) => candidate.id === storyId)
    if (!story) throw new Error(`STORY_NOT_FOUND: ${storyId}`)
    if (!story.executable) throw new Error(`STORY_NOT_EXECUTABLE: ${storyId}`)

    const storySnapshot = canonical(story)
    deepFreeze(story)
    const request: ExecutionRequest = Object.freeze({ story })
    const observedRun = await this.runner.run(request)
    const evaluationResult = evaluateStory(story, observedRun)

    return {
      execution: { observedRun, evaluationResult },
      boundaryEvidence: {
        executionId: randomUUID(),
        completedBehavioralRuns: 1,
        adapter: this.runner.id,
        runner: 'LanguageAdapterRunner',
        evaluator: 'deterministic',
        storyUnchanged: canonical(story) === storySnapshot,
        mockDataUsed: false,
      },
    }
  }
}
