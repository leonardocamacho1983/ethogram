import { verifyRelease } from './release-contract.mjs'

function option(name) {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

const prereleaseValue = option('--prerelease')
const release = await verifyRelease({
  tag: option('--tag'),
  prerelease: prereleaseValue === undefined ? undefined : prereleaseValue === 'true',
})

console.log(`Release contract passed: ${release.expectedTag}, npm dist-tag ${release.distTag}, ${release.packages.length} aligned packages.`)
