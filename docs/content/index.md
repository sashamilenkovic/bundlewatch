---
title: Welcome
description: Understand what BundleWatch solves and how the docs are organized.
_path: /
---

# 👋 Welcome to BundleWatch Docs

BundleWatch tracks your bundle sizes over time, compares builds, and publishes visual dashboards directly inside your repository. These docs explain how the system fits together, how to plug it into different bundlers, and how to work with the Git-backed storage layer.

## What's inside

- **Getting Started** covers installing the CLI or framework plugins and wiring BundleWatch into CI/CD.
- **Git Storage** explains how metrics are written to an orphan branch so you can diff trends without provisioning a database.
- Deep-dives for the Vite, Webpack, and Next.js plugins will land soon. Each section maps to the packages that live in this monorepo (`packages/*`).

## Why a docs site?

The README grew unwieldy while the architecture evolved. A Nuxt Content site lets us:

1. Ship focused guides per integration.
2. Keep long-form explanations versioned with the rest of the repo.
3. Statically generate the entire site (SSG) so it can deploy anywhere (GitHub Pages, Netlify, Vercel, etc.).

## Contributing to the docs

1. Run `pnpm install` at the repo root (this also installs the docs workspace).
2. Start the docs dev server:

```bash
pnpm --filter @bundlewatch/docs dev
```

3. Edit or create Markdown files in `docs/content`. The sidebar automatically reflects frontmatter titles and descriptions.
4. Commit Markdown + any component/layout tweaks.

Happy shipping! 🚀
