# BundleWatch - Technical Overview

> Last Updated: 2025-11-08  
> Status: Active Development - Parser Integration Phase

## 🎯 Project Mission

**BundleWatch is a time-series tracking layer for existing bundle analyzers.**

Instead of competing with tools like `webpack-bundle-analyzer` or `rollup-plugin-visualizer`, we parse their outputs and add:
- 📊 Git-based historical tracking (no database needed)
- 🔄 Build-to-build comparison
- 📈 Trend analysis over time
- 🚨 CI/CD integration with alerts
- 💰 Bundle budget enforcement

**Key Insight:** Existing analyzers already do excellent analysis. Our value is tracking metrics *over time*.

---

## 🏗️ Architecture Overview

### Monorepo Structure (pnpm workspaces)

```
bundlewatch/
├── packages/
│   ├── core/                    # Core engine (comparison, storage)
│   ├── parsers/                 # NEW: Parse existing analyzer outputs
│   ├── vite-plugin/             # Vite integration
│   ├── webpack-plugin/          # Webpack integration
│   ├── next-plugin/             # Next.js integration
│   ├── dashboard/               # Visualization package
│   ├── cli/                     # CLI tool
│   └── lighthouse-plugin/       # Lighthouse integration
├── examples/
│   ├── vite-app/
│   ├── webpack-app/
│   ├── nextjs-app/
│   └── nuxt-app/
└── e2e/                         # End-to-end tests (Playwright)
```

### Package Dependency Graph

```
@milencode/bundlewatch-core (foundational types & logic)
    ↓
    ├─→ @milencode/bundlewatch-parsers (NEW! parse analyzer outputs)
    ↓
    ├─→ @milencode/bundlewatch-vite-plugin
    ├─→ @milencode/bundlewatch-webpack-plugin
    ├─→ @milencode/bundlewatch-next-plugin
    ├─→ @milencode/bundlewatch-dashboard
    └─→ @milencode/bundlewatch-cli
```

---

## 🔄 The Parser Strategy Pivot (November 2025)

### Problem Identified

**Original approach was slow and redundant:**

```typescript
// OLD (current in most plugins):
closeBundle() {
  // 1. Read all files from disk        ~500ms
  // 2. Compress with gzip               ~800ms
  // 3. Compress with brotli             ~600ms
  // Total:                              ~2000ms ❌
}
```

**Why this is wasteful:**
- Webpack/Rollup/Vite already analyzed the bundle
- They already have size data
- We're duplicating work that was just done

### Solution: Parse Their Output

```typescript
// NEW (implementing now):
generateBundle(options, bundle) {
  // 1. Parse their stats/bundle data   ~1ms
  // 2. Transform to our format         ~0.1ms
  // Total:                              ~50ms ✅ (40x faster!)
}
```

**Benefits:**
- ⚡ 40x faster (2s → 50ms)
- 🎯 Integrates with existing tools users know
- 🧹 Cleaner separation of concerns
- 📦 Smaller footprint (no compression libs in plugins)

---

## 📦 Package Details

### 1. `@milencode/bundlewatch-core`

**Purpose:** Framework-agnostic core logic

**Key Files:**
```
src/
├── types.ts              # Central type definitions
├── analyzer.ts           # Comparison engine
├── collector.ts          # Metrics collection (being phased out)
├── storage.ts            # Git-based storage
├── reporter.ts           # Report generation
└── dependencies.ts       # Dependency analysis
```

**Core Types:**

```typescript
interface BuildMetrics {
  timestamp: string;
  commit: string;
  branch: string;
  buildDuration: number;
  bundles: Bundle[];
  totalSize: number;
  totalGzipSize: number;
  totalBrotliSize: number;
  chunkCount: number;
  byType: AssetBreakdown;
  warnings: string[];
  recommendations: string[];
}

interface Bundle {
  name: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  type: 'js' | 'css' | 'html' | 'asset' | 'other';
  path: string;
}

interface Comparison {
  baseline: BuildMetrics;
  current: BuildMetrics;
  changes: {
    totalSize: { diff: number; diffPercent: number; };
    totalGzipSize: { diff: number; diffPercent: number; };
    totalBrotliSize: { diff: number; diffPercent: number; };
    buildDuration: { diff: number; diffPercent: number; };
    chunkCount: { diff: number; };
  };
  bundleChanges: {
    added: Bundle[];
    removed: Bundle[];
    modified: Array<{ name: string; sizeDiff: number; }>;
  };
}
```

