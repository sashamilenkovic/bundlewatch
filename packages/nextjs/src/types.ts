/**
 * Type definitions for @milencode/bundlewatch-nextjs
 */

/**
 * Bundler type detection
 */
export type BundlerType = 'webpack' | 'turbopack' | 'auto';

/**
 * Configuration options for withBundleWatch
 */
export interface BundleWatchNextOptions {
  /**
   * Enable/disable the plugin
   * @default true
   */
  enabled?: boolean;

  /**
   * Force specific bundler mode (auto-detected if not specified)
   * - 'auto': Detect based on environment and config
   * - 'webpack': Force webpack mode (uses plugin)
   * - 'turbopack': Force turbopack mode (post-build analysis)
   * @default 'auto'
   */
  bundler?: BundlerType;

  /**
   * Print report to console after build
   * @default true
   */
  printReport?: boolean;

  /**
   * Save metrics to git storage (bundlewatch-data branch)
   * @default true in CI, false locally
   */
  saveToGit?: boolean;

  /**
   * Compare against target branch
   * @default 'main'
   */
  compareAgainst?: string;

  /**
   * Fail build if size increases beyond threshold
   * @default false
   */
  failOnSizeIncrease?: boolean;

  /**
   * Size increase threshold (percentage)
   * Only used if failOnSizeIncrease is true
   * @default 10
   */
  sizeIncreaseThreshold?: number;

  /**
   * Generate interactive HTML dashboard
   * @default false
   */
  generateDashboard?: boolean;

  /**
   * Path to save the dashboard
   * @default './bundle-report'
   */
  dashboardPath?: string;

  /**
   * Extract module-level metrics
   * @default true
   */
  extractModules?: boolean;

  /**
   * Build dependency graph
   * @default true
   */
  buildDependencyGraph?: boolean;

  /**
   * Generate optimization recommendations
   * @default true
   */
  generateRecommendations?: boolean;
}

/**
 * Resolved options with all defaults applied
 */
export interface ResolvedBundleWatchOptions extends Required<Omit<BundleWatchNextOptions, 'saveToGit'>> {
  saveToGit: boolean | undefined;
}
