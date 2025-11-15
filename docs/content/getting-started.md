---
title: Getting Started
description: Quick start guide for integrating BundleWatch into your project
---

# 🚀 Getting Started

This guide walks you through integrating BundleWatch into your project in just a few minutes.

## 1. Install the Plugin

Choose the plugin for your bundler:

### Vite

```bash
pnpm add -D @milencode/bundlewatch-vite-plugin
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { bundleWatch } from '@milencode/bundlewatch-vite-plugin';

export default defineConfig({
  plugins: [
    bundleWatch({
      printReport: true,
      saveToGit: true, // Auto-enabled in CI
      compareAgainst: 'main',
    })
  ],
});
```

### Webpack

```bash
pnpm add -D @milencode/bundlewatch-webpack-plugin
```

```js
// webpack.config.js
const { bundleWatchPlugin } = require('@milencode/bundlewatch-webpack-plugin');

module.exports = {
  plugins: [
    bundleWatchPlugin({
      printReport: true,
      saveToGit: true, // Auto-enabled in CI
      compareAgainst: 'main',
    })
  ],
};
```

### Next.js

See the [Next.js guide](/next) for framework-specific setup.

## 2. First Build

Run your build command:

```bash
pnpm build
```

You'll see output like this:

```
📊 BundleWatch: Starting analysis...

┌─────────────────────────────────────────────────────────────┐
│ 📊 BundleWatch - First Run Detected                        │
├─────────────────────────────────────────────────────────────┤
│ No baseline found for comparison with 'main'               │
│                                                             │
│ 💡 To enable bundle size comparisons:                      │
│                                                             │
│   Quick start (recommended):                                │
│   $ npx bundlewatch backfill --last 10                     │
│                                                             │
│   Or backfill releases only:                                │
│   $ npx bundlewatch backfill --releases-only               │
│                                                             │
│ This build will be saved and used as a baseline            │
│ for future comparisons.                                     │
└─────────────────────────────────────────────────────────────┘

✅ Current build analyzed successfully
📈 Metrics saved to bundlewatch-data branch
```

This is expected! Your first build has no baseline to compare against.

## 3. Backfill Historical Data (Recommended)

To enable bundle size comparisons, backfill some history:

```bash
# Interactive mode (recommended)
npx bundlewatch backfill -i

# Or quick default (last 10 commits)
npx bundlewatch backfill
```

This takes ~5-10 minutes for 10 commits. See the [CLI guide](/cli) for more options.

**Why backfill?**
- Establishes a baseline for comparisons
- Shows trends over time
- Enables "bundle size increased by X%" reports

## 4. Next Build

After backfilling, your next build will show comparisons:

```bash
pnpm build
```

```
📊 Bundle Watch: Analysis complete

📦 Build Metrics
  Total size:     245.2 KB  (↓ 12.3 KB, -4.8%)
  Gzip size:      73.6 KB   (↓ 3.7 KB, -4.8%)
  Brotli size:    62.5 KB   (↓ 3.1 KB, -4.7%)
  Chunks:         4

📊 Comparison vs main
  ✅ Total size decreased by 12.3 KB (-4.8%)

Recommendations:
  • Great job! Bundle size decreased
```

## 5. CI/CD Integration

BundleWatch automatically detects CI environments and saves metrics.

### GitHub Actions Example

Add to your existing workflow:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Needed for git storage

      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm build  # BundleWatch runs automatically!
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

That's it! BundleWatch will:
- ✅ Analyze your bundle on every build
- ✅ Compare against the main branch
- ✅ Save metrics automatically in CI
- ✅ Show size changes in the build output

### One-Time Backfill in CI (Optional)

To backfill in GitHub Actions instead of locally:

1. Copy [backfill-workflow.yml](/examples/backfill-workflow.yml) to `.github/workflows/`
2. Go to Actions tab → "Backfill Bundle History"
3. Click "Run workflow" → select number of commits
4. Wait for completion

## Configuration Options

Both plugins support these options:

```ts
{
  // Enable/disable plugin
  enabled: true,

  // Print report to console
  printReport: true,

  // Save metrics to git (auto-enabled in CI)
  saveToGit: undefined,

  // Branch to compare against
  compareAgainst: 'main',

  // Fail build if size increases beyond threshold
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10, // percentage

  // Generate interactive dashboard
  generateDashboard: false,
  dashboardPath: './bundle-report',
}
```

## Next Steps

- [CLI Documentation](/cli) - Learn about backfilling and advanced commands
- [Vite Plugin](/vite) - Vite-specific configuration
- [Webpack Plugin](/webpack) - Webpack-specific configuration
- [Framework Recipes](/framework-recipes) - Next.js, Nuxt, SvelteKit, etc.
- [Deployment](/deployment) - CI/CD integration patterns
- [Architecture](/architecture) - How BundleWatch works under the hood

## Troubleshooting

### "No baseline found"

This is expected on first run! Run backfill:

```bash
npx bundlewatch backfill --last 10
```

### "fatal: couldn't find remote ref bundlewatch-data"

Normal on first run. The branch is created automatically when saving metrics.

### Metrics not saving in CI

Ensure:
1. `fetch-depth: 0` in checkout action (for git history)
2. `GITHUB_TOKEN` is passed to the build step
3. `saveToGit: true` is set (or running in CI where it auto-enables)

## CLI-Only Usage

If you prefer not to use a plugin:

```bash
# Install CLI
pnpm add -D @milencode/bundlewatch-cli

# Backfill history
npx bundlewatch backfill --last 10
```

See the [CLI guide](/cli) for more details.
