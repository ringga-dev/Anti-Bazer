# Contributing

Thank you for helping improve Anti Bazer. Contributions should make the application more reliable, understandable, and responsible to operate.

## Before opening a pull request

1. Review the [developer guide](./docs/developer-guide.md), [feature status and limitations](./docs/status-fitur.md), and [MIT License](./LICENSE).
2. Open or review an issue for substantial changes so scope and provider/API constraints are clear.
3. Keep changes focused. Do not include credentials, real user data, or unrelated formatting changes.
4. Add or update tests for behavior changes and update directly related documentation.
5. Run:

   ```powershell
   bun install --frozen-lockfile
   bun run typecheck
   bun test
   ```

6. In the pull request, describe the user-visible change, validation performed, relevant limitations, and any provider access or cost implications.

## Provider integrations

- Use official APIs and permitted scopes; never bypass access controls, rate limits, or platform terms.
- Declare only capabilities that the adapter actually implements.
- Test pagination, missing fields, rate limits, permission failures, and provider errors with safe fixtures or mocked requests.
- Never silently convert a failed or partial collection into a complete-looking result.
- Do not add secrets or personal data to tests, logs, or examples.

## Analysis and AI

- Describe observable patterns; do not claim to determine a person's identity, motive, or whether they are a “buzzer.”
- Keep evidence, method, sample size, and uncertainty visible.
- AI is optional. Minimize data sent to external model endpoints and document the privacy implications of changes.
- Do not make accuracy claims without an appropriate, documented evaluation.

## Versioning and releases

Releases use Semantic Versioning. A maintainer updates `package.json` and `CHANGELOG.md`, merges the release change, then creates and pushes a matching `vMAJOR.MINOR.PATCH` tag. The release workflow verifies the tag, runs checks, and publishes a source archive and checksum as a GitHub Release. See [release process](./docs/release-process.md).
