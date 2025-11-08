# BundleWatch Docs

Nuxt 4 + Nuxt Content site that powers the BundleWatch documentation. Ships as an SSG so it can deploy to any static host.

## Scripts

```bash
pnpm --filter @bundlewatch/docs dev        # local dev server
pnpm --filter @bundlewatch/docs build      # production build
pnpm --filter @bundlewatch/docs generate   # prerendered static output (.output/public)
```

## Content authoring

- Markdown lives in `docs/content`.
- Frontmatter `title` + `description` feed the sidebar navigation automatically.
- Use fenced code blocks with language hints for syntax highlighting.

## Deployment

Run `pnpm --filter @bundlewatch/docs generate` in CI and deploy the `.output/public` directory to GitHub Pages, Netlify, or Vercel static hosting.
