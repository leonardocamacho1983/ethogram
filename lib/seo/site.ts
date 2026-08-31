export const SITE_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ethogram.dev',
).origin

export const SITE_NAME = 'Ethogram'
export const SITE_DESCRIPTION =
  'Local, code-first behavioral testing for TypeScript and Node.js AI agents. Run the real agent and verify required or forbidden tool calls.'
export const SITE_LAST_UPDATED = '2026-08-30'

export const GITHUB_URL = 'https://github.com/leonardocamacho1983/ethogram'
export const LICENSE_URL = `${GITHUB_URL}/blob/main/LICENSE`

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString()
}