**Storage Strategy:**

Git-based, no database needed:
```
.git/
bundlewatch-data/ (orphan branch)
├── data/
│   ├── main/
│   │   ├── abc123.json    # Each commit = JSON file
│   │   ├── def456.json
│   │   └── ...
│   └── feature-branch/
│       └── ...
```

**Key Functions:**

```typescript
// Comparison Engine
compareMetrics(current, baseline, baselineRef): Comparison

// Git Storage
save(metrics): Promise<void>
load(commitOrBranch): Promise<BuildMetrics | null>
listMetrics(branch): Promise<BuildMetrics[]>

// Report Generator
generateConsoleOutput(metrics, comparison?): string
generateMarkdown(metrics, comparison?): string
generateBadge(metrics): string
generatePRComment(comparison): string
```

---

### 2. `@milencode/bundlewatch-parsers` (NEW! ⚡)

**Purpose:** Parse existing analyzer outputs instead of re-analyzing

**Status:** POC complete for webpack, Vite/Rollup pending

**Key Files:**
```
src/
├── webpack.ts     # ✅ DONE - Parse webpack stats.json
├── rollup.ts      # ⏳ TODO - Parse rollup-plugin-visualizer
└── vite.ts        # ⏳ TODO - Parse Vite manifest.json
```

**Example: Webpack Parser**

```typescript
interface WebpackStats {
  time?: number;
  hash?: string;
  assets?: Array<{
    name: string;
    size: number;
    chunks?: number[];
  }>;
}

function parseWebpackStats(
  stats: WebpackStats,
  options: {
    branch?: string;
    commit?: string;
    estimateCompression?: boolean;
  }
): BuildMetrics {
  // Transform webpack's format → our BuildMetrics format
  // ~1ms execution time
}
```

**Performance:**
```
Before (re-analyzing): ~2000ms
After (parsing):       <1ms
Speedup:               2000x ⚡
```

**Philosophy:**

Don't compete with existing tools - **augment them**:

```
webpack-bundle-analyzer  →  Generates stats.json
     ↓
parseWebpackStats()      →  Transforms to BuildMetrics (~1ms)
     ↓
BundleWatch Core         →  Tracks over time, compares, alerts
```

---

### 3. `@milencode/bundlewatch-vite-plugin`

**Purpose:** Vite build integration

**Current Status:** ⚠️ **NEEDS REFACTORING** - Still uses old slow approach

**Target Architecture:**

```typescript
import type { Plugin, ResolvedConfig } from 'vite';
import type { OutputBundle } from 'rollup';

export function bundleWatch(options): Plugin {
  return {
    name: 'vite-plugin-bundlewatch',
    apply: 'build',
    
    // NEW: Use generateBundle hook (access to OutputBundle)
    async generateBundle(_options, bundle: OutputBundle) {
      // bundle contains all assets/chunks with:
      // - fileName
      // - type ('asset' | 'chunk')
      // - source (Buffer | string)
      
      // Strategy:
      // 1. Parse OutputBundle → BuildMetrics (fast!)
      // 2. Use core engine for comparison/storage
      // 3. Generate reports
    }
  };
}
```

**Vite's OutputBundle Format:**

```typescript
// What Vite gives us in generateBundle:
{
  'assets/index-abc123.js': {
    type: 'chunk',
    fileName: 'assets/index-abc123.js',
    code: '...', // The actual JS code
    modules: { /* module graph */ },
    imports: [...],
    exports: [...]
  },
  'assets/style-def456.css': {
    type: 'asset',
    fileName: 'assets/style-def456.css',
    source: '...', // The CSS content
  }
}
```

**What We Need to Build:**

```typescript
// packages/parsers/src/vite.ts
function parseViteBundle(
  bundle: OutputBundle,
  options: { branch, commit, buildStartTime }
): BuildMetrics {
  const bundles: Bundle[] = [];
  
  for (const [fileName, output] of Object.entries(bundle)) {
    if (fileName.endsWith('.map')) continue;
    
    const source = output.type === 'chunk' ? output.code : output.source;
    const buffer = Buffer.from(source);
    
    // Option 1: Estimate compression (fast)
    const gzipSize = Math.round(buffer.length * 0.3);
    const brotliSize = Math.round(gzipSize * 0.85);
    
    // Option 2: Actually compress (slower but accurate)
    // const gzipSize = await gzipSize(buffer);
    // const brotliSize = await brotliSize(buffer);
    
    bundles.push({
      name: fileName,
      size: buffer.length,
      gzipSize,
      brotliSize,
      type: getFileType(fileName),
      path: fileName,
    });
  }
  
  return buildMetricsFromBundles(bundles, options);
}
```

