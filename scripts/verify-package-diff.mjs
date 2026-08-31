export function isModeOnlyBinDiff(output, binPaths) {
  const allowed = new Set(binPaths)
  const lines = output.trim().split('\n')
  if (lines.length === 1 && lines[0] === '') return false

  for (let index = 0; index < lines.length;) {
    const header = lines[index]?.match(/^diff --git a\/(.+) b\/(.+)$/)
    if (!header || header[1] !== header[2] || !allowed.has(header[1])) return false
    const file = header[1]
    if (!/^old mode \d+$/.test(lines[index + 1] ?? '')) return false
    if (!/^new mode \d+$/.test(lines[index + 2] ?? '')) return false
    if (!/^index \S+\.\.\S+\s*$/.test(lines[index + 3] ?? '')) return false
    if (lines[index + 4] !== `--- a/${file}`) return false
    if (lines[index + 5] !== `+++ b/${file}`) return false
    index += 6
  }
  return true
}
