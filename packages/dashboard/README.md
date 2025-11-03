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

```bash
npx bundlewatch serve
# Opens http://localhost:3333
```

### Static Export

```bash
npx bundlewatch export --output ./bundle-report
```

Opens a self-contained HTML report you can commit or host anywhere.

### GitHub Pages Integration

```yaml
# .github/workflows/bundlewatch.yml
- name: Generate Dashboard
  run: npx bundlewatch export --output ./dashboard

- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dashboard
```

## Dashboard Features

### Treemap View
Interactive visualization showing relative size of bundles and dependencies.

### Time Series
Historical chart showing bundle size evolution over commits.

### Dependencies
Sortable, filterable list of all dependencies with:
- Size contribution
- Version info
- Duplicate detection (⚠️ warns if multiple versions found)

### Compare
Side-by-side comparison of any two builds.

## API

```typescript
import { createDashboard, exportStatic } from '@bundlewatch/dashboard';

// Start local server
const server = await createDashboard({
  port: 3333,
  dataSource: 'git', // or 'file'
  gitBranch: 'bundlewatch-data',
});

// Export static HTML
await exportStatic({
  output: './bundle-report',
  metrics: buildMetrics,
  historical: true,
});
```

## License

MIT

