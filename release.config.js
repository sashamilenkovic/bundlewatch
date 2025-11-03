// release.config.js
export default {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/npm",
      {
        npmPublish: false, // Don't publish root package (it's private)
      },
    ],
    [
      "@semantic-release/exec",
      {
        // Publish all workspace packages
        publishCmd: "pnpm -r publish --access public --no-git-checks",
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: [
          "package.json",
          "pnpm-lock.yaml",
          "CHANGELOG.md",
          "packages/*/package.json",
        ],
        message:
          "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
      },
    ],
    "@semantic-release/github",
  ],
};

