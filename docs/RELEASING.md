# Publishing Ethogram

Ethogram publishes `@ethogram/core`, `@ethogram/cli`, and `@ethogram/mcp` from GitHub Actions through npm Trusted Publishing. GitHub proves the workflow identity to npm with short-lived OIDC credentials. No npm write token belongs in this repository or in GitHub Actions secrets.

## One-time npm setup

Each package must trust the same workflow:

| npm package | GitHub owner | Repository | Workflow filename | Environment |
| --- | --- | --- | --- | --- |
| `@ethogram/core` | `leonardocamacho1983` | `ethogram` | `publish.yml` | none |
| `@ethogram/cli` | `leonardocamacho1983` | `ethogram` | `publish.yml` | none |
| `@ethogram/mcp` | `leonardocamacho1983` | `ethogram` | `publish.yml` | none |

Configure this in each package's **Settings → Trusted Publisher** page on npm, or use an authenticated npm CLI:

```bash
npm trust github @ethogram/core --repo leonardocamacho1983/ethogram --file publish.yml --allow-publish --yes
npm trust github @ethogram/cli --repo leonardocamacho1983/ethogram --file publish.yml --allow-publish --yes
npm trust github @ethogram/mcp --repo leonardocamacho1983/ethogram --file publish.yml --allow-publish --yes
```

npm requires an existing package before its first trusted publisher can be configured. Bootstrap a brand-new package with one direct, 2FA-approved publication from the exact release commit, then configure its trusted publisher before the coordinated GitHub release. This exception applies only to the first `@ethogram/mcp` publication.

## Release procedure

1. Update the root and all public package versions together.
2. Keep internal Ethogram dependencies pinned to that exact version.
3. Update release notes and all versioned install examples.
4. Run:

   ```bash
   npm ci
   npm run release:verify -- --tag v<version> --prerelease <true-or-false>
   npm run test:mcp
   npm test
   npm run typecheck
   npm run build
   npm run release:publish -- --tag v<version> --dry-run
   ```

5. Commit and push the release state.
6. Create a GitHub Release whose tag is exactly `v<version>`. Mark it as a prerelease when the version contains a SemVer prerelease suffix.
7. Watch **Publish npm packages** complete successfully.
8. Verify the three registry versions, npm dist-tags, provenance statements, package READMEs, and a clean external install.

Publishing order is fixed: core, CLI, then MCP. Prereleases receive the npm `next` tag; stable versions receive `latest`. The workflow checks the GitHub tag, release kind, package names, versions, repository metadata, public access, and exact internal dependency pins before publishing.

The publisher is safe to retry after a partial registry failure. It packs each workspace and compares npm's integrity digest. An already-published package is skipped only when its registry tarball exactly matches the current release artifact; a mismatch stops the release.

## Security boundary

The workflow grants `id-token: write` only to the publish job and otherwise has read-only repository access. It runs on a GitHub-hosted runner, disables the package-manager cache, checks out the immutable release tag, pins an OIDC-capable npm CLI, executes the complete release gate, and requests npm provenance for every new artifact. npm provenance requires both a public package and a public source repository.

Do not add `NPM_TOKEN`, `NODE_AUTH_TOKEN`, automation tokens, or `.npmrc` credentials. Creating or changing the trusted-publisher relationship is an npm account/package administration action and still requires the maintainer's 2FA.
