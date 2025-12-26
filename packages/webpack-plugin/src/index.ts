/**
 * @milencode/bundlewatch-webpack-plugin
 * Bundle Watch plugin for Webpack
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type BundleWatchConfig,
  type Comparison,
  compareMetrics,
  generateCompactSummary,
  GitStorage,
  ReportGenerator,
} from '@milencode/bundlewatch-core';
import {
  generateEnhancedDashboard,
  parseWebpackStats,
  type WebpackStats,
} from '@milencode/bundlewatch-parsers';
import type { Compiler } from 'webpack';

export interface WebpackBundleWatchOptions extends Partial<BundleWatchConfig> {
  /**
   * Enable/disable the plugin
   * @default true
   */
  enabled?: boolean;

  /**
   * When to apply the plugin
   * - 'build': Only production builds (default, recommended)
   * - 'all': All builds including dev (use with caution)
   * @default 'build'
   */
  apply?: 'build' | 'all';

  /**
   * Enable verbose logging
   * @default false
   */
  verbose?: boolean;

  /**
   * Print report to console after build
   * @default true
   */
  printReport?: boolean;

  /**
   * Save metrics to git storage
   * @default true in CI (except test runners), false locally
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
   * @default 10
   */
  sizeIncreaseThreshold?: number;

  /**
   * Extract module-level metrics from webpack stats
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
   * Print compact one-line summary instead of full report
   * Example: "148 KB gzip | -14 KB (-8.6%) vs main | PASS"
   * @default false
   */
  compactOutput?: boolean;
}

const defaultOptions: WebpackBundleWatchOptions = {
  enabled: true,
  apply: 'build',
  verbose: false,
  printReport: true,
  saveToGit: undefined, // Will be determined based on CI/test env
  compareAgainst: 'main',
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,
  compactOutput: false,
  extractModules: true,
  buildDependencyGraph: true,
  generateRecommendations: true,
  generateDashboard: false,
  dashboardPath: './bundle-report',
};

/**
 * Detect if running in a test runner environment
 * Tests shouldn't mutate git or interfere with builds
 */
function isTestEnvironment(): boolean {
  return !!(
    process.env.PLAYWRIGHT_TEST ||
    process.env.PLAYWRIGHT ||
    process.env.JEST_WORKER_ID ||
    process.env.VITEST ||
    process.env.VITEST_WORKER_ID ||
    process.env.TEST_MODE ||
    process.env.CYPRESS ||
    process.env.SKIP_BUNDLE_WATCH
  );
}

/**
 * Determine if we should save to git
 */
function shouldSaveToGit(explicitValue: boolean | undefined, isCI: boolean): boolean {
  // Explicitly configured? Use that value
  if (explicitValue !== undefined) return explicitValue;

  // Not in CI? Don't save
  if (!isCI) return false;

  // In a test runner? Don't save (tests shouldn't mutate git)
  if (isTestEnvironment()) return false;

  return true;
}

/**
 * Webpack plugin for Bundle Watch (functional composition)
 */
