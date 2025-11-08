---
title: Git Storage
description: How BundleWatch persists metrics in an orphan branch.
---

# 💾 Git Storage

BundleWatch avoids external databases by storing metrics JSON files inside a dedicated Git branch (default: `bundlewatch-data`). Each CI run writes the current metrics and updates `latest.json` per branch. This keeps history auditable and makes comparisons trivial.

## How it works

1. BundleWatch collects metrics after your build (plugins or CLI).
2. Metrics get written to `data/<code-branch>/<timestamp>-<commit>.json`.
3. `latest.json` holds the most recent snapshot per branch for quick lookups.
4. CI pushes the orphan branch back to origin.

```
.git/
└─ bundlewatch-data
   └─ data/
      ├─ main/
      │  ├─ 1730939472000-abc1234.json
      │  └─ latest.json
      └─ feature/my-change/
         └─ ...
```

## Configuring CI

```yaml
permissions:
  contents: write

steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0
  - run: pnpm install
  - run: pnpm build
```

Set `saveToGit: true` (default in CI) on the plugin or CLI call so metrics are persisted automatically.

## Switching branches or remotes

All storage helpers accept overrides:

```ts
const storage = new GitStorage({
  branch: 'bundlewatch-data',
  remote: 'origin',
});
```

Keep the docs aligned with the code by updating this section whenever the storage contract changes.
