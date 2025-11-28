/**
 * @milencode/bundlewatch-webpack-plugin
 * Bundle Watch plugin for Webpack
 */

import {
  compareMetrics,
  GitStorage,
  ReportGenerator,
  ComparisonEngine,
  type BundleWatchConfig,
} from '@milencode/bundlewatch-core';
import {
  parseWebpackStats,
  generateEnhancedDashboard,
  type WebpackStats,
} from '@milencode/bundlewatch-parsers';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
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
  let buildStartTime = 0;

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
          console.log('📊 Bundle Watch: Skipping (dev/watch mode)');
        }
        return;
      }

      // Skip if in test environment and not explicitly enabled
      if (isTestEnvironment() && options.enabled !== true) {
        if (options.verbose) {
          console.log('📊 Bundle Watch: Skipping (test environment detected)');
        }
        return;
      }

      const pluginName = 'BundleWatchPlugin';

      // Track build start time
      compiler.hooks.compile.tap(pluginName, () => {
        buildStartTime = Date.now();
        if (options.verbose || options.printReport) {
          console.log('📊 Bundle Watch: Starting analysis...');
        }
      });

      // Analyze after build completes
      compiler.hooks.done.tapPromise(pluginName, async (stats) => {
        try {
          const workingDir = compiler.context || process.cwd();

          // Get git info
          const commit = await GitStorage.getCurrentCommit(workingDir).catch(() => 'unknown');
          const branch = await GitStorage.getCurrentBranch(workingDir).catch(() => 'unknown');

          // Parse webpack stats (fast - no disk I/O!)
          const webpackStats = stats.toJson({
            all: false,
            assets: true,
            cachedAssets: true, // Include cached assets
            chunks: true,
            modules: options.extractModules, // Extract module-level detail
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

          let comparison;

          // Load baseline for comparison
          if (options.compareAgainst) {
            const baseline = await storage.load(options.compareAgainst);
            if (baseline) {
              comparison = compareMetrics(metrics, baseline, options.compareAgainst);
            } else {
              // First run - no baseline found
              console.log('\n┌─────────────────────────────────────────────────────────────┐');
              console.log('│ 📊 BundleWatch - First Run Detected                        │');
              console.log('├─────────────────────────────────────────────────────────────┤');
              console.log(`│ No baseline found for comparison with '${options.compareAgainst}'${' '.repeat(Math.max(0, 22 - options.compareAgainst.length))}│`);
              console.log('│                                                             │');
              console.log('│ 💡 To enable bundle size comparisons:                      │');
              console.log('│                                                             │');
              console.log('│   Quick start (recommended):                                │');
              console.log('│   $ npx bundlewatch backfill --last 10                     │');
              console.log('│                                                             │');
              console.log('│   Or backfill releases only:                                │');
              console.log('│   $ npx bundlewatch backfill --releases-only               │');
              console.log('│                                                             │');
              console.log('│ This build will be saved and used as a baseline            │');
              console.log('│ for future comparisons.                                     │');
              console.log('└─────────────────────────────────────────────────────────────┘\n');
            }
          }

          // Print report
          if (options.printReport) {
            console.log(reporter.generateConsoleOutput(metrics, comparison));
          }

          // Generate enhanced dashboard
          if (options.generateDashboard) {
            const dashboardDir = resolve(workingDir, options.dashboardPath || './bundle-report');
            console.log(`📊 Generating enhanced dashboard at ${dashboardDir}...`);

            try {
              mkdirSync(dashboardDir, { recursive: true });

              const dashboardHTML = generateEnhancedDashboard(metrics, comparison);
              writeFileSync(resolve(dashboardDir, 'index.html'), dashboardHTML);

              console.log(`✅ Dashboard generated: ${resolve(dashboardDir, 'index.html')}`);
              console.log(`   Open with: open ${resolve(dashboardDir, 'index.html')}`);
            } catch (dashboardError) {
              console.error('Failed to generate dashboard:', dashboardError);
            }
          }

          // Save to git storage
          if (saveToGit) {
            try {
              if (options.verbose) {
                console.log('💾 Saving metrics to git...');
              }
              await storage.save(metrics);
              if (options.verbose) {
                console.log('✅ Metrics saved successfully');
              }
            } catch (gitError) {
              // Graceful handling - git issues shouldn't break builds
              if (options.verbose) {
                console.warn('⚠️ Bundle Watch: Could not save to git:',
                  gitError instanceof Error ? gitError.message : gitError
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
                `(threshold: ${threshold}%). Build failed.`
              );
            }
          }

        } catch (error) {
          // Only log errors if verbose, or if it's a threshold failure
          if (options.failOnSizeIncrease) {
            // This is an intentional failure - always show
            console.error('❌ Bundle Watch:', error instanceof Error ? error.message : error);
            throw error;
          } else if (options.verbose) {
            // Only show in verbose mode to avoid scary logs
            console.warn('⚠️ Bundle Watch error:', error instanceof Error ? error.message : error);
          }
          // Silently continue - bundlewatch issues shouldn't break builds
        }
      });
    },
  };
}

export default bundleWatchPlugin;

