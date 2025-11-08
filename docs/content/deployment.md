---
title: Deployment
description: Ship the docs to Cloudflare Workers (Pages has been sunset).
---

# ☁️ Deployment (Cloudflare Workers)

Cloudflare Pages is deprecated (Nov 2025), so we deploy the statically generated docs via a Worker.

## 1. Generate the site

```bash
pnpm --filter @bundlewatch/docs generate
```

Output lives in `docs/.output/public`.

## 2. Deploy Worker + Assets

Cloudflare Workers now handle static assets directly—no R2 bucket required. The repository already includes a Worker project under `docs/worker/`:

- `docs/worker/src/index.ts` – Worker entry point (TypeScript).
- `docs/worker/wrangler.toml` – Wrangler configuration/bucket binding.

The handler uses the new Assets binding to serve files and fall back to `index.html` for SPA routes:

```ts
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const keys = buildCandidateKeys(url.pathname, 'index.html');

    for (const key of keys) {
      const object = await env.BUNDLEWATCH_DOCS.get(key);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('cache-control', key.endsWith('.html')
          ? 'public, max-age=300, must-revalidate'
          : 'public, max-age=31536000, immutable');

        return new Response(request.method === 'HEAD' ? null : object.body, { headers });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
```

`docs/worker/wrangler.toml` binds the generated assets folder:

```toml
name = "bundlewatch-docs"
main = "src/index.ts"
compatibility_date = "2024-11-25"

[assets]
directory = "../.output/public"
binding = "ASSETS"
```

## 3. Deploy

```bash
cd docs/worker
wrangler deploy
```

Set up a custom domain via Cloudflare Workers routes.

## 4. Automate via GitHub Actions

The repo includes `.github/workflows/docs.yml`, which:

1. Checks out `main`.
2. Installs dependencies with pnpm.
3. Runs `pnpm docs:generate`.
4. Calls `wrangler deploy` from `docs/worker`.

Provide two repository secrets so the job can authenticate with Cloudflare:

- `CF_API_TOKEN` – token with “Workers Scripts:Edit” + “Workers KV Storage:Edit” (assets) permissions.
- `CF_ACCOUNT_ID` – your account identifier.

Trigger the workflow manually (`workflow_dispatch`) or on every push to `main`.

## Alternative: Vercel

If you prefer Vercel, keep `pnpm docs:generate` and upload `.output/public`. Vercel Edge Functions can also serve the static assets, but Cloudflare Workers keeps everything in one ecosystem.