**Refactor TODO:**
1. Create `parseViteBundle()` in parsers package
2. Update vite-plugin to use `generateBundle` hook instead of `closeBundle`
3. Remove dependency on `MetricsCollector` (reads from disk)
4. Keep dashboard generation, git storage, comparison logic

---

### 4. `@milencode/bundlewatch-webpack-plugin`

**Purpose:** Webpack 5 integration

**Current Status:** ⚠️ **NEEDS REFACTORING** - Should use `parseWebpackStats()`

**Target Architecture:**

```typescript
class BundleWatchPlugin {
  apply(compiler) {
    compiler.hooks.done.tapAsync('BundleWatch', async (stats, callback) => {
      // stats.toJson() gives us the webpack stats object
      const statsJson = stats.toJson({
        assets: true,
        chunks: true,
        modules: false, // Don't need module details
      });
      
      // Use the parser!
      const metrics = parseWebpackStats(statsJson, {
        branch: await getBranch(),
        commit: await getCommit(),
      });
      
      // Continue with comparison, storage, reporting
      await processMetrics(metrics);
      
      callback();
    });
  }
}
```

**Why This is Better:**
- Webpack already calculated all sizes
- `stats.toJson()` is instant (already in memory)
- No file I/O needed
- Consistent with our parser strategy

**Refactor TODO:**
1. Import `parseWebpackStats` from parsers package
2. Replace current metrics collection with parser
3. Test with webpack example app

---

### 5. `@milencode/bundlewatch-next-plugin`

**Purpose:** Next.js integration (wraps webpack plugin)

**Current Status:** ⚠️ **NEEDS REFACTORING** - Depends on webpack refactor

**Architecture:**

```typescript
export function withBundleWatch(nextConfig, bundleWatchOptions) {
  return {
    ...nextConfig,
    webpack(config, options) {
      // Add BundleWatch webpack plugin
      config.plugins.push(
        new BundleWatchPlugin({
          ...bundleWatchOptions,
          // Next.js specific options
          isServer: options.isServer,
        })
      );
      
      // Call user's webpack config if provided
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }
      
      return config;
    },
  };
}
```

**Note:** Once webpack plugin uses parsers, this automatically benefits.

---

### 6. `@milencode/bundlewatch-dashboard`

**Purpose:** Interactive D3.js treemap visualization

**Current Status:** ✅ Working, but needs enhancement

**Features:**
- Treemap visualization of bundle composition
- Size breakdown by type
- Hover tooltips
- Responsive design

**TODO:**
- Add search functionality
- Add filtering by file type
- Add timeline view (show changes over time)
- Add comparison view (side-by-side)

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

**Location:** `packages/core/__tests__/`

**Coverage:** 93%+ on core package

```typescript
// Example: analyzer.test.ts
describe('compareMetrics', () => {
  it('detects size increases', () => {
    const baseline = createMetrics({ totalSize: 1000 });
    const current = createMetrics({ totalSize: 1500 });
    
    const comparison = compareMetrics(current, baseline, 'main');
    
    expect(comparison.changes.totalSize.diff).toBe(500);
    expect(comparison.changes.totalSize.diffPercent).toBe(50);
  });
});
```

**Key Test Files:**
- `analyzer.test.ts` - Comparison logic
- `collector.test.ts` - Metrics collection
- `reporter.test.ts` - Report generation
- `dependencies.test.ts` - Dependency analysis

### E2E Tests (Playwright)

**Location:** `e2e/tests/`

**Coverage:** 31 tests across all integrations

```typescript
// Example: vite.spec.ts
test('Vite plugin generates metrics and compares against baseline', async () => {
  await exec('pnpm build', { cwd: VITE_APP_DIR });
  
  const report = await readFile(join(VITE_APP_DIR, 'bundle-report/index.html'));
  expect(report).toContain('Bundle Watch Report');
  
  const metrics = await loadMetrics('bundlewatch-data');
  expect(metrics.totalSize).toBeGreaterThan(0);
});
```

