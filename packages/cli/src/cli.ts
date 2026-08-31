#!/usr/bin/env node
import { access, mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { startDeveloperServer } from './server.js'
import { existingProjectFiles, starterFiles } from './templates.js'
import { TypeScriptAdapterError } from './typescript-adapter.js'

const help = `Ethogram CLI (alpha)

Usage:
  ethogram init [--existing]
  ethogram dev [--project <path>] [--port <number>] [--no-open]
  ethogram --help
  ethogram --version

Commands:
  init  Create a starter Agent, Story, and local execution profile in the current project.
        Use --existing to create configuration only for an existing agent project.
  dev   Start the local, read-only Ethogram developer UI. The current directory is the default project.
        Agent, Story, and execution-profile files remain the source of truth and reload automatically.

Examples:
  npx ethogram init
  npx ethogram init --existing
  npx ethogram dev
  npx ethogram dev --project ./my-agent-project --port 4317 --no-open
`

async function version(): Promise<string> {
  const packagePath = fileURLToPath(new URL('../package.json', import.meta.url))
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8')) as { version: string }
  return packageJson.version
}

async function projectPackage(root: string): Promise<{ name: string }> {
  try {
    const packagePath = path.join(root, 'package.json')
    const value = JSON.parse(await readFile(packagePath, 'utf8')) as { name?: unknown }
    if (typeof value.name !== 'string' || !value.name.trim()) throw new Error('missing-name')
    return { name: value.name }
  } catch {
    throw new Error(`INIT_PROJECT_INVALID: ${root} must contain a package.json with a name.`)
  }
}

async function initialize(options: { existing: boolean }): Promise<void> {
  const root = await realpath(process.cwd())
  if (!(await stat(root)).isDirectory()) throw new Error(`INIT_PROJECT_INVALID: ${root} is not a directory.`)
  const packageJson = await projectPackage(root)
  const files = options.existing ? existingProjectFiles(packageJson.name) : starterFiles(packageJson.name)
  const matching: string[] = []
  const missing: string[] = []
  const conflicts: string[] = []

  await access(root, constants.R_OK | constants.W_OK)
  for (const file of files) {
    const target = path.join(root, file.relativePath)
    try {
      const existing = await readFile(target, 'utf8')
      if (existing === file.content) matching.push(file.relativePath)
      else conflicts.push(file.relativePath)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT') missing.push(file.relativePath)
      else throw new Error(`INIT_PREFLIGHT_FAILED: Could not inspect ${file.relativePath}.`)
    }
  }

  if (conflicts.length > 0) {
    throw new Error(`INIT_CONFLICT: Existing files were preserved; nothing was written. Conflicts: ${conflicts.join(', ')}`)
  }

  for (const relativePath of missing) {
    const file = files.find((candidate) => candidate.relativePath === relativePath)
    if (!file) continue
    const target = path.join(root, relativePath)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, file.content, { encoding: 'utf8', flag: 'wx' })
  }

  if (missing.length === 0) {
    process.stdout.write(`Ethogram is already initialized in ${root}. No files were changed.\n`)
  } else {
    process.stdout.write(`Ethogram initialized in ${root}.\n`)
    for (const relativePath of missing) process.stdout.write(`Created ${relativePath}\n`)
    for (const relativePath of matching) process.stdout.write(`Preserved ${relativePath}\n`)
  }
  if (options.existing) {
    process.stdout.write('Add an Agent descriptor, behavioral Story, and thin execution profile for your existing agent.\n')
  }
  process.stdout.write('Next: npx ethogram dev\n')
}

function parseDevArguments(args: string[]): { projectRoot: string; port: number; openBrowser: boolean } {
  let projectRoot = process.cwd()
  let port = 4317
  let openBrowser = true
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--no-open') {
      openBrowser = false
      continue
    }
    if (argument === '--project') {
      const value = args[index + 1]
      if (!value) throw new Error('CLI_USAGE: --project requires a path.')
      projectRoot = path.resolve(value)
      index += 1
      continue
    }
    if (argument === '--port') {
      const value = Number(args[index + 1])
      if (!Number.isInteger(value) || value < 0 || value > 65535) {
        throw new Error('CLI_USAGE: --port requires an integer from 0 to 65535.')
      }
      port = value
      index += 1
      continue
    }
    throw new Error(`CLI_USAGE: Unknown dev option ${argument}.`)
  }
  return { projectRoot, port, openBrowser }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const command = args[0]
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(help)
    return
  }
  if (command === '--version' || command === '-v') {
    process.stdout.write(`${await version()}\n`)
    return
  }
  if (command === 'init') {
    const initArgs = args.slice(1)
    if (initArgs.some((argument) => argument !== '--existing') || initArgs.filter((argument) => argument === '--existing').length > 1) {
      throw new Error('CLI_USAGE: ethogram init accepts only the optional --existing flag.')
    }
    await initialize({ existing: initArgs.includes('--existing') })
    return
  }
  if (command === 'dev') {
    await startDeveloperServer(parseDevArguments(args.slice(1)))
    return
  }
  throw new Error(`CLI_USAGE: Unknown command ${command}. Run ethogram --help.`)
}

main().catch((error: unknown) => {
  if (error instanceof TypeScriptAdapterError) {
    process.stderr.write(`Ethogram ${error.code}: ${error.message}\n`)
  } else if (error instanceof Error) {
    process.stderr.write(`Ethogram error: ${error.message}\n`)
  } else {
    process.stderr.write('Ethogram error: The command could not be completed.\n')
  }
  process.exitCode = 1
})
