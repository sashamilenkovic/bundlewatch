# Webpack + Bundle Watch Example

Example Webpack app with Bundle Watch integration.

## Features

- ✅ Webpack 5
- ✅ Bundle Watch plugin
- ✅ React 19
- ✅ TypeScript
- ✅ Hot Module Replacement (HMR)

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

See `webpack.config.js` for configuration:

```javascript
plugins: [
  new BundleWatchPlugin({
    enabled: true,
    printReport: true,
  }),
]
```

## Bundle Analysis

After building, you'll see bundle metrics:

```
📊 Bundle Watch Report
══════════════════════════════════════════════════

Total Size:    145.2 KB
Gzipped:       45.8 KB
Brotli:        38.9 KB
Build Time:    2.1s
Chunks:        2
```

## Learn More

- [Bundle Watch Documentation](../../README.md)
- [Webpack Plugin Guide](../../packages/webpack-plugin/README.md)

