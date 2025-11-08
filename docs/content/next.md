---
title: Next.js Plugin
description: Add BundleWatch to Next.js builds with per-route metrics.
---

# ▲ Next.js Plugin

Package: `@milencode/bundlewatch-next-plugin`

This wrapper hooks into Next.js’ Webpack config to run BundleWatch after client builds complete. It currently reuses the core collector (like the CLI), but still provides per-route stats via `build-manifest.json`.

## Install

```bash
pnpm add -D @milencode/bundlewatch-next-plugin
```

## Configure

```js
// next.config.js
const { withBundleWatch } = require('@milencode/bundlewatch-next-plugin');

module.exports = withBundleWatch(
  {
    reactStrictMode: true,
    experimental: { instrumentationHook: true },
  },
  {
    saveToGit: process.env.CI === 'true',
    compareAgainst: 'main',
    perRoute: true,
    budgets: {
      '/': { maxSize: 350 * 1024 },
      '/dashboard': { maxGzipSize: 150 * 1024 },
    },
  },
);
```

### What it does

- Wraps your exported config and injects a Webpack plugin that runs after the client bundle finishes.
- Calls `collectMetrics` on `.next/static` to gather bundle sizes.
- Optionally prints a per-route table by reading `.next/build-manifest.json`.
- Uses `GitStorage` + `compareMetrics` just like the other integrations.

### Route budgets

Budgets are checked per pattern. If a route exceeds `maxSize` or `maxGzipSize`, a warning prints (and the build fails if `failOnSizeIncrease` is set).

```js
budgets: {
  '/blog/*': { maxSize: 400 * 1024 },
}
```

### Upcoming improvements

Once the Webpack plugin exposes more parser data, the Next wrapper will piggyback on it to provide module-level insights and enhanced dashboards automatically. Watch the “next-plugin parser parity” issue for status.

### Example project

`examples/next-app` shows the simplest integration—only the client build runs BundleWatch, and dashboards are stored under `bundle-report/`:

```bash
pnpm --filter example-next-app build
open examples/next-app/bundle-report/index.html
```
