# @milencode/bundlewatch-cli

CLI utilities for BundleWatch - analyze bundle size history across your git commits.

## Installation

```bash
npm install -g @milencode/bundlewatch-cli
# or
pnpm add -g @milencode/bundlewatch-cli
```

## Commands

### `bundlewatch backfill`

Analyze historical commits to populate bundle metrics. Perfect for getting instant value when adding BundleWatch to an existing project.

**Basic Usage:**

```bash
# Analyze all tagged releases
bundlewatch backfill --releases-only

# Analyze last 50 commits
bundlewatch backfill --last 50

# Analyze specific range
bundlewatch backfill --from=v1.0.0 --to=HEAD

# Sample ~20 commits from history
bundlewatch backfill --sample 20
```

**Options:**

- `--from <ref>` - Start from this git ref (default: `HEAD~100`)
- `--to <ref>` - Analyze up to this git ref (default: `HEAD`)
- `--last <n>` - Analyze only the last N commits
- `--releases-only` - Only analyze tagged releases (v1.0.0, v2.0.0, etc.)
- `--sample <n>` - Sample approximately N commits from the range
- `--build-command <cmd>` - Command to build the project (default: `pnpm build`)
- `--skip-install` - Skip dependency installation (faster if deps unchanged)

**How it works:**

1. Creates isolated git worktrees for each commit
2. Installs dependencies and builds the project
3. Analyzes build output (works with any build tool: Vite, Webpack, Next.js, etc.)
4. Stores metrics in your `bundlewatch-data` branch
5. Cleans up worktrees automatically

**Example workflow:**

```bash
# First time setup - backfill historical data
bundlewatch backfill --releases-only

# Or get last 3 months of weekly commits
bundlewatch backfill --sample 12

# From now on, the plugin handles new commits automatically in CI
```

## Features

- ✅ **Works with any build tool** - Analyzes build output, not tied to specific bundlers
- ✅ **Handles build tool migrations** - Works even if you switched from Webpack to Vite
- ✅ **Smart sampling** - Multiple strategies to balance speed vs coverage
- ✅ **Graceful error handling** - Skips broken builds, continues processing
- ✅ **Progress tracking** - Shows real-time progress with ora spinners
- ✅ **Git worktrees** - Safe isolated builds without affecting your working directory

## License

MIT
