# Security Policy

## Supported versions

Security fixes are made against the latest version on the default branch. Older releases may not receive fixes; users should upgrade to the latest supported release.

## Reporting a vulnerability

Please do not report suspected vulnerabilities in public issues. Use GitHub's **Report a vulnerability** feature on the repository's Security tab to contact the maintainers privately. Include the affected version or commit, impact, reproduction details, and any suggested mitigation. Do not include real access tokens, private account data, or other people's personal information.

If private vulnerability reporting is unavailable, contact the repository owner through a private GitHub channel and request a secure reporting method. Please allow maintainers reasonable time to investigate and coordinate a fix before public disclosure.

## Secret handling

Never commit provider credentials, AI keys, API access tokens, or `.env` files. Revoke and rotate any secret that may have been exposed. See the [platform setup guide](./docs/setup-platform.md) for local configuration guidance.
