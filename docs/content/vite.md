---
title: Vite Plugin
description: Wire BundleWatch into Vite or Rollup builds.
---

# ⚡ Vite Plugin

Package: `@milencode/bundlewatch-vite-plugin`

The current Vite plugin relies on the legacy filesystem collector (`MetricsCollector`) inside the `closeBundle` hook. A parser-driven version is in progress; until then you still get Git storage, comparisons, and dashboards.

## Install

```bash
pnpm add -D @milencode/bundlewatch-vite-plugin
```

## Configure

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { bundleWatch } from '@milencode/bundlewatch-vite-plugin';

export default defineConfig({
  plugins: [
    bundleWatch({
      printReport: true,
      compareAgainst: 'main',
      saveToGit: process.env.CI === 'true',
      generateDashboard: true,
    }),
  ],
});
```

> Framework-specific examples (Nuxt, SvelteKit, SolidStart, Astro) live in [Framework Recipes](./framework-recipes).

### Reference implementation

See `examples/vite-app` for a complete setup with source maps, dashboard generation, and CI-ready defaults:

```bash
pnpm --filter example-vite build
open examples/vite-app/bundle-report/index.html
```

### Options recap

| Option               | Default         | Notes |
| -------------------- | --------------- | ----- |
| `enabled`            | `true`          | Skip the plugin entirely if `false`. |
| `compareAgainst`     | `main`          | Loads metrics from Git storage and runs `compareMetrics`. |
| `saveToGit`          | `CI ? true : false` | Persists metrics to `bundlewatch-data` branch. |
| `generateDashboard`  | `false`         | Creates `bundle-report/index.html` with a treemap. |
| `failOnSizeIncrease` | `false`         | Throws if `totalSize` grows beyond `sizeIncreaseThreshold`. |

### Output directory

BundleWatch resolves `config.build.outDir` and scans that directory after the build finishes. If you customise the output directory (e.g., `build: { outDir: 'app-dist' }`) the plugin picks it up automatically.

### GitHub Actions tips

```
permissions:
  contents: write
steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0
  - uses: actions/setup-node@v4
    with:
      node-version: 24
  - uses: pnpm/action-setup@v2
    with:
      version: 9
  - run: pnpm install
  - run: pnpm build
```

### Parser upgrade status

`packages/parsers/src/vite.ts` already implements `createAnalyzerState`, `collectModuleInfo`, and `analyzeBundle`. Once the plugin swaps `closeBundle` for `generateBundle` it will:

1. Capture module info via Vite’s `moduleParsed` hook.
2. Call `analyzeBundle` with the `OutputBundle` object.
3. Gain module-level metrics, dependency graphs, and source-file stats—unlocking the enhanced dashboard.

Track progress in the repository’s issue tracker (`vite-parser-migration`).
