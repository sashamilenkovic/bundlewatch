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
   * Print report to console after build
   * @default true
   */
  printReport?: boolean;

  /**
   * Save metrics to git storage
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
  printReport: true,
  saveToGit: undefined, // Will be determined based on CI env
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
 * Webpack plugin for Bundle Watch
 */
export class BundleWatchPlugin {
  private options: WebpackBundleWatchOptions;
  private buildStartTime: number = 0;
  private isCI: boolean;

  constructor(userOptions: WebpackBundleWatchOptions = {}) {
    this.options = { ...defaultOptions, ...userOptions };
    this.isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

    // Default saveToGit based on CI environment
    if (this.options.saveToGit === undefined) {
      this.options.saveToGit = this.isCI;
    }
  }

  apply(compiler: Compiler) {
    if (!this.options.enabled) return;

    const pluginName = 'BundleWatchPlugin';

    // Track build start time
    compiler.hooks.compile.tap(pluginName, () => {
      this.buildStartTime = Date.now();
      console.log('📊 Bundle Watch: Starting analysis...');
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
          modules: this.options.extractModules, // Extract module-level detail
          performance: true,
          timings: true,
        }) as WebpackStats;

        const metrics = parseWebpackStats(webpackStats, {
          branch,
          commit,
          estimateCompression: true,
          extractModules: this.options.extractModules,
          buildDependencyGraph: this.options.buildDependencyGraph,
          generateRecommendations: this.options.generateRecommendations,
        });

        // Initialize storage and reporter
        const storage = new GitStorage({
          branch: this.options.storage?.branch || 'bundlewatch-data',
          workingDir,
        });
        const reporter = new ReportGenerator();

        let comparison;

        // Load baseline for comparison
        if (this.options.compareAgainst) {
          const baseline = await storage.load(this.options.compareAgainst);
          if (baseline) {
            comparison = compareMetrics(metrics, baseline, this.options.compareAgainst);
          }
        }

        // Print report
        if (this.options.printReport) {
          console.log(reporter.generateConsoleOutput(metrics, comparison));
        }

        // Generate enhanced dashboard
        if (this.options.generateDashboard) {
          const dashboardDir = resolve(workingDir, this.options.dashboardPath || './bundle-report');
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
        if (this.options.saveToGit) {
          console.log('💾 Saving metrics to git...');
          await storage.save(metrics);
          console.log('✅ Metrics saved successfully');
        }

        // Check thresholds
        if (this.options.failOnSizeIncrease && comparison) {
          const threshold = this.options.sizeIncreaseThreshold || 10;
          if (comparison.changes.totalSize.diffPercent > threshold) {
            throw new Error(
              `Bundle size increased by ${comparison.changes.totalSize.diffPercent.toFixed(1)}% ` +
              `(threshold: ${threshold}%). Build failed.`
            );
          }
        }

      } catch (error) {
        console.error('❌ Bundle Watch error:', error);
        if (this.options.failOnSizeIncrease) {
          throw error;
        }
      }
    });
  }
}

export default BundleWatchPlugin;

