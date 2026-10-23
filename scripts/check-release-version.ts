import packageMetadata from "../package.json";

const tag = Bun.env.GITHUB_REF_NAME ?? Bun.argv[2];
if (!tag) {
  throw new Error("Provide a release tag with GITHUB_REF_NAME or as the first argument (for example, v0.1.0).");
}

const semanticVersion = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
if (!semanticVersion.test(tag)) {
  throw new Error(`Release tag "${tag}" must use vMAJOR.MINOR.PATCH format.`);
}

const expectedTag = `v${packageMetadata.version}`;
if (tag !== expectedTag) {
  throw new Error(`Release tag "${tag}" does not match package version "${packageMetadata.version}" (expected "${expectedTag}").`);
}

console.log(`Release tag ${tag} matches package version ${packageMetadata.version}.`);
