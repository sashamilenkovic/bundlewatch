# Quick Start Guide

Welcome to Bundle Watch! Here's how to get started quickly.

## What Just Got Built

✅ **Monorepo Structure** with 3 packages:
- `@bundle-watch/core` - Framework-agnostic analytics engine
- `@bundle-watch/vite-plugin` - Vite plugin (optional integration)
- `@bundle-watch/cli` - Command-line interface

✅ **Example Project** to test everything

## Try It Out

### 1. See it in action

The example app already has Bundle Watch configured:

```bash
pnpm --filter example-vite build
```

You'll see output like:

```
📊 Bundle Watch Report
══════════════════════════════════════════════════
Total Size:    6.21 KB
Gzipped:       3.27 KB
Brotli:        4.96 KB
Build Time:    62ms
Chunks:        4

By Type:
  JavaScript:  2.96 KB
  CSS:         1.34 KB
  Images:      1.46 KB
  Fonts:       0 B
  Other:       458 B
══════════════════════════════════════════════════
```

### 2. Use the CLI

```bash
# Analyze the example build
pnpm --filter @bundle-watch/cli exec bundle-watch analyze --output ../examples/vite-app/dist

# Generate a markdown report
pnpm --filter @bundle-watch/cli exec bundle-watch report --format markdown
```

### 3. Test Git Storage

To enable historical tracking:

1. Edit `examples/vite-app/vite.config.ts`:
```typescript
bundleWatch({
  saveToGit: true, // Enable git storage
  compareAgainst: 'main',
})
```

2. Create a main branch and commit:
```bash
git add .
git commit -m "Initial commit"
git branch -M main
```

3. Build and see it save metrics:
```bash
pnpm --filter example-vite build
```

The metrics will be saved to the `bundle-watch-data` branch!

### 4. Test Comparison

```bash
# Make a change to the example app
echo "export const test = 'hello';" >> examples/vite-app/src/main.ts

# Build and compare
pnpm --filter example-vite build
```

You'll see a comparison against the previous build!

## Project Structure

```
bundle-watch/
├── packages/
│   ├── core/              # ✅ Core analytics engine
│   │   ├── src/
│   │   │   ├── types.ts           # Type definitions
│   │   │   ├── collector.ts       # Metrics collection
│   │   │   ├── analyzer.ts        # Comparison engine
│   │   │   ├── storage.ts         # Git storage
│   │   │   └── reporter.ts        # Report generation
│   │   └── package.json
│   │
│   ├── vite-plugin/       # ✅ Vite integration
│   │   ├── src/
│   │   │   └── index.ts           # Plugin implementation
│   │   └── package.json
│   │
│   └── cli/               # ✅ CLI tool
│       ├── src/
│       │   ├── cli.ts             # Main CLI entry
│       │   └── commands/          # Commands (analyze, compare, report)
│       └── package.json
│
├── examples/
│   └── vite-app/          # ✅ Example with Bundle Watch configured
│
└── README.md              # ✅ Full documentation
```

## What It Does

### 📊 Metrics Collection
- Bundle sizes (raw, gzipped, brotli)
- Build duration tracking
- Asset breakdown by type
- File-by-file analysis

### 🔍 Comparison Engine
- Compare against main branch
- Compare with previous builds
- Identify added/removed bundles
- Calculate size differences

### 💾 Git Storage
- Stores metrics in dedicated branch
- No external services needed
- Full history tracking
- Works with any git host

### 📝 Report Generation
- Console output with colors
- Markdown for README
- JSON for programmatic access
- GitHub Actions integration ready

## Next Steps

### Publish to npm

```bash
# Update package.json files with your info
# Then publish

cd packages/core
npm publish --access public

cd ../vite-plugin
npm publish --access public

cd ../cli
npm publish --access public
```

### Add GitHub Action

Create `.github/workflows/bundle-watch.yml`:

```yaml
name: Bundle Watch

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - run: pnpm install
      - run: pnpm build
```

### Create GitHub Action Package

```bash
mkdir packages/github-action
# Implement GitHub Action wrapper
```

### Add More Features

See the main README for the roadmap:
- HTML reports with charts
- Bundle treemap visualization
- Dependency size analysis
- PR comment integration
- Support for Next.js, Nuxt, Remix

## Testing Checklist

- [x] Build all packages
- [x] Run example app
- [ ] Test git storage
- [ ] Test comparison
- [ ] Test CLI commands
- [ ] Test in CI environment
- [ ] Test with large project

## Common Issues

**Git errors when saving metrics?**
- Make sure you're in a git repository
- Ensure you have commit permissions
- Check that the remote exists

**Import errors?**
- Run `pnpm install` in the root
- Build packages: `pnpm build`

**TypeScript errors?**
- Make sure you have Node types: `@types/node`
- Check tsconfig.json settings

## Resources

- [Main README](./README.md) - Full documentation
- [Core Package](./packages/core/README.md) - API reference
- [Vite Plugin](./packages/vite-plugin/README.md) - Plugin options
- [CLI](./packages/cli/README.md) - Command reference
- [Contributing](./CONTRIBUTING.md) - Development guide

---

**Have fun building! 🚀**

Feel free to customize, extend, and make this your own. This is a solid foundation for a powerful bundle analysis tool!

