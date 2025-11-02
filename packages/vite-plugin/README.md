# @bundle-watch/vite-plugin

Vite plugin for automatic bundle size analysis and tracking.

## Installation

```bash
pnpm add -D @bundle-watch/vite-plugin
```

## Usage

Add to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { bundleWatch } from '@bundle-watch/vite-plugin';

export default defineConfig({
  plugins: [
    bundleWatch({
      // Options (all optional)
      enabled: true,
      printReport: true,
      saveToGit: true, // Auto-enabled in CI
      compareAgainst: 'main',
      failOnSizeIncrease: false,
      sizeIncreaseThreshold: 10,
    }),
  ],
});
```

## Options

- **`enabled`**: Enable/disable the plugin (default: `true`)
- **`printReport`**: Print analysis report to console (default: `true`)
- **`saveToGit`**: Save metrics to git branch (default: `true` in CI, `false` locally)
- **`compareAgainst`**: Branch to compare against (default: `'main'`)
- **`failOnSizeIncrease`**: Fail build if size exceeds threshold (default: `false`)
- **`sizeIncreaseThreshold`**: Size increase threshold percentage (default: `10`)

## Output

After each build, you'll see a report like:

```
📊 Bundle Watch Report
══════════════════════════════════════════════════

Total Size:    245.5 KB
Gzipped:       89.2 KB
Brotli:        78.1 KB
Build Time:    3.24s
Chunks:        3

By Type:
  JavaScript:  185.3 KB
  CSS:         45.2 KB
  Images:      15.0 KB
  Fonts:       0 B
  Other:       0 B

──────────────────────────────────────────────────
Comparison vs main:

📉 Bundle is 12.5 KB (4.8%) smaller than main

💡 Insights:
  ✅ Great job! Bundle size reduced by 4.8%
  📦 index.js grew by 3.2 KB (7.2%)

══════════════════════════════════════════════════
```

## CI Integration

The plugin automatically detects CI environments and saves metrics to a git branch for historical tracking.

See the main [@bundle-watch/core](../core) documentation for more details.

