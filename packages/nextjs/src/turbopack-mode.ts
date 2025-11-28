/**
 * Turbopack mode - sets up post-build analysis
 *
 * Since Turbopack doesn't support webpack plugins, we:
 * 1. Set TURBOPACK_STATS=1 to generate webpack-compatible stats
 * 2. Register a process exit hook to analyze after build completes
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';
import {
  GitStorage,
  ReportGenerator,
  compareMetrics,
  getCurrentCommit,
  getCurrentBranch,
} from '@milencode/bundlewatch-core';
import {
  parseWebpackStats,
  generateEnhancedDashboard,
  type WebpackStats,
} from '@milencode/bundlewatch-parsers';
import type { ResolvedBundleWatchOptions } from './types.js';

const STATS_PATH = '.next/server/webpack-stats.json';

/**
 * Analyze Turbopack build output
 */
export async function analyzeTurbopackBuild(
  options: ResolvedBundleWatchOptions,
  workingDir: string = process.cwd()
): Promise<void> {
  const statsPath = resolve(workingDir, STATS_PATH);

  if (!existsSync(statsPath)) {
    console.warn('\n📊 BundleWatch: Turbopack stats not found at', statsPath);
    console.warn('   Ensure TURBOPACK_STATS=1 environment variable is set before build.\n');
    console.warn('   Example: TURBOPACK_STATS=1 next build\n');
    return;
  }

  try {
    // Read and parse stats
    const statsContent = readFileSync(statsPath, 'utf-8');
    const stats: WebpackStats = JSON.parse(statsContent);

    // Get git info
    let commit = 'unknown';
    let branch = 'unknown';

    try {
      commit = await getCurrentCommit(workingDir);
      branch = await getCurrentBranch(workingDir);
    } catch {
      // Not a git repo, use defaults
    }

    // Parse using existing webpack parser (Turbopack stats are webpack-compatible)
    const metrics = parseWebpackStats(stats, {
      branch,
      commit,
      estimateCompression: true,
      extractModules: options.extractModules,
      buildDependencyGraph: options.buildDependencyGraph,
      generateRecommendations: options.generateRecommendations,
    });

    // Initialize tools
    const storage = new GitStorage({ workingDir });
    const reporter = new ReportGenerator();

    let comparison;

    // Load baseline for comparison
    if (options.compareAgainst) {
      try {
        const baseline = await storage.load(options.compareAgainst);
        if (baseline) {
          comparison = compareMetrics(metrics, baseline, options.compareAgainst);
        }
      } catch {
        // No baseline available
      }
    }

    // Print report
    if (options.printReport) {
      console.log('\n' + reporter.generateConsoleOutput(metrics, comparison));
    }

    // Generate dashboard
    if (options.generateDashboard) {
      const dashboardDir = resolve(workingDir, options.dashboardPath);
      mkdirSync(dashboardDir, { recursive: true });
      const dashboardHTML = generateEnhancedDashboard(metrics, comparison);
      writeFileSync(join(dashboardDir, 'index.html'), dashboardHTML);
      console.log(`📊 Dashboard saved to ${dashboardDir}/index.html`);
    }

    // Save to git
    if (options.saveToGit) {
      try {
        await storage.save(metrics);
        console.log('📊 Metrics saved to bundlewatch-data branch');
      } catch (error) {
        console.error('📊 Failed to save metrics:', error);
      }
    }

    // Check thresholds
    if (options.failOnSizeIncrease && comparison) {
      const increase = comparison.changes.totalSize.diffPercent;
      if (increase > options.sizeIncreaseThreshold) {
        console.error(
          `\n❌ Bundle size increased by ${increase.toFixed(1)}% ` +
            `(threshold: ${options.sizeIncreaseThreshold}%)\n`
        );
        process.exitCode = 1;
      }
    }
  } catch (error) {
    console.error('📊 BundleWatch: Error analyzing Turbopack build:', error);
  }
}

/**
 * Setup Turbopack analysis hooks
 *
 * This function:
 * 1. Sets TURBOPACK_STATS=1 to enable stats generation
 * 2. Registers a beforeExit hook to analyze after build
 */
export function setupTurbopackAnalysis(options: ResolvedBundleWatchOptions): void {
  // Enable Turbopack stats generation
  process.env.TURBOPACK_STATS = '1';

  // Track if we've already analyzed
  let analyzed = false;

  const runAnalysis = async () => {
    if (analyzed) return;
    analyzed = true;

    // Small delay to ensure stats file is fully written
    await new Promise((resolve) => setTimeout(resolve, 100));
    await analyzeTurbopackBuild(options);
  };

  // Hook into process exit for production builds
  process.on('beforeExit', () => {
    runAnalysis().catch(console.error);
  });

  console.log('📊 BundleWatch: Turbopack mode enabled (analysis will run after build)');
}
