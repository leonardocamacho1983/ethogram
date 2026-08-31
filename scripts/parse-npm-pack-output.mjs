export function parseNpmPackOutput(output, packageName) {
  const parsed = JSON.parse(output)
  if (Array.isArray(parsed)) {
    if (parsed.length !== 1) throw new Error(`Expected one packed package; received ${parsed.length}.`)
    return parsed[0]
  }

  if (parsed && typeof parsed === 'object') {
    if (packageName && parsed[packageName]) return parsed[packageName]
    const packages = Object.values(parsed)
    if (packages.length === 1) return packages[0]
    throw new Error(`Expected one packed package; received ${packages.length}.`)
  }

  throw new Error('Unexpected npm pack --json output.')
}
