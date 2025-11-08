---
title: CLI
description: Analyze any build output with the BundleWatch CLI.
---

# 🛠️ CLI

Package: `@milencode/bundlewatch-cli`

Use the CLI when you don’t want to wire a plugin or when you’re analyzing arbitrary build output.

## Install

```bash
pnpm add -D @milencode/bundlewatch-cli
```

or run it via `npx`:

```bash
npx @milencode/bundlewatch-cli analyze --output dist
```

## Commands

### `analyze`

```
bundlewatch analyze --output dist --save --compare main
```

- `--output` – directory to scan (defaults to `dist`).
- `--save` – persist metrics to Git storage.
- `--compare <branch>` – compare against a branch on the data repo.

Under the hood this calls `MetricsCollector`, `GitStorage`, `ComparisonEngine`, and `ReportGenerator` (all from `@milencode/bundlewatch-core`). If warnings are emitted, the process exits with code `1` so CI can fail the job.

### Planned commands

| Command          | Status  | Notes |
| ---------------- | ------- | ----- |
| `compare <ref>`  | TODO    | Load two snapshots from Git storage and print a diff. |
| `report --format markdown` | TODO | Generate badge/markdown output without running a fresh analysis. |

Track CLI issues in the monorepo to see what’s coming up next.
