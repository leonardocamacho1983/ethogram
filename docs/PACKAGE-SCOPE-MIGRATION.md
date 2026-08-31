# Package-scope migration record

Status: completed locally on 2026-08-30; publication remains pending.

Authenticated npm access confirmed that `leonardocamacho` is an owner of the `ethogram` organization. The public package names were migrated atomically from `@agentbook/core` and `@agentbook/cli` to `@ethogram/core` and `@ethogram/cli`. The migration covered:

- `package.json`
- `package-lock.json`
- `packages/agentbook/package.json`
- `packages/agentbook/README.md`
- `packages/cli/package.json`
- `packages/cli/README.md`
- `packages/cli/src/server.ts`
- `packages/cli/src/templates.ts`
- `tests/installable-package-boundary.test.mjs`
- `tests/five-minute-developer-onboarding.integration.mjs`
- `tests/bring-your-own-agent.integration.mjs`
- `tests/external-project-integration.test.mjs`
- `tests/external-execution-evidence.test.mjs`
- `tests/fixtures/external-agent-project/package.json`
- `tests/fixtures/external-agent-project/agents/travel-approval.agent.ts`
- `tests/fixtures/external-agent-project/stories/international-trip.agent.stories.ts`
- `tests/fixtures/external-agent-project/execution/travel-approval-profile.ts`
- `tests/fixtures/external-agent-project/tools/travel-tools.ts`
- `tests/fixtures/github-tools-agent/agents/github-repository.agent.ts`
- `tests/fixtures/github-tools-agent/stories/github-repository.agent.stories.ts`
- `tests/fixtures/github-tools-agent/execution/github-tools.profile.mjs`
- `docs/RELEASE-READINESS.md`
- `docs/PACKAGE-SCOPE-MIGRATION.md`
- `docs/packages.md`
- `docs/quickstart.md`
- `docs/existing-agent.md`
- `README.md`

Both lockfiles and built artifacts were regenerated. Typecheck, build, package inspection, and the clean new-project and existing-agent journeys passed against the final package names. Do not rewrite `tests/01-*.md` through `tests/09-*.md`; those are historical records.