**Test Categories:**
1. Plugin integration (Vite, Webpack, Next.js, Nuxt)
2. Git storage (save, load, comparison)
3. Dashboard generation
4. CLI functionality

**Sequential Execution:**
Tests run with `maxWorkers: 1` in Playwright to avoid git race conditions.

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

**Jobs:**

1. **Test Job:**
   ```yaml
   - Checkout code
   - Setup Node 24 + pnpm
   - Install dependencies
   - Build all packages
   - Run unit tests with coverage
   - Run E2E tests
   - Upload coverage to Codecov
   ```

2. **Release Job** (on `main` branch only):
   ```yaml
   - Checkout with full history
   - Setup Node 24 + pnpm
   - Build packages
   - Run semantic-release
     - Analyze commits (conventional commits)
     - Bump versions
     - Generate CHANGELOG
     - Create GitHub release
     - Publish to npm (@milencode scope)
   ```

**Permissions:**
```yaml
permissions:
  contents: write        # Push to bundlewatch-data branch
  issues: write          # Comment on issues
  pull-requests: write   # Comment on PRs
```

**Secrets Required:**
- `GITHUB_TOKEN` - Auto-provided by GitHub
- `NPM_TOKEN` - For publishing to npm (@milencode org)
- `CODECOV_TOKEN` - For coverage reporting

---

## 📋 Current Implementation Status

### ✅ Complete

- [x] Core comparison engine
- [x] Git-based storage (bundlewatch-data branch)
- [x] Webpack stats parser (`parseWebpackStats`)
- [x] Report generation (console, markdown, badges)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Semantic versioning (semantic-release)
- [x] Published to npm (@milencode scope)
- [x] Codecov integration
- [x] E2E test suite (31 tests passing)
- [x] Biome linting setup
- [x] Test organization (__tests__ directories)

### 🚧 In Progress

- [ ] **Vite plugin refactor** (using native Vite bundle data)
- [ ] Vite/Rollup parser (`parseViteBundle`)
- [ ] Rollup visualizer parser (`parseRollupVisualizer`)

### ⏳ TODO

- [ ] Webpack plugin refactor (use `parseWebpackStats`)
- [ ] Next.js plugin refactor (depends on Webpack)
- [ ] Nuxt plugin (should work after Vite refactor)
- [ ] Enhanced dashboard (search, filters, trends)
- [ ] More bundler support (esbuild, Parcel, Rollup standalone)
- [ ] PR comment automation
- [ ] Slack/email alerting

---

## 🎯 Implementation Priorities

### Phase 1: Complete Parser Integration (Current)

**Goal:** Prove the parser strategy works end-to-end

**Tasks:**
1. ✅ Build webpack stats parser
2. 🚧 Build Vite bundle parser
3. 🚧 Refactor Vite plugin to use parser
4. ⏳ Test with example apps
5. ⏳ Refactor Webpack plugin
6. ⏳ Refactor Next.js plugin

**Success Metric:** All plugins use parsers, <100ms analysis time

### Phase 2: Additional Parsers

**Goal:** Support more bundlers/analyzers

**Tasks:**
1. Build `parseRollupVisualizer()` (parse rollup-plugin-visualizer HTML/JSON)
2. Build `parseViteManifest()` (parse `.vite/manifest.json`)
3. Build `parseEsbuildMetafile()` (parse esbuild metafile)
4. Build `parseParcelReport()` (parse Parcel bundle report)

### Phase 3: Enhanced Features

**Goal:** Make BundleWatch indispensable

**Tasks:**
1. Dashboard search & filtering
2. Timeline view (show changes over time)
3. Automated PR comments
4. Alerting (Slack, email, webhooks)
5. Budget enforcement (hard limits)
6. Trend predictions (ML-based?)

---

## 🔧 Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:ci

# Run E2E tests
cd e2e && pnpm test

