/**
 * @milencode/bundlewatch-vite-plugin
 * Vite plugin for automatic bundle analysis
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { BundleWatchConfig, Comparison } from '@milencode/bundlewatch-core';
import {
  ComparisonEngine,
  generateCompactSummary,
  GitStorage,
  ReportGenerator,
} from '@milencode/bundlewatch-core';
import type { AnalyzerState } from '@milencode/bundlewatch-parsers';
import {
  analyzeBundle,
  collectModuleInfo,
  createAnalyzerState,
  generateEnhancedDashboard,
} from '@milencode/bundlewatch-parsers';
import type { OutputBundle } from 'rollup';
import type { Plugin, ResolvedConfig } from 'vite';

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

  /**
   * Print compact one-line summary instead of full report
   * Example: "148 KB gzip | -14 KB (-8.6%) vs main | PASS"
   * @default false
   */
  compactOutput?: boolean;
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
  compactOutput: false,
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
      // Detect SSR build for logging
      const isSSR = !!config.build?.ssr;
      const buildType = isSSR ? 'SSR/Server' : 'Client';
      console.log(`[bundlewatch] Starting ${buildType} analysis...`);

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

      // Skip node_modules and .pnpm to avoid cluttering the analysis
      if (moduleInfo.id.includes('node_modules') || moduleInfo.id.includes('.pnpm')) {
        return;
      }

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

        let comparison: Comparison | undefined;

        // Load baseline for comparison (only when saveToGit is enabled, as it requires remote access)
        if (options.compareAgainst && options.saveToGit) {
          const baseline = await storage.load(options.compareAgainst);
          if (baseline) {
            comparison = analyzer.compare(metrics, baseline, options.compareAgainst);
          } else {
            // First run - no baseline found
            console.log(`\n[bundlewatch] No baseline found for '${options.compareAgainst}'.`);
            console.log('             This build will be saved as the initial baseline.');
            console.log('             To backfill history: npx bundlewatch backfill --last 10\n');
          }
        }

        // Print report to console
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
          const dashboardDir = resolve(config.root, options.dashboardPath!);

          // Detect SSR build to save to different file
          const isSSR = !!config.build.ssr;
          const dashboardFilename = isSSR ? 'index-ssr.html' : 'index.html';
          const buildType = isSSR ? 'SSR/Server' : 'Client';

          try {
            mkdirSync(dashboardDir, { recursive: true });

            const dashboardHTML = generateEnhancedDashboard(metrics, comparison);
            const dashboardPath = resolve(dashboardDir, dashboardFilename);
            writeFileSync(dashboardPath, dashboardHTML);

            // Print clear path to dashboard
            console.log('');
            console.log('─'.repeat(50));
            console.log(`Dashboard (${buildType}):`);
            console.log(`  file://${dashboardPath}`);
            console.log('─'.repeat(50));
          } catch (dashboardError) {
            console.error('[bundlewatch] Failed to generate dashboard:', dashboardError);
          }
        }

        // Save to git storage
        if (options.saveToGit) {
          await storage.save(metrics);
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

        // Set environment variables for GitHub Actions
        if (isCI && process.env.GITHUB_OUTPUT) {
          console.log('Setting GitHub Actions outputs...');
          const outputs = [`total-size=${metrics.totalSize}`, `gzip-size=${metrics.totalGzipSize}`];
          if (comparison) {
            outputs.push(`size-diff=${comparison.changes.totalSize.diff}`);
            outputs.push(`size-diff-percent=${comparison.changes.totalSize.diffPercent}`);
          }

          // Write to GITHUB_OUTPUT file (new method)
          const { appendFileSync } = await import('node:fs');
          for (const output of outputs) {
            appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
          }
        }
      } catch (error) {
        console.error('[bundlewatch] Error:', error);
        if (options.failOnSizeIncrease) {
          throw error;
        }
      }
    },
  };
}

// Export default
export default bundleWatch;
