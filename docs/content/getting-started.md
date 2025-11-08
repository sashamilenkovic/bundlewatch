---
title: Getting Started
description: Install the docs workspace and connect BundleWatch to your builds.
---

# 🚀 Getting Started

This guide walks you through spinning up the docs workspace plus integrating BundleWatch into a project.

## Install dependencies

The docs live inside the main pnpm workspace, so run the standard install from the repo root:

```bash
pnpm install
```

> This installs Nuxt + @nuxt/content alongside the existing packages. Use Node 20.10+ (we run on Node 24 in CI).

## Run the docs locally

```bash
pnpm --filter @bundlewatch/docs dev
```

- Dev server: <http://localhost:3000>
- Content changes hot-reload instantly thanks to Nuxt Content.

## Add BundleWatch to a Vite app

```bash
pnpm add -D @milencode/bundlewatch-vite-plugin
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { bundleWatch } from '@milencode/bundlewatch-vite-plugin';

export default defineConfig({
  plugins: [bundleWatch({ printReport: true })],
});
```

## CLI workflow

```bash
npx @milencode/bundlewatch-cli analyze --output dist --save
```

This command analyzes the `dist` directory, prints a console report, and writes metrics to the Git storage branch.

## Static generation

The docs ship as a statically generated site:

```bash
pnpm --filter @bundlewatch/docs generate
```

The output ends up in `docs/.output/public` ready to deploy to GitHub Pages or any static host.
