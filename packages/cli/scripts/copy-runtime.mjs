import { cp, mkdir, rm } from 'node:fs/promises'

const destination = new URL('../dist/runtime/', import.meta.url)
await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })
await cp(new URL('../src/runtime/', import.meta.url), destination, { recursive: true })