# Lint code
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Test a specific example
cd examples/vite-app && pnpm build
```

### Adding a New Parser

1. **Create parser file:**
   ```typescript
   // packages/parsers/src/my-bundler.ts
   export interface MyBundlerStats {
     // Define the input format
   }
   
   export function parseMyBundlerStats(
     stats: MyBundlerStats,
     options: { branch, commit }
   ): BuildMetrics {
     // Transform to BuildMetrics
   }
   ```

2. **Export from index:**
   ```typescript
   // packages/parsers/src/index.ts
   export { parseMyBundlerStats, type MyBundlerStats } from './my-bundler';
   ```

3. **Write tests:**
   ```typescript
   // packages/parsers/__tests__/my-bundler.test.ts
   describe('parseMyBundlerStats', () => {
     it('parses stats correctly', () => {
       const stats = { /* mock data */ };
       const metrics = parseMyBundlerStats(stats, { branch: 'main', commit: 'abc' });
       expect(metrics.bundles).toHaveLength(3);
     });
   });
   ```

4. **Update plugin to use parser:**
   ```typescript
   // packages/my-bundler-plugin/src/index.ts
   import { parseMyBundlerStats } from '@milencode/bundlewatch-parsers';
   
   // In the plugin hook:
   const metrics = parseMyBundlerStats(bundlerStats, options);
   ```

### Publishing

**Automated via CI:**
1. Commit using conventional commits:
   ```bash
   git commit -m "feat: add new parser"
   git commit -m "fix: resolve compression issue"
   git commit -m "docs: update README"
   ```

2. Push to `main`:
   ```bash
   git push origin main
   ```

3. CI automatically:
   - Runs tests
   - Bumps version (based on commit type)
   - Generates CHANGELOG
   - Creates GitHub release
   - Publishes to npm

**Manual publish (if needed):**
```bash
pnpm -r build
pnpm -r publish --access public
```

---

## 📚 Key Technical Decisions

### 1. Git Storage vs Database

**Decision:** Store metrics in git (orphan branch)

**Rationale:**
- ✅ Zero infrastructure (no database to maintain)
- ✅ Version controlled and auditable
- ✅ Works in any environment (no external deps)
- ✅ Free and scalable
- ✅ Git already available in CI

**Trade-offs:**
- ⚠️ Not suitable for millions of builds
- ⚠️ Requires git access in CI
- ⚠️ Branch must be fetched to compare

**Implementation:**
```bash
# Orphan branch (no shared history)
git checkout --orphan bundlewatch-data
git rm -rf .

# Store as JSON files
mkdir -p data/main
echo '{ ... }' > data/main/abc123.json
git add data
git commit -m "metrics: main@abc123"
git push origin bundlewatch-data
```

### 2. Parser Strategy vs Re-analysis

**Decision:** Parse existing analyzer outputs

**Rationale:**
- ✅ 2000x faster (<1ms vs 2s)
- ✅ Leverages existing tools users know
- ✅ Clearer value proposition
- ✅ Smaller bundle size
- ✅ Less maintenance

**Trade-offs:**
- ⚠️ Depends on analyzer output format
- ⚠️ May need to estimate compression
- ⚠️ Less control over data

### 3. Monorepo vs Multi-repo

**Decision:** Monorepo with pnpm workspaces

**Rationale:**
- ✅ Shared types and tooling
- ✅ Easier to refactor across packages
- ✅ Single CI/CD pipeline
- ✅ Atomic releases

### 4. Compression Strategy

**Decision:** Estimate compression in parsers, offer opt-in for accuracy

**Rationale:**
- ✅ Estimation is instant (gzip ≈ 30% of original, brotli ≈ 85% of gzip)
- ✅ Good enough for trends (relative changes matter more than absolute)
- ✅ Can opt-in to real compression if needed

**Implementation:**
```typescript
function estimateCompression(size: number) {
  return {
    gzip: Math.round(size * 0.3),
    brotli: Math.round(size * 0.3 * 0.85),
  };
}

// Or for accuracy:
async function realCompression(buffer: Buffer) {
  return {
    gzip: await gzipSize(buffer),
    brotli: await brotliSize(buffer),
  };
}
```

### 5. TypeScript Over JavaScript

**Decision:** Full TypeScript, strict mode

**Rationale:**
- ✅ Type safety prevents bugs
- ✅ Better IDE support
- ✅ Self-documenting code
- ✅ Easier refactoring

---

## 🐛 Known Issues & Gotchas

### 1. Git Fetch Error on First Run

**Issue:** `fatal: couldn't find remote ref bundlewatch-data`

**Cause:** Branch doesn't exist yet on first run

**Fix:** Silenced error, returns `null` gracefully
```typescript
try {
  await execAsync('git fetch origin bundlewatch-data');
} catch (error) {
  // Branch might not exist yet - this is expected on first run
  return null;
}
```

### 2. E2E Test Race Conditions

**Issue:** Parallel tests can conflict when writing to git

