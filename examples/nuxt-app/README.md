# Nuxt 3 + Bundle Watch Example

Example Nuxt 3 app with Bundle Watch integration via Vite plugin.

## Features

- ✅ Nuxt 3 (latest)
- ✅ Bundle Watch via Vite plugin
- ✅ TypeScript
- ✅ Tailwind CSS (Nuxt module)
- ✅ File-based routing

## Getting Started

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build with Bundle Watch
pnpm build

# Preview production build
pnpm preview
```

## Bundle Watch Configuration

See `nuxt.config.ts` for configuration:

```typescript
export default defineNuxtConfig({
  vite: {
    plugins: [
      bundleWatch({
        enabled: true,
        printReport: true,
      }),
    ],
  },
});
```

## Routes

- `/` - Home page
- `/about` - About page
- `/blog` - Blog listing

## Bundle Analysis

After building, you'll see bundle metrics:

```
📊 Bundle Watch Report
══════════════════════════════════════════════════

Total Size:    245.5 KB
Gzipped:       89.2 KB
Brotli:        78.1 KB
Build Time:    3.24s
Chunks:        12
```

## Why This Works

Nuxt 3 uses Vite under the hood, so our `@bundlewatch/vite-plugin` integrates seamlessly! No special Nuxt plugin needed.

## Learn More

- [Bundle Watch Documentation](../../README.md)
- [Nuxt Documentation](https://nuxt.com/docs)
- [Vite Plugin Guide](../../packages/vite-plugin/README.md)

