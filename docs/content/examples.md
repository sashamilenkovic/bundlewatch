---
title: Examples
description: Run the sample apps in this repo to see each integration in action.
---

# 🧪 Examples

Every package in this monorepo has a matching example under `examples/`. Each example is wired to the local workspace packages (`workspace:*`), so you can make changes and see them reflected immediately.

> Requirements: Node 24+, pnpm 9+, `pnpm install` run at the repo root.

## Vite SPA

- Path: `examples/vite-app`
- Command: `pnpm --filter example-vite dev` or `pnpm --filter example-vite build`
- Highlights:
  - Enables source maps (`build.sourcemap = true`) so the upcoming Vite parser can extract source-file insights.
  - Turns on dashboard generation (`bundle-report/index.html`) for quick inspections without Git storage.

Config snippet (`examples/vite-app/vite.config.ts`):

```ts
bundleWatch({
  generateDashboard: true,
  compareAgainst: 'main',
  analyzeSourceMaps: true,
});
```

## Webpack React app

- Path: `examples/webpack-app`
- Command: `pnpm --filter example-webpack-app build`
- Uses the parser-powered Webpack plugin with module extraction, dependency graphing, and optimization recommendations enabled.
- Generates a dashboard at `examples/webpack-app/bundle-report/index.html` that includes module/dependency tables.

## Next.js client bundle

- Path: `examples/next-app`
- Command: `pnpm --filter example-next-app build`
- Demonstrates adding `BundleWatchPlugin` inside `next.config.js` so only the client build triggers the analysis. Dashboards land in `./bundle-report`.
- Good reference for custom Webpack hooks (e.g., skipping server bundles).

## Nuxt (Vite) app

- Path: `examples/nuxt-app`
- Command: `pnpm --filter example-nuxt-app build`
- Shows how to inject the Vite plugin via `nuxt.config.ts → vite.plugins`.
- Useful for testing SSR/SSG projects with the Vite integration.

## SvelteKit

- Path: `examples/sveltekit-app`
- Command: `pnpm --filter example-sveltekit-app build`
- Adds BundleWatch to `kit.vite.plugins` so it runs during `svelte-kit build`.

## SolidStart

- Path: `examples/solidstart-app`
- Command: `pnpm --filter example-solidstart-app build`
- Wraps the plugin inside `defineConfig({ vite: { plugins: [...] } })`, mirroring the instructions in [Framework Recipes](./framework-recipes).

---

### Tips

- Clean up dashboards by running `rm -rf bundle-report` inside each example directory.
- Use `pnpm --filter <example> exec tree -L 2 bundle-report` to inspect generated assets in CI logs.
- Keep examples up to date when you change plugin options—this page should always mirror reality.