**Fix:** Run E2E tests sequentially
```typescript
// e2e/playwright.config.ts
export default defineConfig({
  workers: 1, // Sequential execution
});
```

### 3. Workspace Dependencies

**Issue:** `workspace:*` in package.json breaks publishing

**Fix:** Semantic-release with `@semantic-release/exec` to run `pnpm -r publish`
```javascript
// release.config.js
{
  prepare: [
    '@semantic-release/changelog',
    '@semantic-release/npm',
    {
      path: '@semantic-release/exec',
      cmd: 'pnpm -r exec npm version ${nextRelease.version}',
    },
  ],
  publish: [
    '@semantic-release/npm',
    {
      path: '@semantic-release/exec',
      cmd: 'pnpm -r publish --access public',
    },
  ],
}
```

### 4. Node Version Mismatch

**Issue:** Cursor sandbox uses Node 22, project requires Node 24

**Impact:** Just warnings in local Cursor environment, no functional issues

**Fix:** Not needed - CI/production use Node 24 correctly

---

## 📖 API Reference

### Core API

```typescript
import {
  GitStorage,
  ComparisonEngine,
  ReportGenerator,
  MetricsCollector, // Being phased out
} from '@milencode/bundlewatch-core';

// Storage
const storage = new GitStorage({
  branch: 'bundlewatch-data',
  workingDir: process.cwd(),
});
await storage.save(metrics);
const metrics = await storage.load('main');

// Comparison
const engine = new ComparisonEngine();
const comparison = engine.compare(current, baseline, 'main');

// Reporting
const reporter = new ReportGenerator();
console.log(reporter.generateConsoleOutput(metrics, comparison));
const markdown = reporter.generateMarkdown(metrics, comparison);
const badge = reporter.generateBadge(metrics);
const prComment = reporter.generatePRComment(comparison);
```

### Parser API

```typescript
import { parseWebpackStats } from '@milencode/bundlewatch-parsers';

const stats = JSON.parse(fs.readFileSync('stats.json', 'utf-8'));
const metrics = parseWebpackStats(stats, {
  branch: 'main',
  commit: 'abc123',
  estimateCompression: true, // default: true
});
```

### Plugin APIs

```typescript
// Vite
import { bundleWatch } from '@milencode/bundlewatch-vite-plugin';

export default {
  plugins: [
    bundleWatch({
      enabled: true,
      printReport: true,
      saveToGit: true, // auto-enabled in CI
      compareAgainst: 'main',
      generateDashboard: true,
      dashboardPath: './bundle-report',
    }),
  ],
};

// Webpack
const { BundleWatchPlugin } = require('@milencode/bundlewatch-webpack-plugin');

module.exports = {
  plugins: [
    new BundleWatchPlugin({
      // same options as Vite
    }),
  ],
};

// Next.js
const { withBundleWatch } = require('@milencode/bundlewatch-next-plugin');

module.exports = withBundleWatch(nextConfig, {
  // same options
});
```

---

## 🎓 Learning Resources

### Understanding the Codebase

**Start here:**
1. Read `STRATEGY.md` - High-level approach
2. Read `packages/core/src/types.ts` - Core data structures
3. Read `packages/core/src/analyzer.ts` - Comparison logic
4. Read `packages/parsers/src/webpack.ts` - Parser example
5. Read `packages/vite-plugin/src/index.ts` - Plugin integration

**Key Concepts:**

**BuildMetrics:**
The central data structure representing a single build:
```typescript
{
  timestamp, commit, branch,  // Metadata
  bundles: [],                // Individual files
  totalSize, totalGzipSize,   // Aggregates
  byType: {},                 // Breakdown by file type
  warnings: [],               // Size warnings
  recommendations: []         // Optimization tips
}
```

**Comparison:**
Diff between two BuildMetrics:
```typescript
{
  baseline, current,          // The two metrics
  changes: {                  // Numerical diffs
    totalSize: { diff, diffPercent },
    // ...
  },
  bundleChanges: {            // File-level changes
    added: [],
    removed: [],
    modified: []
  }
}
```

**Parser Function Signature:**
```typescript
function parseXYZ(
  input: XYZFormat,           // Analyzer-specific format
  options: {
    branch?: string;
    commit?: string;
    // parser-specific options
  }
): BuildMetrics {            // Our standard format
  // Transform logic
}
```

### Testing Patterns

