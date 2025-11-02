# @bundle-watch/cli

Command-line interface for bundle size analysis and tracking.

## Installation

```bash
pnpm add -D @bundle-watch/cli
```

Or use directly with `npx`:

```bash
npx @bundle-watch/cli analyze
```

## Commands

### `analyze`

Analyze the current build output:

```bash
bundle-watch analyze [options]
```

**Options:**
- `-o, --output <dir>` - Build output directory (default: `dist`)
- `-s, --save` - Save metrics to git storage
- `-p, --print` - Print report to console (default: `true`)
- `-c, --compare <branch>` - Compare against target branch

**Examples:**

```bash
# Analyze dist folder
bundle-watch analyze

# Analyze and save to git
bundle-watch analyze --save

# Analyze and compare with main
bundle-watch analyze --compare main

# Custom output directory
bundle-watch analyze --output build
```

### `compare`

Compare current build against a target branch:

```bash
bundle-watch compare [target] [options]
```

**Arguments:**
- `target` - Target branch or commit (default: `main`)

**Options:**
- `-o, --output <dir>` - Build output directory (default: `dist`)

**Examples:**

```bash
# Compare with main branch
bundle-watch compare main

# Compare with specific branch
bundle-watch compare develop
```

### `report`

Generate reports from stored metrics:

```bash
bundle-watch report [options]
```

**Options:**
- `-b, --branch <branch>` - Branch to generate report for (default: `main`)
- `-f, --format <format>` - Output format: `console`, `markdown`, `json` (default: `console`)
- `-o, --output <file>` - Output file path

**Examples:**

```bash
# Print report to console
bundle-watch report

# Generate markdown report
bundle-watch report --format markdown --output BUNDLE_REPORT.md

# Generate JSON report
bundle-watch report --format json --output metrics.json
```

## CI Usage

In your CI pipeline:

```yaml
- name: Build
  run: npm run build

- name: Analyze Bundle
  run: npx @bundle-watch/cli analyze --save --compare main
```

## Sample Output

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

══════════════════════════════════════════════════
```

