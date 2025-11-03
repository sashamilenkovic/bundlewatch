# @bundlewatch/webpack-plugin

Bundle Watch plugin for Webpack.

## Features

- 📊 **Bundle Analysis** - Track sizes, compressions, build time
- 📈 **Historical Tracking** - Compare against previous builds
- 🚀 **CI/CD Ready** - Works with GitHub Actions
- ⚡ **Zero Config** - Works out of the box
- 🎯 **Size Budgets** - Fail builds on size increases

## Installation

```bash
pnpm add -D @bundlewatch/webpack-plugin
```

## Usage

### Webpack 5

```javascript
// webpack.config.js
const { BundleWatchPlugin } = require('@bundlewatch/webpack-plugin');

module.exports = {
  // ... your config
  plugins: [
    new BundleWatchPlugin({
      enabled: true,
      printReport: true,
      saveToGit: process.env.CI === 'true',
    }),
  ],
};
```

### ESM / TypeScript

```typescript
// webpack.config.ts
import { BundleWatchPlugin } from '@bundlewatch/webpack-plugin';

export default {
  plugins: [
    new BundleWatchPlugin(),
  ],
};
```

## Configuration

```typescript
interface WebpackBundleWatchOptions {
  /** Enable/disable the plugin */
  enabled?: boolean;
  
  /** Print report to console after build */
  printReport?: boolean;
  
  /** Save metrics to git storage */
  saveToGit?: boolean;
  
  /** Compare against target branch */
  compareAgainst?: string;
  
  /** Fail build if size increases beyond threshold */
  failOnSizeIncrease?: boolean;
  
  /** Size increase threshold (percentage) */
  sizeIncreaseThreshold?: number;
}
```

## Example Output

```
📊 Bundle Watch Report
══════════════════════════════════════════════════

Total Size:    245.5 KB
Gzipped:       89.2 KB
Brotli:        75.8 KB
Build Time:    3.24s
Chunks:        3

By Type:
  JavaScript:  185.3 KB
  CSS:         45.2 KB
  Images:      15.0 KB

══════════════════════════════════════════════════
```

## CI/CD Integration

```yaml
# .github/workflows/build.yml
- name: Build with Webpack
  run: npm run build
  env:
    CI: true
```

## Examples

See [examples/webpack-app](../../examples/webpack-app) for a complete example.

## License

MIT

