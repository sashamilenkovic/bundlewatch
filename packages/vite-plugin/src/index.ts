/**
 * @bundlewatch/vite-plugin
 * Vite plugin for automatic bundle analysis
 */

import type { Plugin, ResolvedConfig } from 'vite';
import { MetricsCollector, GitStorage, ComparisonEngine, ReportGenerator } from '@bundlewatch/core';
import type { BundleWatchConfig } from '@bundlewatch/core';
import { resolve } from 'path';

export interface ViteBundleWatchOptions extends Partial<BundleWatchConfig> {
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

const defaultOptions: ViteBundleWatchOptions = {
  enabled: true,
  printReport: true,
  saveToGit: undefined, // Will be determined based on CI env
  compareAgainst: 'main',
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,
};

/**
 * Vite plugin for bundle watching and analysis
 */
export function bundleWatch(userOptions: ViteBundleWatchOptions = {}): Plugin {
  const options = { ...defaultOptions, ...userOptions };
  let config: ResolvedConfig;
  let buildStartTime: number;
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  // Default saveToGit based on CI environment
  if (options.saveToGit === undefined) {
    options.saveToGit = isCI;
  }

  return {
    name: 'vite-plugin-bundlewatch',
    
    apply: 'build', // Only run on build, not dev

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    buildStart() {
      if (!options.enabled) return;
      buildStartTime = Date.now();
      console.log('📊 Bundle Watch: Starting analysis...');
    },

    async closeBundle() {
      if (!options.enabled) return;

      try {
        const outputDir = resolve(config.root, config.build.outDir);
        
        // Get git info
        const commit = await GitStorage.getCurrentCommit(config.root);
        const branch = await GitStorage.getCurrentBranch(config.root);

        // Collect metrics
        const collector = new MetricsCollector({
          outputDir,
          branch,
          commit,
          buildStartTime,
        });

        const metrics = await collector.collect();

        // Initialize storage and reporter
        const storage = new GitStorage({
          branch: options.storage?.branch || 'bundlewatch-data',
          workingDir: config.root,
        });
        const reporter = new ReportGenerator();
        const analyzer = new ComparisonEngine();

        let comparison;

        // Load baseline for comparison
        if (options.compareAgainst) {
          const baseline = await storage.load(options.compareAgainst);
          if (baseline) {
            comparison = analyzer.compare(metrics, baseline, options.compareAgainst);
          }
        }

        // Print report to console
        if (options.printReport) {
          console.log(reporter.generateConsoleOutput(metrics, comparison));
        }

        // Save to git storage
        if (options.saveToGit) {
          console.log('💾 Saving metrics to git...');
          await storage.save(metrics);
          console.log('✅ Metrics saved successfully');
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

        // Set environment variables for GitHub Actions
        if (isCI) {
          console.log('Setting GitHub Actions outputs...');
          console.log(`::set-output name=total-size::${metrics.totalSize}`);
          console.log(`::set-output name=gzip-size::${metrics.totalGzipSize}`);
          if (comparison) {
            console.log(`::set-output name=size-diff::${comparison.changes.totalSize.diff}`);
            console.log(`::set-output name=size-diff-percent::${comparison.changes.totalSize.diffPercent}`);
          }
        }

      } catch (error) {
        console.error('❌ Bundle Watch error:', error);
        if (options.failOnSizeIncrease) {
          throw error;
        }
      }
    },
  };
}

// Export default
export default bundleWatch;
