#!/usr/bin/env node
import path from 'node:path'
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { createEthogramMcpServer, MCP_PACKAGE_VERSION, ProjectWorkerClient } from './index.js'

const help = `Ethogram MCP server (alpha)

Usage:
  ethogram-mcp [--project <path>] [--load-timeout-ms <number>] [--run-timeout-ms <number>]
  ethogram-mcp --help
  ethogram-mcp --version

The current directory is the default project. The server uses local stdio transport.
Project discovery evaluates trusted project-owned Node.js modules in an isolated worker.
Running a Story may cause external effects and requires revision-bound acknowledgement.
`

function positiveInteger(value: string | undefined, option: string, maximum: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 100 || parsed > maximum) {
    throw new Error(`${option} requires an integer from 100 to ${maximum}.`)
  }
  return parsed
}

function parseArguments(args: string[]): { projectRoot: string; loadTimeoutMs: number; runTimeoutMs: number } | 'help' | 'version' {
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) return 'help'
  if (args.length === 1 && (args[0] === '--version' || args[0] === '-v')) return 'version'
  let projectRoot = process.cwd()
  let loadTimeoutMs = 15_000
  let runTimeoutMs = 120_000
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--project') {
      const value = args[index + 1]
      if (!value) throw new Error('--project requires a path.')
      projectRoot = path.resolve(value)
      index += 1
    } else if (argument === '--load-timeout-ms') {
      loadTimeoutMs = positiveInteger(args[index + 1], argument, 120_000)
      index += 1
    } else if (argument === '--run-timeout-ms') {
      runTimeoutMs = positiveInteger(args[index + 1], argument, 900_000)
      index += 1
    } else {
      throw new Error(`Unknown option ${argument}.`)
    }
  }
  return { projectRoot, loadTimeoutMs, runTimeoutMs }
}

async function main(): Promise<void> {
  const parsed = parseArguments(process.argv.slice(2))
  if (parsed === 'help') {
    process.stdout.write(help)
    return
  }
  if (parsed === 'version') {
    process.stdout.write(`${MCP_PACKAGE_VERSION}\n`)
    return
  }

  const runtime = new ProjectWorkerClient(parsed)
  const handle = serveStdio(() => createEthogramMcpServer({ ...parsed, runtime }), {
    onerror: (error) => process.stderr.write(`Ethogram MCP protocol error: ${error.message}\n`),
  })
  process.stderr.write(`Ethogram MCP ${MCP_PACKAGE_VERSION} is ready on stdio. Project loading evaluates trusted code.\n`)

  let closing = false
  const shutdown = () => {
    if (closing) return
    closing = true
    void runtime.close().then(() => handle.close()).finally(() => {
      process.exitCode = 0
    })
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
  process.stdin.once('end', shutdown)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'The MCP server could not start.'
  process.stderr.write(`Ethogram MCP error: ${message}\n`)
  process.exitCode = 1
})
