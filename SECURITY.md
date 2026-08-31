# Security policy

Ethogram is in public alpha. Security fixes are made against the current prerelease; older alpha versions may not receive patches.

## Report a vulnerability privately

Use [GitHub private vulnerability reporting](https://github.com/leonardocamacho1983/ethogram/security/advisories/new) for vulnerabilities, credentials, private prompts, sensitive tool evidence, or details that would make exploitation easier.

Do not open a public issue containing secrets, personal data, raw model conversations, environment variables, or unredacted tool inputs and outputs. If private reporting is unavailable, contact the maintainer through the [GitHub profile](https://github.com/leonardocamacho1983) and request a private channel before sharing details.

For ordinary bugs that contain no sensitive information, use the [public issue tracker](https://github.com/leonardocamacho1983/ethogram/issues).

## Scope to keep in mind

Ethogram loads trusted project-owned Node.js modules. Those modules retain the filesystem, network, subprocess, and environment access of the user running Ethogram. The MCP worker protects protocol framing and contains crashes and hangs; it is not an operating-system sandbox.

Story input, model output, provider metadata, and tool evidence may be sensitive. Review and redact them before sharing.