export function bundleWatchPlugin(userOptions: WebpackBundleWatchOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  let _buildStartTime = 0;

  // Resolve saveToGit based on CI/test environment
  const saveToGit = shouldSaveToGit(options.saveToGit, isCI);

  return {
    apply(compiler: Compiler) {
      if (!options.enabled) return;

      // Auto-skip in dev/watch mode unless explicitly configured
      const isDevMode = compiler.options.mode === 'development';
      const isWatching = compiler.options.watch === true;

      if (options.apply === 'build' && (isDevMode || isWatching)) {
        if (options.verbose) {
          console.log('[bundlewatch] Skipping (dev/watch mode)');
        }
        return;
      }

      // Skip if in test environment and not explicitly enabled
      if (isTestEnvironment() && options.enabled !== true) {
        if (options.verbose) {
          console.log('[bundlewatch] Skipping (test environment detected)');
        }
        return;
      }

      const pluginName = 'BundleWatchPlugin';

      // Track build start time
      compiler.hooks.compile.tap(pluginName, () => {
        _buildStartTime = Date.now();
        if (options.verbose) {
          console.log('[bundlewatch] Starting analysis...');
        }
      });

      // Analyze after build completes
      compiler.hooks.done.tapPromise(pluginName, async stats => {
        try {
          const workingDir = compiler.context || process.cwd();

          // Get git info
          const commit = await GitStorage.getCurrentCommit(workingDir).catch(() => 'unknown');
          const branch = await GitStorage.getCurrentBranch(workingDir).catch(() => 'unknown');

          // Parse webpack stats (fast - no disk I/O!)
          // Request all the data needed for comprehensive analysis
          const webpackStats = stats.toJson({
            all: false,
            assets: true,
            cachedAssets: true,
            chunks: true,
            chunkModules: options.extractModules, // Modules inside chunks (Next.js uses this)
            modules: options.extractModules, // Top-level modules
            nestedModules: options.extractModules, // Nested module info
            chunkGroups: true, // Named chunk groups for friendly names
            entrypoints: true, // Entry point names
            reasons: options.extractModules, // Import reasons for dependency graph
            performance: true,
            timings: true,
          }) as WebpackStats;

          const metrics = parseWebpackStats(webpackStats, {
            branch,
            commit,
            estimateCompression: true,
            extractModules: options.extractModules,
            buildDependencyGraph: options.buildDependencyGraph,
            generateRecommendations: options.generateRecommendations,
          });

          // Initialize storage and reporter
          const storage = new GitStorage({
            branch: options.storage?.branch || 'bundlewatch-data',
            workingDir,
          });
          const reporter = new ReportGenerator();

          let comparison: Comparison | undefined;

          // Load baseline for comparison
          if (options.compareAgainst) {
            const baseline = await storage.load(options.compareAgainst);
            if (baseline) {
              comparison = compareMetrics(metrics, baseline, options.compareAgainst);
            } else {
              // First run - no baseline found
              console.log(`\n[bundlewatch] No baseline found for '${options.compareAgainst}'.`);
              console.log('             This build will be saved as the initial baseline.');
              console.log('             To backfill history: npx bundlewatch backfill --last 10\n');
            }
          }

          // Print report
          if (options.printReport) {
            if (options.compactOutput) {
              console.log(
                generateCompactSummary(metrics, comparison, {
                  threshold: options.sizeIncreaseThreshold,
                }),
              );
            } else {
              console.log(reporter.generateConsoleOutput(metrics, comparison));
            }
          }

          // Generate enhanced dashboard
          if (options.generateDashboard) {
            const dashboardDir = resolve(workingDir, options.dashboardPath || './bundle-report');

            try {
              mkdirSync(dashboardDir, { recursive: true });

              const dashboardHTML = generateEnhancedDashboard(metrics, comparison);
              const dashboardPath = resolve(dashboardDir, 'index.html');
              writeFileSync(dashboardPath, dashboardHTML);

              // Print clear path to dashboard
              console.log('');
              console.log('─'.repeat(50));
              console.log('Dashboard:');
              console.log(`  file://${dashboardPath}`);
              console.log('─'.repeat(50));
            } catch (dashboardError) {
              console.error('[bundlewatch] Failed to generate dashboard:', dashboardError);
            }
          }

          // Save to git storage
          if (saveToGit) {
            try {
              await storage.save(metrics);
            } catch (gitError) {
              // Graceful handling - git issues shouldn't break builds
              if (options.verbose) {
                console.warn(
                  '[bundlewatch] Could not save to git:',
                  gitError instanceof Error ? gitError.message : gitError,
                );
              }
              // Continue without throwing - this is non-critical
            }
          }

          // Check thresholds
          if (options.failOnSizeIncrease && comparison) {
            const threshold = options.sizeIncreaseThreshold || 10;
            if (comparison.changes.totalSize.diffPercent > threshold) {
              throw new Error(
                `Bundle size increased by ${comparison.changes.totalSize.diffPercent.toFixed(1)}% ` +
                  `(threshold: ${threshold}%). Build failed.`,
              );
            }
          }
        } catch (error) {
          // Only log errors if verbose, or if it's a threshold failure
          if (options.failOnSizeIncrease) {
            // This is an intentional failure - always show
            console.error('[bundlewatch] Build failed:', error instanceof Error ? error.message : error);
            throw error;
          } else if (options.verbose) {
            // Only show in verbose mode to avoid scary logs
            console.warn('[bundlewatch] Warning:', error instanceof Error ? error.message : error);
          }
          // Silently continue - bundlewatch issues shouldn't break builds
        }
      });
    },
  };
}

export default bundleWatchPlugin;
