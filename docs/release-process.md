# Release Process

Anti Bazer uses Semantic Versioning and publishes source-code releases through GitHub Actions. A release tag triggers verification and creates a GitHub Release with a compressed source archive and SHA-256 checksum. The project does not currently publish an npm package or prebuilt native binaries.

## Version policy

Use `MAJOR.MINOR.PATCH`:

- **PATCH** for backward-compatible fixes.
- **MINOR** for backward-compatible functionality.
- **MAJOR** for incompatible public behavior or API changes.
- Append a prerelease identifier, for example `1.2.0-rc.1`, when publishing a preview. Its tag is `v1.2.0-rc.1`.

The version in `package.json` is the source of truth for `antibazer --version`. The release tag must match it exactly with a leading `v`.

## Maintainer checklist

1. Confirm CI passes on the changes intended for release.
2. Update `package.json` to the intended version.
3. Move the corresponding changes in `CHANGELOG.md` from `Unreleased` into a dated version heading.
4. Run the release check and full validation:

   ```powershell
   bun run check:release -- v0.1.0
   bun run typecheck
   bun test
   ```

   Replace `v0.1.0` with the version being prepared.
5. Merge the release preparation to `main`.
6. Create an annotated tag at the release commit and push it:

   ```powershell
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

7. Monitor the **Release** workflow in GitHub Actions. It verifies the tag/version, installs the locked dependencies, runs typecheck and tests, then attaches the source archive and checksum to a GitHub Release with generated release notes.
8. Verify the release page, tag, archive, checksum, and notes. For a prerelease tag containing `-`, GitHub marks the release as a prerelease.

Do not move or reuse an already published version tag. To correct a release, publish a new patch version and tag.

## Continuous integration

Pull requests and pushes to `main` run typechecking and tests on Ubuntu and Windows using Bun 1.4.3 and the frozen lockfile. Release jobs run the checks again against the tagged source before publishing.

## Consumer installation

The GitHub Release is a source archive, not a standalone executable. Consumers need Bun and must configure their own authorized provider credentials. Follow the [project README](../README.md) and [platform setup guide](./setup-platform.md). The GitHub-generated source-code archives are also available from the release tag.
