/**
 * Core type definitions for bundle-watch
 */

export interface Bundle {
  name: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  type: 'js' | 'css' | 'asset' | 'html' | 'other';
  path?: string;

  /** Module IDs included in this bundle (for detailed analysis) */
  modules?: string[];
}

export interface AssetBreakdown {
  javascript: number;
  css: number;
  images: number;
  fonts: number;
  other: number;
}

export interface DependencySize {
  name: string;
  size: number;
  version?: string;
}

/**
 * Detailed module-level metrics
 * Available when detailed analysis is enabled
 */
export interface ModuleMetrics {
  /** Full module identifier (e.g., "node_modules/react/index.js" or "src/App.tsx") */
  id: string;

  /** Package name (e.g., "react", "lodash", "your-app") */
  package: string;

  /** Raw size in bytes */
  size: number;

  /** Gzipped size (real compression when available) */
  gzipSize?: number;

  /** Brotli compressed size (real compression when available) */
  brotliSize?: number;

  /** Which bundle chunks include this module */
  chunks: string[];

  /** Modules that import this module */
  importedBy: string[];

  /** Modules that this module imports */
  imports: string[];

  /** Module type */
  type: 'npm' | 'local' | 'vendor';

  /** Whether this module is tree-shakeable (ESM) */
  treeshakeable?: boolean;

  /** Depth in dependency tree (0 = entry point) */
  depth?: number;
}

/**
 * Enhanced dependency metrics with detailed analysis
 */
export interface DependencyMetrics {
  /** Package name */
  name: string;

  /** Package version (from package.json or lock file) */
  version?: string;

  /** Total size of all modules from this package */
  totalSize: number;

  /** Gzipped size */
  gzipSize?: number;

  /** Brotli compressed size */
  brotliSize?: number;

  /** Number of modules from this package */
  moduleCount: number;

  /** Which bundles include this dependency */
  chunks: string[];

  /** Entry point that first imported this dependency */
  firstImportedBy?: string;

  /** Whether the package supports tree-shaking (undefined if unknown) */
  treeshakeable?: boolean;

  /** Whether this is a duplicate (multiple versions) */
  duplicate?: boolean;

  /** Other versions of this package in the bundle */
  otherVersions?: string[];

  /** Percentage of total bundle size */
  percentOfTotal?: number;
}

/**
 * Original source file metrics (via source map analysis)
 */
export interface SourceFileMetrics {
  /** Original source file path (e.g., "src/components/Dashboard.tsx") */
  path: string;

  /** Package name if from node_modules, otherwise "your-app" */
  package: string;

  /** Estimated size contribution to final bundle */
  size: number;

  /** Number of lines in original source */
  lines?: number;

  /** Which bundle this appears in */
  chunks: string[];

  /** Modules that import this source file */
  importedBy: string[];
}

/**
 * Dependency graph node
 */
export interface DependencyGraphNode {
  /** Module ID */
  id: string;

  /** Modules this imports */
  imports: string[];

  /** Modules that import this */
  importedBy: string[];

  /** Depth in dependency tree */
  depth: number;

  /** Reason for inclusion */
  reason: 'entry' | 'static-import' | 'dynamic-import' | 'chunk-optimization';

  /** Whether this is part of a circular dependency */
  circular?: boolean;

  /** Circular dependency chain if detected */
  circularChain?: string[];
}

/**
 * Dependency graph analysis results
 */
export interface DependencyGraph {
  /** Graph nodes by module ID */
  nodes: Map<string, DependencyGraphNode>;

  /** Duplicate packages detected */
  duplicates: Array<{
    package: string;
    versions: Array<{
      version: string;
      size: number;
      modules: string[];
    }>;
  }>;

  /** Circular dependencies detected */
  circular: Array<{
    chain: string[];
    impact: 'warning' | 'error';
  }>;

  /** Potentially unused exports */
  unusedExports?: Array<{
    module: string;
    exports: string[];
  }>;
}

/**
 * Smart optimization recommendations
 */
export interface OptimizationRecommendation {
  /** Recommendation type */
  type: 'tree-shaking' | 'duplicate' | 'alternative' | 'code-splitting' | 'compression';

  /** Severity level */
  severity: 'info' | 'warning' | 'error';

  /** Human-readable message */
  message: string;

  /** What to do */
  action: string;

  /** Potential size savings in bytes */
  potentialSavings?: number;

  /** Affected modules/packages */
  affectedPackages?: string[];

  /** Code example or specific fix */
  example?: string;
}

export interface BuildMetrics {
  // Build Info
  timestamp: string;
  commit: string;
  branch: string;
  buildDuration: number;

  // Bundle Metrics
  bundles: Bundle[];

  // Aggregate Stats
  totalSize: number;
  totalGzipSize: number;
  totalBrotliSize: number;
  chunkCount: number;

  // Asset Breakdown
  byType: AssetBreakdown;

  // Dependencies (optional - legacy, kept for compatibility)
  dependencies?: DependencySize[];

  // Performance Hints
  warnings: string[];
  recommendations: string[];

  // ===== DETAILED ANALYSIS =====
  // These fields are populated when detailed analysis is enabled
  // They provide deep insights into bundle composition

  /** Module-level metrics (per-file detail) */
  modules?: ModuleMetrics[];

  /** Enhanced dependency metrics (per-package detail) */
  detailedDependencies?: DependencyMetrics[];

  /** Original source file metrics (via source maps) */
  sourceFiles?: SourceFileMetrics[];

  /** Dependency graph analysis */
  dependencyGraph?: DependencyGraph;

  /** Smart optimization recommendations */
  optimizations?: OptimizationRecommendation[];

  /** Analysis metadata */
  analysis?: {
    /** Whether real compression was used (vs estimates) */
    realCompression: boolean;

    /** Whether source maps were analyzed */
    sourceMapsAnalyzed: boolean;

    /** Whether dependency graph was built */
    graphAnalyzed: boolean;

    /** Total analysis time in milliseconds */
    analysisTime: number;
  };
}

export interface BundleChange {
  name: string;
  current?: number;
  previous?: number;
  diff: number;
  diffPercent: number;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
}

export interface SizeChange {
  current: number;
  previous: number;
  diff: number;
  diffPercent: number;
}

export interface Comparison {
  target: 'main' | 'previous' | string;
  targetCommit?: string;
  currentCommit: string;

  changes: {
    totalSize: SizeChange;
    totalGzipSize: SizeChange;
    totalBrotliSize: SizeChange;
    buildDuration: SizeChange;
    byBundle: BundleChange[];
  };

  summary: string;
  recommendations: string[];
}

export interface StorageOptions {
  type: 'git-branch';
  branch: string;
  remote?: string;
}

export interface CollectionOptions {
  buildTime?: boolean;
  dependencies?: boolean;
  sourceMaps?: boolean;
}

export interface ReadmeOptions {
  enabled: boolean;
  path: string;
  marker: string;
}

export interface ThresholdOptions {
  error?: number;
  warning?: number;
}

export interface ComparisonOptions {
  baseline: string;
  threshold?: ThresholdOptions;
}

export interface ReportOptions {
  formats: ('html' | 'json' | 'markdown')[];
  outputDir: string;
}

export interface BundleWatchConfig {
  storage?: StorageOptions;
  collect?: CollectionOptions;
  readme?: ReadmeOptions;
  compare?: ComparisonOptions;
  reports?: ReportOptions;
}

export interface AnalyzeResult {
  metrics: BuildMetrics;
  comparison?: Comparison;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

