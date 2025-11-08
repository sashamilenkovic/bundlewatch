interface Env {
  ASSETS: Fetcher;
  FALLBACK_DOCUMENT?: string;
}

const DEFAULT_DOCUMENT = '/index.html';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // First attempt: serve the exact asset (Workers assets handles caching for us)
    const primaryResponse = await env.ASSETS.fetch(request);
    if (primaryResponse.status !== 404) {
      return primaryResponse;
    }

    const url = new URL(request.url);

    // Second attempt: directory-style fallback (/docs -> /docs/index.html)
    const dirFallback = new URL(
      url.pathname.endsWith('/') ? `${url.pathname}index.html` : `${url.pathname}/index.html`,
      url.origin,
    );

    const dirResponse = await env.ASSETS.fetch(
      new Request(dirFallback.toString(), request),
    );
    if (dirResponse.status !== 404) {
      return dirResponse;
    }

    // Final attempt: global fallback document (SPA routing)
    const fallback = env.FALLBACK_DOCUMENT || DEFAULT_DOCUMENT;
    const fallbackUrl = new URL(fallback, url.origin);

    return env.ASSETS.fetch(
      new Request(fallbackUrl.toString(), request),
    );
  },
};
