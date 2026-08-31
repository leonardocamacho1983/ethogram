import { fork, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { lstatSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ProjectOperationRequest, ProjectOperationResult } from '@ethogram/cli/runtime'

type WorkerResponse =
  | { type: 'result'; requestId: string; result: ProjectOperationResult }
  | {
      type: 'error'
      requestId: string
      code: string
      effectsMayHaveOccurred: boolean
      retrySafe: boolean
    }

const PUBLIC_ERRORS: Record<string, { message: string; remediation?: string }> = {
  INVALID_PROJECT_ROOT: {
    message: 'The configured Ethogram project root is not a readable directory.',
    remediation: 'Start ethogram-mcp with --project pointing to an existing project directory.',
  },
  MISSING_PROJECT_PACKAGE: {
    message: 'The project does not contain a package.json with a name.',
    remediation: 'Add a named package.json to the project root.',
  },
  MISSING_ETHOGRAM_CONFIG: {
    message: 'The project is not initialized for Ethogram.',
    remediation: 'Run ethogram init or ethogram init --existing in the project.',
  },
  INVALID_ETHOGRAM_CONFIG: {
    message: 'Ethogram could not load the project configuration.',
    remediation: 'Check ethogram.config.mjs and run ethogram_doctor again.',
  },
  PROJECT_PATH_ESCAPE: {
    message: 'An Ethogram project path or project-relative import escapes the configured project root.',
    remediation: 'Use regular in-root config/package/source files and project-relative directories/imports. Read ethogram://docs/troubleshooting.',
  },
  NO_STORIES: {
    message: 'No Ethogram Stories were found in the configured project.',
    remediation: 'Add at least one valid *.agent.stories.ts or JavaScript Story module.',
  },
  INVALID_AGENT_EXPORT: { message: 'The project contains an invalid Agent module.', remediation: 'Check each *.agent.* export for a unique bounded id plus non-empty name, description, and icon.' },
  INVALID_STORY_EXPORT: { message: 'The project contains an invalid Story contract.', remediation: 'Check *.agent.stories.* exports, unique expectation ids, non-empty expectations, and supported tool-called/tool-not-called matchers.' },
  INVALID_EXECUTION_PROFILE_EXPORT: { message: 'The project contains an invalid execution profile.', remediation: 'Check each *.profile.* or *-profile.* export for an id, tools object, and execute function.' },
  DUPLICATE_AGENT_ID: { message: 'The project contains duplicate Agent ids.', remediation: 'Give every exported Agent a unique id across configured Agent directories.' },
  DUPLICATE_STORY_ID: { message: 'The project contains duplicate Story ids.', remediation: 'Give every exported Story a unique id across configured Story directories.' },
  DUPLICATE_EXECUTION_PROFILE_ID: { message: 'The project contains duplicate execution-profile ids.', remediation: 'Give every exported execution profile a unique id.' },
  UNKNOWN_STORY_AGENT: { message: 'A Story references an unavailable Agent.', remediation: 'Export the referenced Agent from a configured Agent directory or correct the Story binding.' },
  UNKNOWN_EXECUTION_PROFILE: { message: 'A Story references an unavailable execution profile.', remediation: 'Export the referenced profile from a configured execution directory or correct Story execution.profile.' },
  INVALID_EXTERNAL_EXECUTION_EVIDENCE: { message: 'The execution profile returned invalid external evidence.', remediation: 'Return verdict-free evidence with stable call ids, names, inputs, sequences, and operational statuses.' },
  CONFLICTING_OBSERVATION_SOURCES: { message: 'The run mixed Ethogram-observed and framework-owned evidence.', remediation: 'Use either callTool-observed evidence or one external evidence payload for a run, never both.' },
  PROFILE_EXECUTION_FAILED: { message: 'The consumer-owned execution profile failed.', remediation: 'Run the profile locally and inspect its own redacted diagnostics. The MCP server intentionally withholds consumer error text.' },
  STORY_NOT_FOUND: { message: 'The requested Story does not exist in the current project.' },
  STORY_NOT_EXECUTABLE: { message: 'The requested Story is not executable.' },
  STORY_CONTEXT_TRUNCATED: {
    message: 'The requested Story contract is too large to inspect completely and cannot be executed through MCP.',
    remediation: 'Reduce the Story contract to the documented MCP payload bounds, then inspect it again before deliberate execution.',
  },
  STALE_PROJECT: {
    message: 'The project or Story changed after it was inspected.',
    remediation: 'Inspect the Story again. Do not automatically retry an execution.',
  },
  STALE_EXECUTION: {
    message: 'Project sources changed after execution started.',
    remediation: 'Review possible external effects before deciding whether another run is safe.',
  },
  RUN_IN_PROGRESS: {
    message: 'Another Ethogram Story execution is already active.',
    remediation: 'Wait for the active operation to finish; do not queue an automatic retry.',
  },
  PROJECT_WORKER_TIMEOUT: {
    message: 'The isolated Ethogram project worker exceeded its time limit.',
    remediation: 'Inspect the profile for a hang. External effects may already have occurred during a run.',
  },
  PROJECT_WORKER_EXITED: {
    message: 'The isolated Ethogram project worker exited before returning a result.',
    remediation: 'Check project module side effects locally. Do not automatically retry a run.',
  },
  PROJECT_PAYLOAD_TOO_LARGE: {
    message: 'The project result exceeded the MCP worker payload limit.',
    remediation: 'Reduce Story contract or execution-evidence size, then inspect again. Do not automatically retry a run.',
  },
  OPERATION_CANCELLED: {
    message: 'The Ethogram operation was cancelled.',
    remediation: 'Cancellation cannot undo an external action that already started.',
  },
  EXECUTION_ACKNOWLEDGEMENT_REQUIRED: {
    message: 'Story execution requires explicit acknowledgement of possible external effects.',
    remediation: 'Inspect the Story and set acknowledgeExternalEffects only when execution is genuinely intended.',
  },
  ETHOGRAM_RUNTIME_ERROR: { message: 'The Ethogram runtime operation could not be completed.' },
}

export class EthogramMcpError extends Error {
  readonly code: string
  readonly operationId: string
  readonly effectsMayHaveOccurred: boolean
  readonly retrySafe: boolean
  readonly remediation?: string

  constructor(
    code: string,
    operationId: string,
    effectsMayHaveOccurred: boolean,
    retrySafe: boolean,
  ) {
    const normalizedCode = Object.prototype.hasOwnProperty.call(PUBLIC_ERRORS, code)
      ? code
      : 'ETHOGRAM_RUNTIME_ERROR'
    const publicError = PUBLIC_ERRORS[normalizedCode]!
    super(publicError.message)
    this.name = 'EthogramMcpError'
    this.code = normalizedCode
    this.operationId = operationId
    this.effectsMayHaveOccurred = effectsMayHaveOccurred
    this.retrySafe = retrySafe
    this.remediation = publicError.remediation
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      operationId: this.operationId,
      effectsMayHaveOccurred: this.effectsMayHaveOccurred,
      retrySafe: this.retrySafe,
      ...(this.remediation ? { remediation: this.remediation } : {}),
    }
  }
}

