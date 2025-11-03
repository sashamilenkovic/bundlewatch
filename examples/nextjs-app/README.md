# Next.js + Bundle Watch Example

Example Next.js app with Bundle Watch integration using App Router.

## Features

- ✅ Next.js 15 with App Router
- ✅ Bundle Watch per-route analysis
- ✅ Route-specific budgets
- ✅ TypeScript
- ✅ Tailwind CSS

## Getting Started

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build with Bundle Watch
pnpm build
```

## Bundle Watch Configuration

See `next.config.ts` for configuration:

```typescript
export default withBundleWatch(nextConfig, {
  enabled: true,
  printReport: true,
  perRoute: true,
  budgets: {
    '/': { maxSize: 500 * 1024 },
  },
});
```

## Routes

- `/` - Home page
- `/about` - About page
- `/blog` - Blog listing

## Bundle Analysis

After building, you'll see per-route analysis:

```
📊 Bundle Watch Report - Per Route
══════════════════════════════════════════════════

/ (Home)
  Bundle: 125 KB

/about
  Bundle: 98 KB

/blog
  Bundle: 156 KB
```

## Learn More

- [Bundle Watch Documentation](../../README.md)
- [Next.js Documentation](https://nextjs.org/docs)

