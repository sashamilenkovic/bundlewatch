/**
 * @bundlewatch/webpack-plugin
 * Bundle Watch plugin for Webpack
 */

import { collectMetrics, compareMetrics, GitStorage, ReportGenerator, type BundleWatchConfig } from '@bundlewatch/core';
import { resolve } from 'path';
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
}

const defaultOptions: WebpackBundleWatchOptions = {
  enabled: true,
  printReport: true,
  saveToGit: undefined, // Will be determined based on CI env
  compareAgainst: 'main',
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,
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
        const outputPath = stats.compilation.outputOptions.path;
        if (!outputPath) {
          console.warn('⚠️  Bundle Watch: No output path found');
          return;
        }

        const workingDir = compiler.context || process.cwd();

        // Get git info
        const commit = await GitStorage.getCurrentCommit(workingDir).catch(() => 'unknown');
        const branch = await GitStorage.getCurrentBranch(workingDir).catch(() => 'unknown');

        // Collect metrics
        const metrics = await collectMetrics({
          outputDir: outputPath,
          branch,
          commit,
          buildStartTime: this.buildStartTime,
          projectRoot: workingDir,
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

