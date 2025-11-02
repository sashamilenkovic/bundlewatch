# 📦 BundleWatch

> Code Coverage for Bundle Size - Track your build metrics over time

An open-source dev tool that analyzes Vite builds, tracks metrics over time, and displays results directly in your repository. Provides instant visibility into build performance with historical trends and comparisons.

[![npm version](https://img.shields.io/npm/v/@bundlewatch/core.svg)](https://www.npmjs.com/package/@bundlewatch/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **📊 Instant Visibility** - See bundle size and performance metrics in your README
- **📈 Trend Tracking** - Compare current build against previous commits and main branch  
- **🤖 CI-Native** - Designed for GitHub Actions and CI environments
- **⚡ Zero Config** - Works out of the box with Vite projects
- **🔍 Historical Context** - Track how your bundle evolves over time
- **🎯 Framework Agnostic** - Core package works with any build tool
- **🔌 Plugin Architecture** - Optional Vite plugin for seamless integration
- **🧪 Fully Tested** - 43 tests with 92.44% coverage
- **🎨 Functional** - Built with composition over classes

## 🚀 Quick Start

### Vite Plugin (Recommended)

> **Note**: Currently in private development. See [INSTALLATION.md](./INSTALLATION.md) for GitHub installation.

```bash
# Future (once public):
pnpm add -D @bundlewatch/vite-plugin

# Now (from GitHub):
pnpm add -D @bundlewatch/vite-plugin@github:yourusername/bundlewatch#workspace=@bundlewatch/vite-plugin
```

Add to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import { bundleWatch } from '@bundlewatch/vite-plugin';

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
npx @bundlewatch/cli analyze

# Compare against main branch
npx @bundlewatch/cli compare main

# Generate markdown report
npx @bundlewatch/cli report --format markdown
```

## 📦 Packages

This monorepo contains:

| Package | Description | Version |
|---------|-------------|---------|
| [@bundlewatch/core](./packages/core) | Framework-agnostic core engine | 0.1.0 |
| [@bundlewatch/vite-plugin](./packages/vite-plugin) | Vite plugin integration | 0.1.0 |
| [@bundlewatch/cli](./packages/cli) | Command-line interface | 0.1.0 |

## 🎯 Architecture

Built with **functional composition** for better testability and maintainability:

```typescript
// Pure functions, not classes!
import { collectMetrics, compareMetrics, generateReport } from '@bundlewatch/core';

const metrics = await collectMetrics({ outputDir: './dist' });
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

| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **All files** | **93.17%** | **80.87%** | **81.57%** | **93.17%** |
| analyzer.ts | 95.48% | 92.30% | 85.71% | 95.48% |
| collector.ts | 89.14% | 85.18% | 80.00% | 89.14% |
| dependencies.ts | 95.72% | 85.36% | 100.00% | 95.72% |
| reporter.ts | 93.68% | 63.26% | 73.33% | 93.68% |

## 🎨 Use Cases

### Local Development

Understand your bundle size impact during development:

```typescript
// vite.config.ts
import { bundleWatch } from '@bundlewatch/vite-plugin';

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
  compareAgainst: 'main',
  failOnSizeIncrease: true,
  sizeIncreaseThreshold: 10, // Fail if >10% increase
})
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
  compareAgainst: 'main',

  // Fail build on size increase
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,

  // Storage configuration
  storage: {
    type: 'git-branch',
    branch: 'bundlewatch-data',
  },
})
```

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
