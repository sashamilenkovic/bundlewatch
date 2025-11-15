---
title: CLI
description: Command-line tools for BundleWatch, including historical backfilling
---

# 🛠️ CLI

Package: `@milencode/bundlewatch-cli`

The BundleWatch CLI provides utilities for managing bundle metrics, with a focus on backfilling historical data.

## Install

```bash
pnpm add -D @milencode/bundlewatch-cli
```

or run it via `npx`:

```bash
npx bundlewatch backfill --last 10
```

## Commands

### `backfill`

Analyze historical commits to populate bundle metrics. This is essential for new projects to establish a baseline for comparisons.

#### Quick Start

```bash
# Interactive mode (recommended for first time)
bundlewatch backfill -i

# Smart default - last 10 commits
bundlewatch backfill

# Specify number of commits
bundlewatch backfill --last 20
```

#### All Options

```bash
bundlewatch backfill [options]
```

**Options:**

- `-i, --interactive` - Interactive mode with prompts (recommended)
- `--branch <name>` - Target specific branch (e.g., main, develop)
- `--last <n>` - Analyze only the last N commits
- `--from <ref>` - Start from this git ref (commit, tag, branch)
- `--to <ref>` - Analyze up to this git ref
- `--releases-only` - Only analyze tagged releases
- `--sample <n>` - Sample approximately N commits from range
- `--build-command <cmd>` - Command to build the project (default: 'pnpm build')
- `--skip-install` - Skip dependency installation (faster if deps unchanged)

#### Examples

```bash
# Interactive mode with guided prompts
bundlewatch backfill -i

# Backfill main branch only (recommended)
bundlewatch backfill --branch main --last 20

# Only analyze releases
bundlewatch backfill --releases-only

# Custom commit range
bundlewatch backfill --from v1.0.0 --to HEAD

# Sample 20 commits from last 1000
bundlewatch backfill --from HEAD~1000 --sample 20

# Custom build command
bundlewatch backfill --last 10 --build-command "npm run build:prod"

# Skip installing deps (faster)
bundlewatch backfill --last 10 --skip-install
```

## Backfilling Best Practices

### When to Backfill

Backfill when:
- **First-time setup**: You've just installed BundleWatch and want baseline data
- **No comparison data**: Your builds show "No baseline found"
- **New branch tracking**: You want to track a new main/develop branch

### What to Backfill

**Key insight:** You typically only need to backfill the branch you compare against (usually `main`).

```bash
# ✅ Recommended: Target your main branch
bundlewatch backfill --branch main --last 10

# ❌ Not needed: Don't backfill every branch
# This is wasteful and slow
```

### How Much to Backfill

| Strategy | Time | Use Case |
|----------|------|----------|
| `--last 10` | ~5-10 min | **Recommended** for quick start |
| `--last 20` | ~10-20 min | Good baseline |
| `--last 50` | ~25-50 min | Comprehensive history |
| `--releases-only` | Variable | Clean history from releases |

**Tip:** Start small (10-20 commits) and backfill more if needed.

### Performance Optimization

BundleWatch automatically uses the fastest analysis method available:

#### Webpack Projects

For faster backfilling, generate `stats.json` during build:

```js
// webpack.config.js
const { StatsWriterPlugin } = require('webpack-stats-plugin');

module.exports = {
  plugins: [
    new StatsWriterPlugin({ filename: 'stats.json' })
  ]
};
```

**Speed improvement:** 2000x faster than file-based analysis

#### Vite Projects

Vite manifests are automatically detected - no configuration needed!

#### Fallback

If no bundler stats are found, BundleWatch falls back to file-based analysis with estimated compression (still fast, just less accurate).

## GitHub Actions Integration

For one-time backfilling in CI, create `.github/workflows/backfill.yml`:

```yaml
name: Backfill Bundle History

on:
  workflow_dispatch:
    inputs:
      commits:
        description: 'Number of commits to backfill'
        required: true
        default: '20'
        type: choice
        options:
          - '10'
          - '20'
          - '50'
          - '100'

jobs:
  backfill:
    runs-on: ubuntu-latest
    timeout-minutes: 180

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history required

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - run: pnpm install

      - name: Backfill bundle metrics
        run: npx bundlewatch backfill --last ${{ inputs.commits }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**To use:**
1. Push this workflow to your repo
2. Go to Actions tab → "Backfill Bundle History"
3. Click "Run workflow" → select commits
4. Wait for completion (runs in background)

## How Backfill Works

1. **Creates git worktrees** for each commit (isolated environment)
2. **Installs dependencies** (with smart fallbacks: pnpm → npm)
3. **Runs build command** in each worktree
4. **Analyzes build output** using fastest method available:
   - Webpack: Parse `stats.json` (instant)
   - Vite: Parse manifest (instant)
   - Fallback: File analysis with estimated compression
5. **Saves metrics** to `bundlewatch-data` git branch
6. **Cleans up** worktree
7. **Returns** to original branch

## Troubleshooting

### "No baseline found"

This is expected on first run! Run backfill to create baseline:

```bash
bundlewatch backfill --last 10
```

### "fatal: couldn't find remote ref bundlewatch-data"

This is normal on first run. The `bundlewatch-data` branch is created automatically when you save your first metrics.

### Build fails during backfill

Some commits might fail to build (breaking changes, old Node versions, etc.). This is okay! Backfill continues with successful builds and reports failures at the end.

### Slow backfilling

Tips to speed up:
- Use `--skip-install` if dependencies haven't changed
- Generate bundler stats files (webpack `stats.json`)
- Backfill fewer commits initially (`--last 10`)
- Use `--sample` to skip commits: `--sample 20` from `--from HEAD~1000`

## Planned Commands

| Command | Status | Notes |
|---------|--------|-------|
| `compare <ref>` | TODO | Load two snapshots and print diff |
| `report --format markdown` | TODO | Generate badge/markdown output |
| `clean` | TODO | Clean old metrics from storage |

Track CLI issues in the monorepo to see what's coming next.
