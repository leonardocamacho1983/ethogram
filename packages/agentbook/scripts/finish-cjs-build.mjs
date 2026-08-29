import { copyFile, rm } from 'node:fs/promises'

const packageRoot = new URL('../', import.meta.url)
await copyFile(new URL('dist-cjs/index.js', packageRoot), new URL('dist/index.cjs', packageRoot))
await rm(new URL('dist-cjs/', packageRoot), { recursive: true, force: true })
