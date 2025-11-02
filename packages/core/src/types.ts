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

  // Dependencies (optional)
  dependencies?: DependencySize[];

  // Performance Hints
  warnings: string[];
  recommendations: string[];
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

