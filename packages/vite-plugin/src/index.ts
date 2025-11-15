/**
 * @milencode/bundlewatch-vite-plugin
 * Vite plugin for automatic bundle analysis
 */

import type { Plugin, ResolvedConfig } from 'vite';
import type { OutputBundle } from 'rollup';
import { GitStorage, ComparisonEngine, ReportGenerator } from '@milencode/bundlewatch-core';
import type { BundleWatchConfig, BuildMetrics } from '@milencode/bundlewatch-core';
import { createAnalyzerState, collectModuleInfo, analyzeBundle } from '@milencode/bundlewatch-parsers';
import type { AnalyzerState } from '@milencode/bundlewatch-parsers';
import { generateEnhancedDashboard } from '@milencode/bundlewatch-parsers';
import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

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

const defaultOptions: ViteBundleWatchOptions = {
  enabled: true,
  printReport: true,
  saveToGit: undefined, // Will be determined based on CI env
  compareAgainst: 'main',
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,
  generateDashboard: false,
  dashboardPath: './bundle-report',
};

/**
 * Vite plugin for bundle watching and analysis
 */
export function bundleWatch(userOptions: ViteBundleWatchOptions = {}): Plugin {
  const options = { ...defaultOptions, ...userOptions };
  let config: ResolvedConfig;
  let analyzerState: AnalyzerState | null = null;
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

    async buildStart() {
      if (!options.enabled) return;
      console.log('📊 Bundle Watch: Starting analysis...');

      // Get git info
      const commit = await GitStorage.getCurrentCommit(config.root);
      const branch = await GitStorage.getCurrentBranch(config.root);

      // Create analyzer state
      analyzerState = createAnalyzerState({
        branch,
        commit,
        buildStartTime: Date.now(),
        realCompression: true,
        analyzeGraph: true,
        generateRecommendations: true,
        analyzeSourceMaps: true,
      });
    },

    moduleParsed(moduleInfo) {
      if (!options.enabled || !analyzerState) return;

      // Collect module information during build
      analyzerState = collectModuleInfo(analyzerState, {
        id: moduleInfo.id,
        code: moduleInfo.code,
        importedIds: moduleInfo.importedIds || [],
      });
    },

    async generateBundle(_options, bundle: OutputBundle) {
      if (!options.enabled || !analyzerState) return;

      try {
        // Analyze the complete bundle
        const metrics = await analyzeBundle(analyzerState, bundle);

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

        // Print report to console
        if (options.printReport) {
          console.log(reporter.generateConsoleOutput(metrics, comparison));
        }

        // Generate enhanced dashboard
        if (options.generateDashboard) {
          const dashboardDir = resolve(config.root, options.dashboardPath!);
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
