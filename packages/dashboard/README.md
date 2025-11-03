# @bundlewatch/dashboard

Interactive dashboard and visualization for Bundle Watch metrics.

## Features

- 🗺️ **Treemap Visualization** - See what's taking up space in your bundle
- 📈 **Historical Charts** - Track bundle size over time
- 🔍 **Dependency Analysis** - Find duplicate dependencies
- 🎯 **Compare View** - Diff any two builds
- 🖥️ **Local Server** - Development dashboard at http://localhost:3333
- 📄 **Static Export** - Generate shareable HTML reports

## Installation

```bash
pnpm add -D @bundlewatch/dashboard
```

## Usage

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

### Static Export

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

### GitHub Pages Integration

```yaml
# .github/workflows/bundlewatch.yml
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

## Dashboard Features

### Overview Tab
- **Bundle Stats** - Total size, gzipped, brotli, build time
- **Comparison** - Changes vs baseline (if available)
- **Breakdown Chart** - Pie chart by asset type
- **Trend Chart** - Historical size over commits
- **Bundle List** - All files with sizes
- **Warnings** - Size threshold warnings
- **Recommendations** - Optimization suggestions

### Treemap Tab
- **Visual Size Map** - See what's taking up space
- **Interactive** - Hover for details
- **Color Options** - By size or type
- **Drill-down** - Click to explore

### Dependencies Tab
- **Dependency List** - All npm packages
- **Size Contribution** - How much each package adds
- **Duplicate Detection** - ⚠️ Warns about multiple versions
- **Search & Sort** - Filter by name, sort by size
- **Version Info** - See installed versions

### History Tab
- **Timeline Chart** - Bundle size evolution
- **Build History** - Table of past builds
- **Trend Analysis** - Spot regressions

### Compare Tab
- **Side-by-side** - Compare any two builds
- **Diff View** - See what changed
- **File-level** - Per-bundle comparisons

## Programmatic Usage

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

## Tech Stack

- **h3** - Fast, lightweight server
- **Chart.js** - Beautiful charts
- **Vanilla JS** - No framework bloat
- **Self-contained** - Single HTML file

## Tips

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

## License

MIT