export type ProjectWorkerOptions = {
  projectRoot: string
  loadTimeoutMs?: number
  runTimeoutMs?: number
}

export class ProjectWorkerClient {
  readonly projectRoot: string
  private readonly loadTimeoutMs: number
  private readonly runTimeoutMs: number
  private readonly requireDirectRoot: boolean
  private readonly workers = new Set<ChildProcess>()
  private runActive = false
  private closed = false

  constructor(options: ProjectWorkerOptions) {
    const requestedRoot = path.resolve(options.projectRoot)
    try {
      this.projectRoot = realpathSync.native(requestedRoot)
      this.requireDirectRoot = false
    } catch {
      this.projectRoot = requestedRoot
      this.requireDirectRoot = true
    }
    this.loadTimeoutMs = options.loadTimeoutMs ?? 15_000
    this.runTimeoutMs = options.runTimeoutMs ?? 120_000
  }

  async inspect(signal?: AbortSignal): Promise<ProjectOperationResult & { kind: 'inspect' }> {
    const result = await this.invoke({ kind: 'inspect' }, this.loadTimeoutMs, signal, true)
    if (result.kind !== 'inspect') throw new Error('PROJECT_WORKER_PROTOCOL_ERROR')
    return result
  }

  async run(
    request: Extract<ProjectOperationRequest, { kind: 'run' }>,
    signal?: AbortSignal,
  ): Promise<ProjectOperationResult & { kind: 'run' }> {
    const operationId = request.executionId ?? randomUUID()
    if (this.runActive) throw new EthogramMcpError('RUN_IN_PROGRESS', operationId, false, false)
    this.runActive = true
    try {
      const result = await this.invoke({ ...request, executionId: operationId }, this.runTimeoutMs, signal, true, operationId)
      if (result.kind !== 'run') throw new Error('PROJECT_WORKER_PROTOCOL_ERROR')
      return result
    } catch (error) {
      if (error instanceof EthogramMcpError && error.retrySafe) {
        throw new EthogramMcpError(error.code, error.operationId, error.effectsMayHaveOccurred, false)
      }
      throw error
    } finally {
      this.runActive = false
    }
  }

