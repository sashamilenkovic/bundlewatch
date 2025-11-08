# 📦 BundleWatch

> Code Coverage for Bundle Size - Track your build metrics over time

⚠️ **Experimental**: This project is in active development. APIs may change. Use at your own risk.

An open-source dev tool that analyzes builds, tracks metrics over time, and displays results directly in your repository. Provides instant visibility into build performance with historical trends and comparisons.

[![npm version](https://img.shields.io/npm/v/@milencode/bundlewatch-core.svg)](https://www.npmjs.com/package/@milencode/bundlewatch-core)
[![codecov](https://codecov.io/gh/sashamilenkovic/bundlewatch/branch/main/graph/badge.svg)](https://codecov.io/gh/sashamilenkovic/bundlewatch)
[![CI](https://github.com/sashamilenkovic/bundlewatch/workflows/CI/badge.svg)](https://github.com/sashamilenkovic/bundlewatch/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **📊 Instant Visibility** - See bundle size and performance metrics in your README
- **📈 Trend Tracking** - Compare current build against previous commits and main branch
- **🤖 CI-Native** - Designed for GitHub Actions and CI environments
- **⚡ Zero Config** - Works out of the box with Vite projects
- **🔍 Historical Context** - Track how your bundle evolves over time
- **🎯 Framework Agnostic** - Core package works with any build tool
- **🔌 Plugin Architecture** - Optional Vite plugin for seamless integration
- **🧪 Fully Tested** - 31 E2E tests covering all integrations
- **🎨 Functional** - Built with composition over classes

## 🚀 Quick Start

### Vite Plugin (Recommended)

```bash
pnpm add -D @milencode/bundlewatch-vite-plugin
```

Add to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import { bundleWatch } from "@milencode/bundlewatch-vite-plugin";

export default defineConfig({
  plugins: [
    bundleWatch(), // That's it! 🎉
  ],
});
```

Build your project:

```bash
npm run build
```

You'll see a detailed report:

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

══════════════════════════════════════════════════
```

### CLI Usage

```bash
# Analyze build output
npx @milencode/bundlewatch-cli analyze

# Compare against main branch
npx @milencode/bundlewatch-cli compare main

# Generate markdown report
npx @milencode/bundlewatch-cli report --format markdown
```

## 📦 Packages

This monorepo contains:

| Package                                                                  | Description                            | Version |
| ------------------------------------------------------------------------ | -------------------------------------- | ------- |
| [@milencode/bundlewatch-core](./packages/core)                           | Framework-agnostic core engine         | 0.1.0   |
| [@milencode/bundlewatch-vite-plugin](./packages/vite-plugin)             | Vite plugin integration                | 0.1.0   |
| [@milencode/bundlewatch-next-plugin](./packages/next-plugin)             | Next.js plugin with per-route analysis | 0.1.0   |
| [@milencode/bundlewatch-webpack-plugin](./packages/webpack-plugin)       | Webpack 5 plugin integration           | 0.1.0   |
| [@milencode/bundlewatch-dashboard](./packages/dashboard)                 | Interactive dashboard & visualization  | 0.1.0   |
| [@milencode/bundlewatch-cli](./packages/cli)                             | Command-line interface                 | 0.1.0   |
| [@milencode/bundlewatch-lighthouse-plugin](./packages/lighthouse-plugin) | Lighthouse integration                 | 0.1.0   |

## 🎯 Architecture

Built with **functional composition** for better testability and maintainability:

```typescript
// Pure functions, not classes!
import {
  collectMetrics,
  compareMetrics,
  generateReport,
} from "@milencode/bundlewatch-core";

const metrics = await collectMetrics({ outputDir: "./dist" });
const comparison = compareMetrics(current, baseline);
const report = generateReport(metrics, comparison);
```

## 🧪 Testing & Coverage

- **Test Framework:** Vitest
- **Coverage:** 93%+ across all packages
- **Node Version:** 24+ (LTS)
- **Total Tests:** 53 passing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:ci

# Watch mode
pnpm test -- --watch
```

### Coverage Report

| File            | Statements | Branches   | Functions  | Lines      |
| --------------- | ---------- | ---------- | ---------- | ---------- |
| **All files**   | **93.17%** | **80.87%** | **81.57%** | **93.17%** |
| analyzer.ts     | 95.48%     | 92.30%     | 85.71%     | 95.48%     |
| collector.ts    | 89.14%     | 85.18%     | 80.00%     | 89.14%     |
| dependencies.ts | 95.72%     | 85.36%     | 100.00%    | 95.72%     |
| reporter.ts     | 93.68%     | 63.26%     | 73.33%     | 93.68%     |

## 🎨 Use Cases

### Local Development

Understand your bundle size impact during development:

```typescript
// vite.config.ts
import { bundleWatch } from "@milencode/bundlewatch-vite-plugin";

export default defineConfig({
  plugins: [
    bundleWatch({
      printReport: true,
      saveToGit: false, // Don't save locally
    }),
  ],
});
```

### CI/CD Integration

Track metrics over time in your CI pipeline:

```yaml
# .github/workflows/build.yml
name: Build & Analyze

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 24

      - run: pnpm install
      - run: pnpm build
```

### Pull Request Comments

Get instant feedback on PRs:

```typescript
bundleWatch({
  compareAgainst: "main",
  failOnSizeIncrease: true,
  sizeIncreaseThreshold: 10, // Fail if >10% increase
});
```

## 🔧 Configuration

### Vite Plugin Options

```typescript
bundleWatch({
  // Enable/disable the plugin
  enabled: true,

  // Print report to console
  printReport: true,

  // Save metrics to git (auto-enabled in CI)
  saveToGit: undefined,

  // Branch to compare against
  compareAgainst: "main",

  // Fail build on size increase
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,

  // Storage configuration
  storage: {
    type: "git-branch",
    branch: "bundlewatch-data",
  },

  // Dashboard generation
  generateDashboard: true,
  dashboardPath: "./bundle-report",
});
```

## 💾 Git Storage

Bundle Watch stores historical metrics in a **separate Git branch** (`bundlewatch-data`) for free, version-controlled tracking.

### How It Works

- Metrics are saved to an orphaned git branch (no shared history with your code)
- Each build creates a JSON file: `main/abc123.json`
- Compare current builds against historical baselines

### Enable in CI

By default, git storage is disabled locally and enabled in CI. To use it in GitHub Actions:

```yaml
# .github/workflows/ci.yml
permissions:
  contents: write  # Required for bundlewatch to push metrics

jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Fetch all history
      
      - run: pnpm build  # Bundle Watch auto-saves to git
```

### Security

- ✅ **Isolated**: Only touches `bundlewatch-data` branch, never your code
- ✅ **Opt-in**: Disabled by default (`saveToGit: false`)
- ✅ **Auditable**: All changes are version controlled
- ✅ **No secrets**: Uses standard git credentials

### Disable Git Storage

If you don't want git-based tracking:

```typescript
bundleWatch({
  saveToGit: false,        // Disable git storage
  printReport: true,       // Still get console output
  generateDashboard: true, // Still get visualization
})
```

You'll lose historical comparison but keep all analysis features.

## 🤝 Contributing

We welcome contributions! This is an open-source project built for the community.

```bash
# Clone the repo
git clone https://github.com/yourusername/bundlewatch.git
cd bundlewatch

# Install dependencies (requires Node 24+)
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run example
pnpm --filter example-vite build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## 📚 Documentation Site

There's a Nuxt 4 + Nuxt Content docs workspace under `docs/` for longer-form guides.

```bash
pnpm --filter @bundlewatch/docs dev        # local docs server
pnpm --filter @bundlewatch/docs generate   # static site output (.output/public)
```

The sidebar and routes are powered by Markdown in `docs/content`. Frontmatter `title`/`description` controls navigation labels.

## 📝 License

MIT © [Your Name]

## 🙏 Acknowledgments

Inspired by:

- [bundlesize](https://github.com/siddharthkp/bundlesize) - Simple bundle size checking
- [size-limit](https://github.com/ai/size-limit) - Performance budgets
- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) - Bundle visualization

## 💬 Support

- [GitHub Issues](https://github.com/yourusername/bundlewatch/issues)
- [Discussions](https://github.com/yourusername/bundlewatch/discussions)

---

**Made with ❤️ for the JavaScript community**

# bundlewatch
