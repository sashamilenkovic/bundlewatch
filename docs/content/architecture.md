---
title: Architecture
description: Understand how parsers, plugins, storage, and dashboards fit together.
---

# 🏗️ Architecture

BundleWatch is a pnpm monorepo with small, composable packages. Everything shares the same `BuildMetrics` type from `packages/core`, so plugins and the CLI can swap data freely.

## Package graph

```
@milencode/bundlewatch-core (types + collectors + comparison + git storage)
        ↓
        ├─ @milencode/bundlewatch-parsers    # ingest bundler outputs
        ├─ @milencode/bundlewatch-vite-plugin
        ├─ @milencode/bundlewatch-webpack-plugin
        ├─ @milencode/bundlewatch-next-plugin
        ├─ @milencode/bundlewatch-cli
        └─ @milencode/bundlewatch-dashboard (HTML output helpers)
```

- **Core** exposes `collectMetrics`, `compareMetrics`, `GitStorage`, and `ReportGenerator`.
- **Parsers** convert native bundler stats (Webpack stats, Vite/Rollup bundles) to `BuildMetrics` and also generate enhanced dashboards.
- **Plugins / CLI** decide *when* to collect metrics (after a build, after `vite build`, etc.) and how to persist them.

## Parser pivot

Originally every plugin walked the output directory, recompressed assets, and guesstimated dependency graphs. The parser packages now tap into the bundler’s own metadata so the work happens in-memory:

| Approach              | What Happens                                         | Time |
| --------------------- | ---------------------------------------------------- | ---- |
| Legacy collector      | Read every file → gzip → brotli → stitch metrics     | ~2 s |
| Parser (current goal) | Consume stats/bundle JSON in memory → map to metrics | ~50 ms |

The Webpack plugin already uses `parseWebpackStats`. The Vite plugin still relies on `MetricsCollector` and will switch once `parseViteBundle` lands.

## Git storage layer

`GitStorage` writes metrics to an orphan branch (default `bundlewatch-data`). Each branch gets its own folder:

```
data/
  main/
    1730939472000-abc1234.json
    latest.json
  feature/parser-refactor/
    1731021234000-def5678.json
```

During CI the plugin/CLI saves the current metrics and optionally compares against another branch before logging a report or failing budgets.

## Dashboards & insights

- `packages/parsers/src/dashboard.ts` builds a treemap from either detailed dependency metrics or the bundle list.
- Webpack plugin ships an “enhanced dashboard” (modules, dependencies, source-file stats) because the parser returns all that info.
- Vite/Next/CLI still render a simpler treemap until they switch to parser-derived data.

## Roadmap snapshot

1. **Vite parser integration** – wire `createAnalyzerState`/`collectModuleInfo`/`analyzeBundle` into the Vite plugin’s `generateBundle` hook.
2. **CLI / Next** – let these consume parser outputs or accept pre-generated stats.
3. **Docs** – keep this site in sync with code changes by updating Markdown alongside Pull Requests.
