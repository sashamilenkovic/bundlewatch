# Example Vite App with Bundle Watch

This is a simple Vite + TypeScript application demonstrating Bundle Watch integration.

## Usage

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build & Analyze

```bash
pnpm build
```

You'll see Bundle Watch analyze your build and output:

```
📊 Bundle Watch: Starting analysis...

📊 Bundle Watch Report
══════════════════════════════════════════════════

Total Size:    [size]
Gzipped:       [size]
Brotli:        [size]
Build Time:    [time]
Chunks:        [count]

By Type:
  JavaScript:  [size]
  CSS:         [size]
  Images:      [size]
  Fonts:       [size]
  Other:       [size]

══════════════════════════════════════════════════
```

## Configuration

See `vite.config.ts` for Bundle Watch configuration options:

```typescript
bundleWatch({
  enabled: true,
  printReport: true,
  saveToGit: false,
  compareAgainst: 'main',
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,
})
```

## Testing Features

### Test Git Storage

Enable git storage to test historical tracking:

```typescript
bundleWatch({
  saveToGit: true, // Save metrics to git
})
```

After building, check the `bundle-watch-data` branch:

```bash
git fetch origin bundle-watch-data
git log bundle-watch-data
```

### Test Comparison

Build on different branches and compare:

```bash
# On main branch
git checkout main
pnpm build

# On feature branch
git checkout -b feature/test
# Make some changes to the code
pnpm build # Will compare against main
```

### Test CLI

Use the CLI to analyze without rebuilding:

```bash
# Analyze existing build
npx @bundle-watch/cli analyze --output dist

# Compare with main
npx @bundle-watch/cli compare main

# Generate markdown report
npx @bundle-watch/cli report --format markdown
```

## What to Try

1. **Add a large dependency** (e.g., `moment.js`) and see the warnings
2. **Enable code splitting** and see multiple chunks analyzed
3. **Compare branches** to see size differences
4. **Test thresholds** by setting `failOnSizeIncrease: true`

