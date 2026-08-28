import type { ObservedRun, Story, StoryOutcome, TimelineStep } from './domain'

export type RunContext = Record<string, string>

export interface Runner<
  TContext = void,
  TResult extends ObservedRun | Promise<ObservedRun> = ObservedRun,
> {
  run(story: Story, context: TContext): TResult
}

export type RunnerExecutor<TContext> = (story: Story, context: TContext) => ObservedRun

export class DeterministicRunner<TContext = void> implements Runner<TContext> {
  private readonly execute: RunnerExecutor<TContext>

  constructor(execute: RunnerExecutor<TContext>) {
    this.execute = execute
  }

  run(story: Story, context: TContext): ObservedRun {
    return this.execute(story, context)
  }
}

function numericValue(value: string | undefined): number {
  return Number((value ?? '').replace(/[^0-9.]/g, '')) || 0
}

function defaultTimeline(run: Pick<ObservedRun, 'decision' | 'toolCalls'>): TimelineStep[] {
  return [
    { label: 'Input', detail: 'Scenario received', duration: '0.1s' },
    { label: 'Tool Call', detail: `${run.toolCalls.length} observable tool calls`, duration: '0.4s' },
    { label: 'Decision', detail: run.decision, duration: '0.6s' },
    { label: 'Action', detail: 'Configured outcome selected', duration: '0.3s' },
    { label: 'Output', detail: 'Response returned to customer', duration: '0.4s' },
  ]
}

function executeLocalStory(story: Story, context: RunContext): ObservedRun {
  let outcome: StoryOutcome = story.result ?? {
    decision: 'Ready to run',
    reason: 'No local deterministic execution is configured for this Story.',
  }
  const simulation = story.simulation ?? { kind: 'static' }

  if (simulation.kind === 'numeric-threshold') {
    const actual = numericValue(context[simulation.actualField])
    const threshold = numericValue(context[simulation.thresholdField])
    outcome = actual > threshold ? simulation.above : simulation.atOrBelow
    outcome = { ...outcome, reason: outcome.reason.replaceAll('${threshold}', `$${threshold}`) }
  }

  const toolCalls = outcome.toolCalls ?? story.tools ?? []

  return {
    decision: outcome.decision,
    reason: outcome.reason,
    toolCalls,
    timeline: outcome.timeline ?? defaultTimeline({ decision: outcome.decision, toolCalls }),
  }
}

export const localStoryRunner: Runner<RunContext> = new DeterministicRunner(executeLocalStory)
