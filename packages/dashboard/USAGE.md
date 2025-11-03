# Dashboard Usage Guide

## 🚀 Quick Start

### Local Development Server

Start an interactive dashboard on `http://localhost:3333`:

```bash
bundlewatch serve
```

**Options:**
```bash
bundlewatch serve \
  --port 4000 \
  --host 0.0.0.0 \
  --no-open \
  --data-source git \
  --git-branch bundlewatch-data
```

### Static HTML Export

Generate a self-contained HTML report:

```bash
bundlewatch export
```

**Options:**
```bash
bundlewatch export dist --output ./bundle-report
```

This creates:
- `./bundle-report/index.html` - Interactive dashboard
- `./bundle-report/data.json` - Raw metrics data

## 📊 Dashboard Features

### 1. Overview Tab
- **Bundle Stats** - Total size, gzipped, brotli, build time
- **Comparison** - Changes vs baseline (if available)
- **Breakdown Chart** - Pie chart by asset type
- **Trend Chart** - Historical size over commits
- **Bundle List** - All files with sizes
- **Warnings** - Size threshold warnings
- **Recommendations** - Optimization suggestions

### 2. Treemap Tab
- **Visual Size Map** - See what's taking up space
- **Interactive** - Hover for details
- **Color Options** - By size or type
- **Drill-down** - Click to explore

### 3. Dependencies Tab
- **Dependency List** - All npm packages
- **Size Contribution** - How much each package adds
- **Duplicate Detection** - ⚠️ Warns about multiple versions
- **Search & Sort** - Filter by name, sort by size
- **Version Info** - See installed versions

### 4. History Tab
- **Timeline Chart** - Bundle size evolution
- **Build History** - Table of past builds
- **Trend Analysis** - Spot regressions

### 5. Compare Tab
- **Side-by-side** - Compare any two builds
- **Diff View** - See what changed
- **File-level** - Per-bundle comparisons

## 🎨 Dark Theme

Modern dark theme optimized for long viewing sessions.

## 📦 CI/CD Integration

### GitHub Pages Deployment

Add to `.github/workflows/ci.yml`:

```yaml
- name: Build
  run: pnpm build

- name: Generate Dashboard
  run: npx bundlewatch export dist --output ./dashboard

- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dashboard
```

Your dashboard will be at: `https://yourusername.github.io/your-repo/`

### PR Comments

(Coming soon) Automatically comment on PRs with bundle diff.

## 🔧 Programmatic Usage

```typescript
import { createDashboard, exportStatic } from '@bundlewatch/dashboard';
import { collectMetrics } from '@bundlewatch/core';

// Collect metrics
const metrics = await collectMetrics({
  outputDir: './dist',
  buildStartTime: Date.now(),
});

// Export static HTML
await exportStatic({
  output: './bundle-report',
  metrics,
});

// Or start server
await createDashboard({
  port: 3333,
  dataSource: 'git',
  open: true,
});
```

## 🎯 Tips

### Viewing Exported Reports

```bash
# Open in browser
open ./bundle-report/index.html

# Or serve with any static server
npx serve ./bundle-report
python -m http.server -d ./bundle-report
```

### Sharing Reports

- Commit `./bundle-report` to repo
- Upload to S3 / CDN
- Deploy to GitHub Pages / Netlify / Vercel
- Email the HTML file (it's self-contained!)

### Comparing Builds

```bash
# Build once
pnpm build
bundlewatch export --output ./report-before

# Make changes
# ... edit code ...

# Build again
pnpm build
bundlewatch export --output ./report-after

# Compare
diff report-before/data.json report-after/data.json
```

## 🛠️ Tech Stack

- **h3** - Fast, lightweight server
- **Chart.js** - Beautiful charts
- **Vanilla JS** - No framework bloat
- **Self-contained** - Single HTML file

## 🔮 Coming Soon

- [ ] Real-time updates (SSE)
- [ ] Multi-repo view
- [ ] Custom budgets UI
- [ ] Export to PDF
- [ ] GitHub PR integration
- [ ] Slack/Discord webhooks

## 💡 Examples

### Example 1: CI Dashboard

```yaml
# Generate on every push
on: [push]

jobs:
  dashboard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm build
      - run: npx bundlewatch export
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./bundle-report
```

### Example 2: Local Analysis

```bash
# Quick analysis during development
pnpm build && bundlewatch serve
```

### Example 3: Historical Tracking

```bash
# Build with metrics enabled
pnpm build  # (with bundlewatch vite plugin)

# View historical trends
bundlewatch serve --data-source git
```

## 🐛 Troubleshooting

### "No metrics found"

Make sure you've run a build first:
```bash
pnpm build
```

Or specify a different data source:
```bash
bundlewatch serve --data-source file
```

### Port already in use

Change the port:
```bash
bundlewatch serve --port 4000
```

### Browser doesn't open

Use `--no-open` and open manually:
```bash
bundlewatch serve --no-open
# Then visit http://localhost:3333
```

---

**Need help?** Open an issue or check the [main README](../../README.md)!

