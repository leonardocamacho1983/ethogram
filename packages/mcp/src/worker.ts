import {
  executeProjectOperation,
  ProjectRuntimeError,
  type ProjectOperationRequest,
  type ProjectOperationResult,
} from '@ethogram/cli/runtime'
import { storyDto } from './dto.js'

const MAX_IPC_PAYLOAD_BYTES = 4 * 1024 * 1024

type WorkerRequest = {
  requestId: string
  projectRoot: string
  request: ProjectOperationRequest
}

let handled = false

function transportResult(result: ProjectOperationResult): ProjectOperationResult {
  const snapshot = {
    ...result.snapshot,
    project: {
      ...result.snapshot.project,
      projectRoot: '',
    },
  }
  return result.kind === 'inspect'
    ? { kind: 'inspect', snapshot }
    : { kind: 'run', snapshot, run: result.run }
}

process.on('message', async (message: WorkerRequest) => {
  if (handled || !message || typeof message.requestId !== 'string') return
  handled = true
  try {
    const storyId = message.request.kind === 'run' ? message.request.storyId : undefined
    const result = transportResult(await executeProjectOperation(message.projectRoot, message.request, {
      beforeRun: storyId === undefined ? undefined : (snapshot) => {
        const story = storyDto(snapshot, storyId)
        if (story?.truncated) {
          throw new ProjectRuntimeError(
            'STORY_CONTEXT_TRUNCATED',
            'The Story contract exceeds the safe MCP inspection bounds.',
            true,
            false,
          )
        }
      },
    }))
    const payloadBytes = Buffer.byteLength(JSON.stringify(result), 'utf8')
    if (payloadBytes > MAX_IPC_PAYLOAD_BYTES) {
      throw new ProjectRuntimeError(
        'PROJECT_PAYLOAD_TOO_LARGE',
        'The project result exceeded the worker transport limit.',
        true,
        false,
      )
    }
    process.send?.({ type: 'result', requestId: message.requestId, result }, () => process.exit(0))
  } catch (error) {
    const failure = error instanceof ProjectRuntimeError
      ? error
      : new ProjectRuntimeError(
          'ETHOGRAM_RUNTIME_ERROR',
          'The Ethogram worker failed.',
          message.request.kind === 'run',
          message.request.kind !== 'run',
        )
    const code = typeof failure.code === 'string' && failure.code.length <= 100
      ? failure.code
      : 'ETHOGRAM_RUNTIME_ERROR'
    process.send?.({
      type: 'error',
      requestId: message.requestId,
      code,
      effectsMayHaveOccurred: failure.effectsMayHaveOccurred,
      retrySafe: failure.retrySafe,
    }, () => process.exit(1))
  }
})
