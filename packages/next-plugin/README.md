# @bundlewatch/next-plugin

Bundle Watch plugin for Next.js with per-route analysis.

## Features

- 🎯 **Per-Route Analysis** - Track each page/route separately
- 📊 **App Router Support** - Works with Next.js 13+ App Router
- 📄 **Pages Router Support** - Works with traditional Pages Router
- 🔍 **Route-level Budgets** - Set size limits per route
- 📈 **Historical Tracking** - See how routes evolve over time
- 🚀 **Edge/Server Bundles** - Track both client and server bundles

## Installation

```bash
pnpm add -D @bundlewatch/next-plugin
```

## Usage

### Next.js 13+ (App Router)

```javascript
// next.config.js
import { withBundleWatch } from '@bundlewatch/next-plugin';

const nextConfig = {
  // your config
};

export default withBundleWatch(nextConfig, {
  enabled: true,
  printReport: true,
  saveToGit: process.env.CI === 'true',
  perRoute: true, // Enable per-route analysis
});
```

### Next.js 12 (Pages Router)

```javascript
// next.config.js
const { withBundleWatch } = require('@bundlewatch/next-plugin');

module.exports = withBundleWatch({
  // your config
}, {
  enabled: true,
  printReport: true,
  perRoute: true,
});
```

## Configuration

```typescript
interface NextBundleWatchOptions {
  /** Enable/disable the plugin */
  enabled?: boolean;
  
  /** Print report to console after build */
  printReport?: boolean;
  
  /** Save metrics to git storage */
  saveToGit?: boolean;
  
  /** Enable per-route analysis */
  perRoute?: boolean;
  
  /** Compare against target branch */
  compareAgainst?: string;
  
  /** Fail build if size increases beyond threshold */
  failOnSizeIncrease?: boolean;
  
  /** Size increase threshold (percentage) */
  sizeIncreaseThreshold?: number;
  
  /** Route-specific budgets */
  budgets?: {
    [route: string]: {
      maxSize?: number;
      maxGzipSize?: number;
    };
  };
}
```

## Per-Route Analysis

The plugin automatically detects and analyzes each route:

```
📊 Bundle Watch Report - Per Route
══════════════════════════════════════════════════

/ (Home)
  Client:  125 KB (45 KB gzipped)
  Server:  89 KB
  
/about
  Client:  98 KB (38 KB gzipped)
  Server:  45 KB
  
/blog/[slug]
  Client:  156 KB (52 KB gzipped)
  Server:  67 KB

══════════════════════════════════════════════════
```

## Route Budgets

Set size limits per route:

```javascript
withBundleWatch(nextConfig, {
  budgets: {
    '/': {
      maxSize: 200 * 1024, // 200 KB
      maxGzipSize: 70 * 1024, // 70 KB
    },
    '/blog/*': {
      maxSize: 250 * 1024,
    },
  },
  failOnSizeIncrease: true,
});
```

## Dashboard Integration

Generate interactive dashboard with per-route views:

```bash
# After build
npm run build

# Generate dashboard
npx bundlewatch export .next --output ./bundle-report
```

The dashboard will show:
- Route-by-route breakdown
- Shared chunks vs route-specific
- Historical trends per route
- Bundle composition

## App Router vs Pages Router

### App Router (Next.js 13+)
- Analyzes route segments
- Tracks Server Components separately
- Shows layout vs page bundles
- Edge function detection

### Pages Router (Next.js 12)
- Analyzes each page
- Tracks API routes separately
- Shows getServerSideProps impact
- Custom _app/_document analysis

## CI/CD Integration

```yaml
# .github/workflows/nextjs.yml
- name: Build Next.js app
  run: npm run build
  env:
    CI: true

- name: Generate dashboard
  run: npx bundlewatch export .next

- name: Deploy dashboard
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./bundle-report
```

## Advanced Usage

### Custom Output Directory

```javascript
withBundleWatch(nextConfig, {
  outputDir: '.next', // Custom Next.js output dir
});
```

### Server Components Analysis

```javascript
withBundleWatch(nextConfig, {
  analyzeServer: true, // Include server components
  analyzeEdge: true,   // Include edge functions
});
```

## Examples

See working examples:
- [App Router Example](../../examples/nextjs-app)
- [Pages Router Example](../../examples/nextjs-pages)

## License

MIT

