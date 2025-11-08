---
title: Webpack Plugin
description: Parser-powered integration for Webpack 5 projects.
---

# 🧱 Webpack Plugin

Package: `@milencode/bundlewatch-webpack-plugin`

The Webpack plugin already uses the new parser stack, so metrics are derived directly from `stats.toJson()`—no filesystem scanning required.

## Install

```bash
pnpm add -D @milencode/bundlewatch-webpack-plugin
```

## Configure

```js
// webpack.config.js
const { BundleWatchPlugin } = require('@milencode/bundlewatch-webpack-plugin');

module.exports = {
  // ...your existing config
  plugins: [
    new BundleWatchPlugin({
      compareAgainst: 'main',
      saveToGit: process.env.CI === 'true',
      generateDashboard: true,
      extractModules: true,
      buildDependencyGraph: true,
    }),
  ],
};
```

### How it works

1. On `compiler.hooks.compile` the plugin records a start time.
2. On `compiler.hooks.done` it calls `stats.toJson({ assets: true, chunks: true, modules: true })`.
3. `parseWebpackStats` (packages/parsers/src/webpack.ts) converts that object into `BuildMetrics`, including module + dependency insights.
4. Optional: `generateEnhancedDashboard` renders a D3 treemap + dependency tables and saves them to `bundle-report/index.html`.

### Useful options

| Option                  | Default | Purpose |
| ----------------------- | ------- | ------- |
| `extractModules`        | `true`  | Include module-level metrics (needed for dependency tables). |
| `buildDependencyGraph`  | `true`  | Runs graph + circular dependency detection. |
| `generateRecommendations` | `true` | Emits optimization hints when duplicate packages or huge deps are detected. |
| `dashboardPath`         | `./bundle-report` | Output directory for HTML dashboard. |

### Comparing builds

If `compareAgainst` is set (default `main`), the plugin loads `data/<branch>/latest.json` from the Git storage branch, runs `compareMetrics`, and prints diff summaries + recommendations to the console.

### CI advice

- Ensure the CI runner checks out the repo with `fetch-depth: 0` so the orphan branch can be pushed.
- Provide `contents: write` permission so GitHub Actions can push `bundlewatch-data` updates.
- If your build outputs both client and server bundles, instantiate the plugin twice—once for each compiler—to collect metrics per target.

### Dashboards

The enhanced dashboard shows:

- Treemap sized by dependency total size.
- Table of top dependencies with gzip/brotli estimates.
- Optional source-file table (if source maps are available and `analyzeSourceMaps` is enabled).

Feel free to copy the generated `bundle-report/index.html` into an artifact so your team can inspect it from CI.

### Example project

Try `examples/webpack-app` for a minimal React + Webpack 5 setup:

```bash
pnpm --filter example-webpack-app build
open examples/webpack-app/bundle-report/index.html
```

That example enables module extraction, dependency graphing, and dashboard generation so you can inspect the enhanced output end to end.
