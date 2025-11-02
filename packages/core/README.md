# @bundle-watch/core

Framework-agnostic core engine for bundle size analysis and tracking.

## Installation

```bash
pnpm add -D @bundle-watch/core
```

## Usage

### Collect Metrics

```typescript
import { MetricsCollector } from '@bundle-watch/core';

const collector = new MetricsCollector({
  outputDir: './dist',
  branch: 'main',
  commit: 'abc123',
  buildStartTime: Date.now(),
});

const metrics = await collector.collect();
console.log(metrics);
```

### Compare Builds

```typescript
import { ComparisonEngine } from '@bundle-watch/core';

const analyzer = new ComparisonEngine();
const comparison = analyzer.compare(currentMetrics, baselineMetrics, 'main');

console.log(comparison.summary);
// "📉 Bundle is 12.5 KB (4.8%) smaller than main"
```

### Store in Git

```typescript
import { GitStorage } from '@bundle-watch/core';

const storage = new GitStorage({
  branch: 'bundle-watch-data',
  workingDir: process.cwd(),
});

// Save metrics
await storage.save(metrics);

// Load metrics
const baseline = await storage.load('main');

// List all metrics for a branch
const history = await storage.list('main');
```

### Generate Reports

```typescript
import { ReportGenerator } from '@bundle-watch/core';

const reporter = new ReportGenerator();

// Console output
console.log(reporter.generateConsoleOutput(metrics, comparison));

// Markdown for README
const markdown = reporter.generateReadmeSection(metrics, comparison);

// PR comment
const comment = reporter.generatePRComment(metrics, comparison);
```

## API Reference

### `MetricsCollector`

Collects build metrics from an output directory.

**Constructor:**
```typescript
new MetricsCollector(options: CollectorOptions)
```

**Options:**
- `outputDir: string` - Path to build output directory
- `branch?: string` - Git branch name
- `commit?: string` - Git commit hash
- `buildStartTime?: number` - Build start timestamp

**Methods:**
- `collect(): Promise<BuildMetrics>` - Collect all metrics

### `ComparisonEngine`

Compares two builds and generates insights.

**Methods:**
- `compare(current: BuildMetrics, baseline: BuildMetrics, targetName?: string): Comparison`

### `GitStorage`

Stores and retrieves metrics in git branches.

**Constructor:**
```typescript
new GitStorage(options?: GitStorageOptions)
```

**Options:**
- `branch?: string` - Storage branch name (default: 'bundle-watch-data')
- `remote?: string` - Git remote name (default: 'origin')
- `workingDir?: string` - Working directory (default: process.cwd())

**Methods:**
- `save(metrics: BuildMetrics): Promise<void>` - Save metrics to git
- `load(branch: string, commit?: string): Promise<BuildMetrics | null>` - Load metrics
- `list(branch: string): Promise<BuildMetrics[]>` - List all metrics for a branch

**Static Methods:**
- `GitStorage.getCurrentCommit(workingDir?: string): Promise<string>`
- `GitStorage.getCurrentBranch(workingDir?: string): Promise<string>`

### `ReportGenerator`

Generates reports in various formats.

**Methods:**
- `generateBadge(metrics: BuildMetrics): string` - Generate badge markdown
- `generateReadmeSection(metrics: BuildMetrics, comparison?: Comparison): string` - Full README section
- `generatePRComment(metrics: BuildMetrics, comparison: Comparison): string` - PR comment
- `generateConsoleOutput(metrics: BuildMetrics, comparison?: Comparison): string` - Terminal output

## TypeScript Types

All types are exported from the main package:

```typescript
import type {
  BuildMetrics,
  Bundle,
  Comparison,
  BundleChange,
  SizeChange,
  // ... and more
} from '@bundle-watch/core';
```

## License

MIT