**Unit Test Pattern:**
```typescript
describe('feature', () => {
  const createMock = (overrides) => ({ /* defaults + overrides */ });
  
  it('handles case X', () => {
    const input = createMock({ /* specific data */ });
    const result = functionUnderTest(input);
    expect(result).toMatchObject({ /* assertions */ });
  });
});
```

**E2E Test Pattern:**
```typescript
test.describe('Integration', () => {
  const APP_DIR = join(__dirname, '../examples/app');
  
  test.beforeAll(async () => {
    await exec('pnpm clean', { cwd: APP_DIR });
  });
  
  test('full workflow', async () => {
    await exec('pnpm build', { cwd: APP_DIR });
    const report = await readFile(join(APP_DIR, 'bundle-report/index.html'));
    expect(report).toContain('expected content');
  });
});
```

---

## 🚦 Getting Started (New Contributor)

### 1. Clone & Setup

```bash
git clone https://github.com/sashamilenkovic/bundlewatch.git
cd bundlewatch
pnpm install
pnpm build
pnpm test
```

### 2. Run Examples

```bash
# Vite example
cd examples/vite-app
pnpm build
open bundle-report/index.html

# Webpack example
cd examples/webpack-app
pnpm build
```

### 3. Make Changes

```bash
# Create feature branch
git checkout -b feat/my-feature

# Make changes, test locally
pnpm build
pnpm test

# Commit with conventional commits
git commit -m "feat: add awesome feature"

# Push and create PR
git push origin feat/my-feature
```

### 4. Common Tasks

**Add a parser:**
1. Create `packages/parsers/src/my-parser.ts`
2. Export from `packages/parsers/src/index.ts`
3. Add tests in `packages/parsers/__tests__/`
4. Update a plugin to use it

**Fix a bug:**
1. Write a failing test
2. Fix the bug
3. Verify test passes
4. Commit with `fix:` prefix

**Add a feature:**
1. Check if it fits the strategy
2. Start with types in `core/src/types.ts`
3. Implement in appropriate package
4. Add tests (unit + E2E if needed)
5. Update docs
6. Commit with `feat:` prefix

---

## 🎯 Current Focus: Vite Plugin Refactor

**Goal:** Replace file-based metrics collection with parser-based approach

**Current Code (OLD):**
```typescript
async closeBundle() {
  const outputDir = resolve(config.root, config.build.outDir);
  const collector = new MetricsCollector({ outputDir, ... });
  const metrics = await collector.collect();  // ← Reads files from disk
  // ... comparison, storage, reporting
}
```

**Target Code (NEW):**
```typescript
async generateBundle(_options, bundle: OutputBundle) {
  const metrics = parseViteBundle(bundle, {  // ← Parse in-memory data
    branch: await getBranch(),
    commit: await getCommit(),
    buildStartTime,
  });
  // ... comparison, storage, reporting (unchanged)
}
```

**Implementation Steps:**
1. Create `packages/parsers/src/vite.ts`:
   ```typescript
   export function parseViteBundle(
     bundle: OutputBundle,
     options: { branch, commit, buildStartTime }
   ): BuildMetrics {
     // Iterate bundle, build BuildMetrics
   }
   ```

2. Update `packages/vite-plugin/src/index.ts`:
   - Change hook from `closeBundle` to `generateBundle`
   - Import `parseViteBundle`
   - Remove `MetricsCollector` usage

3. Test with examples:
   ```bash
   cd examples/vite-app && pnpm build
   cd examples/nuxt-app && pnpm build
   ```

4. Verify E2E tests pass:
   ```bash
   cd e2e && pnpm test
   ```

**Expected Outcome:**
- Vite plugin: ~2s → ~50ms (40x faster)
- No functional changes to output/reports
- All tests still pass

---

## 📞 Contact & Links

- **Repository:** https://github.com/sashamilenkovic/bundlewatch
- **npm Org:** https://www.npmjs.com/org/milencode
- **CI:** https://github.com/sashamilenkovic/bundlewatch/actions
- **Codecov:** https://codecov.io/gh/sashamilenkovic/bundlewatch

---

## 📝 Version History

- **v1.3.0** (current) - Added parsers package, biome linting, test reorganization
- **v1.2.x** - Vite 7 support, dashboard generation
- **v1.1.x** - Initial public release with all plugins
- **v1.0.x** - Core functionality and git storage

---

**This document should be kept up to date as the project evolves.** If you make significant architectural changes, please update this overview.