  async close(): Promise<void> {
    if (this.closed && this.workers.size === 0) return
    this.closed = true
    await Promise.all([...this.workers].map((child) => new Promise<void>((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null) {
        resolve()
        return
      }
      const forceTimer = setTimeout(() => child.kill('SIGKILL'), 500)
      child.once('close', () => {
        clearTimeout(forceTimer)
        resolve()
      })
      child.kill('SIGTERM')
    })))
  }

  private invoke(
    request: ProjectOperationRequest,
    timeoutMs: number,
    signal: AbortSignal | undefined,
    effectsPossible: boolean,
    suppliedOperationId?: string,
  ): Promise<ProjectOperationResult> {
    const operationId = suppliedOperationId ?? randomUUID()
    if (this.closed) return Promise.reject(new EthogramMcpError('PROJECT_WORKER_EXITED', operationId, effectsPossible, false))
    if (signal?.aborted) return Promise.reject(new EthogramMcpError('OPERATION_CANCELLED', operationId, effectsPossible, false))
    if (this.requireDirectRoot) {
      try {
        if (lstatSync(this.projectRoot).isSymbolicLink()) {
          return Promise.reject(new EthogramMcpError('PROJECT_PATH_ESCAPE', operationId, false, false))
        }
      } catch {
        // The worker returns INVALID_PROJECT_ROOT for a path that still does not exist.
      }
    }

    return new Promise((resolve, reject) => {
      const workerPath = fileURLToPath(new URL('./worker.js', import.meta.url))
      let child: ChildProcess
      try {
        child = fork(workerPath, [], {
          cwd: this.projectRoot,
          env: process.env,
          execArgv: ['--max-old-space-size=512'],
          serialization: 'advanced',
          stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
        })
      } catch {
        reject(new EthogramMcpError('PROJECT_WORKER_EXITED', operationId, effectsPossible, false))
        return
      }
      this.workers.add(child)
      child.stdout?.resume()
      child.stderr?.resume()
      let settled = false
      let outcome:
        | { type: 'resolve'; result: ProjectOperationResult }
        | { type: 'reject'; error: EthogramMcpError }
        | undefined
      let forceTimer: NodeJS.Timeout | undefined

      const cleanup = () => {
        clearTimeout(timer)
        if (forceTimer) clearTimeout(forceTimer)
        signal?.removeEventListener('abort', onAbort)
        this.workers.delete(child)
      }
      const finalize = () => {
        if (settled || !outcome) return
        settled = true
        cleanup()
        if (outcome.type === 'resolve') resolve(outcome.result)
        else reject(outcome.error)
      }
      const completeAfterExit = (
        nextOutcome: NonNullable<typeof outcome>,
        terminate: boolean,
      ) => {
        if (settled || outcome) return
        outcome = nextOutcome
        clearTimeout(timer)
        if (child.exitCode !== null || child.signalCode !== null) {
          finalize()
          return
        }
        if (terminate) child.kill('SIGTERM')
        forceTimer = setTimeout(() => {
          if (!settled && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
        }, 500)
      }
      const fail = (error: EthogramMcpError) => completeAfterExit({ type: 'reject', error }, true)
      const onAbort = () => fail(new EthogramMcpError('OPERATION_CANCELLED', operationId, effectsPossible, false))
      const timer = setTimeout(() => {
        fail(new EthogramMcpError('PROJECT_WORKER_TIMEOUT', operationId, effectsPossible, false))
      }, timeoutMs)

      signal?.addEventListener('abort', onAbort, { once: true })
      child.once('error', () => fail(new EthogramMcpError('PROJECT_WORKER_EXITED', operationId, effectsPossible, false)))
      child.once('close', () => {
        if (!outcome) {
          outcome = {
            type: 'reject',
            error: new EthogramMcpError('PROJECT_WORKER_EXITED', operationId, effectsPossible, false),
          }
        }
        finalize()
      })
      child.on('message', (message: WorkerResponse) => {
        if (settled || outcome || !message || message.requestId !== operationId) return
        if (message.type === 'error') {
          completeAfterExit({
            type: 'reject',
            error: new EthogramMcpError(
              message.code,
              operationId,
              message.effectsMayHaveOccurred,
              message.retrySafe,
            ),
          }, false)
          return
        }
        completeAfterExit({ type: 'resolve', result: message.result }, false)
      })
      child.send({ requestId: operationId, projectRoot: this.projectRoot, request }, (error) => {
        if (error) fail(new EthogramMcpError('PROJECT_WORKER_EXITED', operationId, effectsPossible, false))
      })
    })
  }
}
