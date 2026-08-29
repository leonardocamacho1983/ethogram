import { spawn } from 'node:child_process'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { AgentbookEngine } from './generic-engine.js'
import { TypeScriptAdapter, TypeScriptAdapterError } from './typescript-adapter.js'

const runtimeDirectory = fileURLToPath(new URL('./runtime/', import.meta.url))

type StartServerOptions = {
  projectRoot: string
  port: number
  openBrowser: boolean
}

function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  })
  response.end(JSON.stringify(value))
}

function safeError(error: unknown): { code: string; message: string } {
  if (error instanceof TypeScriptAdapterError) return { code: error.code, message: error.message }
  if (error instanceof Error) {
    const [code, detail] = error.message.split(': ', 2)
    if (/^[A-Z_]+$/.test(code)) return { code, message: detail ?? code }
  }
  return { code: 'AGENTBOOK_RUNTIME_ERROR', message: 'The Agentbook operation could not be completed.' }
}

async function requestBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.from(chunk)
    size += buffer.length
    if (size > 32_768) throw new Error('REQUEST_TOO_LARGE')
    chunks.push(buffer)
  }
  if (chunks.length === 0) return {}
  const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  if (!parsed || typeof parsed !== 'object') throw new Error('INVALID_REQUEST')
  return parsed as Record<string, unknown>
}

async function staticAsset(response: ServerResponse, fileName: string, contentType: string): Promise<void> {
  const filePath = path.join(runtimeDirectory, fileName)
  const content = await readFile(filePath)
  response.writeHead(200, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'",
  })
  response.end(content)
}

function openLocalBrowser(url: string): void {
  const command = process.platform === 'darwin'
    ? { executable: 'open', args: [url] }
    : process.platform === 'win32'
      ? { executable: 'cmd', args: ['/c', 'start', '', url] }
      : { executable: 'xdg-open', args: [url] }
  const child = spawn(command.executable, command.args, { detached: true, stdio: 'ignore' })
  child.unref()
}

export async function startDeveloperServer(options: StartServerOptions): Promise<void> {
  for (const required of ['index.html', 'app.js', 'styles.css']) {
    try {
      if (!(await stat(path.join(runtimeDirectory, required))).isFile()) throw new Error('missing')
    } catch {
      throw new Error(`MISSING_RUNTIME: Packaged developer runtime is incomplete (${required}). Reinstall @agentbook/cli.`)
    }
  }

  const adapter = new TypeScriptAdapter()
  const engine = new AgentbookEngine(adapter)
  const project = await engine.loadProject(options.projectRoot)

  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1')
      if (request.method === 'GET' && requestUrl.pathname === '/') {
        await staticAsset(response, 'index.html', 'text/html; charset=utf-8')
        return
      }
      if (request.method === 'GET' && requestUrl.pathname === '/app.js') {
        await staticAsset(response, 'app.js', 'text/javascript; charset=utf-8')
        return
      }
      if (request.method === 'GET' && requestUrl.pathname === '/styles.css') {
        await staticAsset(response, 'styles.css', 'text/css; charset=utf-8')
        return
      }
      if (request.method === 'GET' && requestUrl.pathname === '/api/project') {
        json(response, 200, project)
        return
      }
      if (request.method === 'POST' && requestUrl.pathname === '/api/run') {
        const body = await requestBody(request)
        if (typeof body.storyId !== 'string') throw new Error('INVALID_REQUEST: storyId is required')
        const result = await engine.runStory(body.storyId)
        json(response, 200, { status: 'completed', ...result })
        return
      }
      json(response, 404, { error: { code: 'NOT_FOUND', message: 'Route not found.' } })
    } catch (error) {
      json(response, 400, { status: 'execution-error', error: safeError(error), storyEvaluation: 'NOT EVALUATED' })
    }
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      process.stderr.write(`Agentbook could not start: port ${options.port} is already in use. Choose another with --port <number>.\n`)
      process.exitCode = 1
      return
    }
    process.stderr.write('Agentbook could not start its local developer server.\n')
    process.exitCode = 1
  })

  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => reject(error)
    server.once('error', onError)
    server.listen(options.port, '127.0.0.1', () => {
      server.off('error', onError)
      resolve()
    })
  })

  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : options.port
  const url = `http://127.0.0.1:${port}/`
  process.stdout.write(`Agentbook project: ${project.name}\n`)
  process.stdout.write(`Project root: ${project.projectRoot}\n`)
  process.stdout.write(`Local URL: ${url}\n`)
  process.stdout.write(`TypeScript adapter: ready (${project.stories.length} Story)\n`)

  if (options.openBrowser) openLocalBrowser(url)

  let closing = false
  const shutdown = () => {
    if (closing) return
    closing = true
    process.stdout.write('Stopping Agentbook developer server...\n')
    server.close(() => {
      process.stdout.write('Agentbook developer server stopped.\n')
      process.exitCode = 0
    })
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
}
