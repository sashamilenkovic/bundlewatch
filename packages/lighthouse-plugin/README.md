# @bundlewatch/lighthouse-plugin

Optional Lighthouse integration for Bundle Watch. Correlate bundle size changes with real-world performance metrics.

## Features

- 🔦 **Lighthouse Audits**: Run automated performance audits
- 📊 **Performance Correlation**: See how bundle size affects Lighthouse scores
- 🎯 **Core Web Vitals**: Track LCP, FCP, TBT, and CLS
- 💡 **Smart Insights**: Get actionable recommendations

## Installation

```bash
pnpm add -D @bundlewatch/lighthouse-plugin
```

**Note**: This plugin requires Chrome/Chromium to be installed.

## Usage

### With Vite Plugin

```typescript
import { defineConfig } from 'vite';
import { bundleWatch } from '@bundlewatch/vite-plugin';
import { runLighthouse, correlateBundleAndPerformance } from '@bundlewatch/lighthouse-plugin';

export default defineConfig({
  plugins: [
    bundleWatch({
      enabled: true,
      async onMetricsCollected(metrics, baseline) {
        // Start your preview server first
        const lighthouse = await runLighthouse({
          url: 'http://localhost:4173',
          headless: true,
        });

        const correlation = correlateBundleAndPerformance(
          metrics,
          baseline,
          lighthouse
        );

        console.log(correlation.insights.join('\n'));
      },
    }),
  ],
});
```

### With CLI

```typescript
import { collectMetrics } from '@bundlewatch/core';
import { runLighthouse, formatLighthouseReport } from '@bundlewatch/lighthouse-plugin';

// Collect bundle metrics
const metrics = await collectMetrics({
  outputDir: './dist',
  branch: 'main',
});

// Run Lighthouse audit
const lighthouse = await runLighthouse({
  url: 'http://localhost:4173',
});

// Print report
console.log(formatLighthouseReport(lighthouse));
```

## API

### `runLighthouse(options)`

Runs a Lighthouse audit on a URL.

**Options:**
- `url` (string): URL to test (default: `http://localhost:4173`)
- `config` (object): Lighthouse config overrides
- `chromeFlags` (string[]): Chrome flags to pass
- `headless` (boolean): Run Chrome headless (default: `true`)

**Returns:** `Promise<LighthouseMetrics>`

### `correlateBundleAndPerformance(current, baseline, lighthouse, baselineLighthouse?)`

Correlates bundle size changes with Lighthouse performance metrics.

**Returns:** `CorrelationResult` with insights like:
- "Bundle size increased by 15.2% and Performance score dropped 8 points"
- "LCP is 3.2s (target: <2.5s). Consider code splitting or lazy loading."

### `formatLighthouseReport(metrics, delta?)`

Formats Lighthouse metrics for console output.

## Example Output

```
🔦 Lighthouse Performance Metrics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Performance:     87/100 (-5)
Accessibility:   95/100
Best Practices:  92/100
SEO:             100/100

Core Web Vitals:
  LCP:  2.1s (+0.3s)
  FCP:  1.2s (+0.1s)
  TBT:  150ms (+50ms)
  CLS:  0.05

⚠️  Bundle size increased by 12.3% and Performance score dropped 5 points
🟡 Performance score is 87/100. There's room for improvement.
```

## License

MIT

