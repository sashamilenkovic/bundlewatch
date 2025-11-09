---
title: Welcome
description: Understand what BundleWatch solves and how the docs are organized.
_path: /
---

# 👋 Welcome to BundleWatch Docs

BundleWatch tracks your bundle sizes over time, compares builds, and publishes visual dashboards directly inside your repository. Use these docs to understand the architecture, wire up the framework plugins, and operate the Git-backed storage branch.

## Quick links

| Guide | What you’ll find |
| ----- | ---------------- |
| [Getting Started](/getting-started) | Install the CLI or framework plugins, run first analyses, and generate static docs. |
| [Git Storage](/storage) | How metrics are written to the `bundlewatch-data` branch, GitHub permissions, and CI tips. |
| [Architecture](/architecture) | Deep dive into parsers, storage, comparison engine, and dashboard generation. |
| [Examples](/examples) | How to run the sample Vite, Nuxt, Next, Webpack, SvelteKit, and SolidStart apps in `/examples`. |
| [Framework Recipes](/framework-recipes) | Drop-in snippets for Nuxt, SvelteKit, SolidStart, Astro, Remix, and more. |

> 💡 Planning to visualize metrics? Enable `generateDashboard` in the Vite/Webpack plugins and inspect the HTML report saved under `bundle-report/`.

## Choose your path

1. **Front-end builds** → Start with [Vite](/vite) or [Webpack](/webpack) depending on your bundler.
2. **React meta-frameworks** → Jump to [Next.js](/next) or the recipes for Nuxt/SvelteKit/SolidStart.
3. **Operational work** → Read [Deployment](/deployment) (Cloudflare Worker + GitHub Actions) and [Examples](/examples) to replicate CI flows locally.

## Why a docs site?

The README grew unwieldy as BundleWatch evolved. Nuxt Content gives us:

1. Focused guides per integration instead of one mega README.
2. Versioned, long-form explanations that live with the code.
3. Static generation so the entire site deploys as pure assets (Workers, GitHub Pages, Netlify, etc.).

## Help improve the docs

1. Install dependencies once at the repo root (this also installs the docs workspace):

   ```bash
   pnpm install
   ```

2. Start the docs dev server for instant hot reload:

   ```bash
   pnpm --filter @bundlewatch/docs dev
   ```

3. Edit or add Markdown in `docs/content`. Frontmatter `title` + `description` drive the sidebar automatically.
4. Run `pnpm docs:generate` to ensure the static output builds before sending a PR.

Happy shipping! 🚀
