/**
 * Analyze command - post-build bundle analysis
 * Works with any Next.js build (webpack or turbopack)
 */

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { readFile, stat, writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import {
  GitStorage,
  ReportGenerator,
  compareMetrics,
  getCurrentCommit,
  getCurrentBranch,
  type BuildMetrics,
} from '@milencode/bundlewatch-core';
import {
  parseWebpackStats,
  generateEnhancedDashboard,
  type WebpackStats,
} from '@milencode/bundlewatch-parsers';
import { analyzeBuildOutput } from '../utils/hybrid-analyzer.js';

interface AnalyzeOptions {
  dir?: string;
  saveToGit?: boolean;
  compareAgainst?: string;
  generateDashboard?: boolean;
  dashboardPath?: string;
  failOnSizeIncrease?: boolean;
  sizeIncreaseThreshold?: string;
  realCompression?: boolean;
  extractModules?: boolean;
}

type BundlerType = 'turbopack' | 'webpack' | 'vite' | 'unknown';

interface AnalysisResult {
  metrics: BuildMetrics;
  bundler: BundlerType;
  strategy: string;
}

/**
 * Detect which bundler was used and find stats file
 */
async function detectBuildOutput(projectRoot: string): Promise<{
  bundler: BundlerType;
  statsPath: string | null;
  strategy: string;
}> {
  const nextDir = join(projectRoot, '.next');

  // Check for Turbopack stats (from TURBOPACK_STATS=1)
  const turbopackStatsPath = join(nextDir, 'server', 'webpack-stats.json');
  try {
    const stats = await stat(turbopackStatsPath);
    if (stats.isFile()) {
      // Read file to check if it's actually Turbopack or webpack
      const content = await readFile(turbopackStatsPath, 'utf-8');
      const json = JSON.parse(content);

      // Turbopack stats have different characteristics
      // For now, we assume if this file exists and .next exists, it's from Turbopack
      // since webpack stats are usually in a different location
      const isTurbopack = !json.hash; // Webpack stats have a hash field

      return {
        bundler: isTurbopack ? 'turbopack' : 'webpack',
        statsPath: turbopackStatsPath,
        strategy: isTurbopack ? 'turbopack-stats' : 'webpack-stats',
      };
    }
  } catch {
    // File doesn't exist
  }

  // Check for webpack stats in common locations
  const webpackStatsPaths = [
    join(projectRoot, 'stats.json'),
    join(projectRoot, 'dist', 'stats.json'),
    join(projectRoot, 'build', 'stats.json'),
    join(nextDir, 'stats.json'),
  ];

  for (const statsPath of webpackStatsPaths) {
    try {
      const stats = await stat(statsPath);
      if (stats.isFile()) {
        return {
          bundler: 'webpack',
          statsPath,
          strategy: 'webpack-stats',
        };
      }
    } catch {
      // Continue to next path
    }
  }

  // Check for Vite manifest
  const viteManifestPaths = [
    join(projectRoot, 'dist', '.vite', 'manifest.json'),
    join(projectRoot, 'dist', 'manifest.json'),
  ];

  for (const manifestPath of viteManifestPaths) {
    try {
      const stats = await stat(manifestPath);
      if (stats.isFile()) {
        return {
          bundler: 'vite',
          statsPath: manifestPath,
          strategy: 'vite-manifest',
        };
      }
    } catch {
      // Continue
    }
  }

  // Check if .next directory exists (Next.js without stats)
  try {
    const nextStats = await stat(nextDir);
    if (nextStats.isDirectory()) {
      return {
        bundler: 'unknown',
        statsPath: null,
        strategy: 'file-scan',
      };
    }
  } catch {
    // Not a Next.js project
  }

  return {
    bundler: 'unknown',
    statsPath: null,
    strategy: 'file-scan',
  };
}

/**
 * Analyze build using stats file or fallback methods
 */
async function analyzeBuild(
  projectRoot: string,
  options: AnalyzeOptions
): Promise<AnalysisResult> {
  const detection = await detectBuildOutput(projectRoot);

  // Get git info
  let commit = 'unknown';
  let branch = 'unknown';

  try {
    commit = await getCurrentCommit(projectRoot);
    branch = await getCurrentBranch(projectRoot);
  } catch {
    // Not a git repo, use defaults
  }

  // If we have stats, use the parser
  if (detection.statsPath && (detection.strategy === 'turbopack-stats' || detection.strategy === 'webpack-stats')) {
    const content = await readFile(detection.statsPath, 'utf-8');
    const stats: WebpackStats = JSON.parse(content);

    const metrics = parseWebpackStats(stats, {
      commit,
      branch,
      estimateCompression: !options.realCompression,
      extractModules: options.extractModules ?? true,
      buildDependencyGraph: true,
      generateRecommendations: true,
    });

    return {
      metrics,
      bundler: detection.bundler,
      strategy: detection.strategy,
    };
  }

  // Fallback to hybrid analyzer
  const metrics = await analyzeBuildOutput(
    projectRoot,
    commit,
    branch,
    new Date().toISOString(),
    0
  );

  return {
    metrics,
    bundler: detection.bundler,
    strategy: detection.strategy,
  };
}

/**
 * Analyze command implementation
 */
async function analyze(cmdOptions: AnalyzeOptions) {
  const spinner = ora();
  const projectRoot = resolve(cmdOptions.dir || process.cwd());

  console.log(chalk.bold('\n📊 BundleWatch Analyze\n'));

  try {
    // Detect and analyze build
    spinner.start('Detecting build output...');
    const result = await analyzeBuild(projectRoot, cmdOptions);

    const bundlerLabel = result.bundler === 'turbopack'
      ? chalk.cyan('Turbopack')
      : result.bundler === 'webpack'
        ? chalk.yellow('Webpack')
        : result.bundler === 'vite'
          ? chalk.magenta('Vite')
          : chalk.gray('Unknown');

    spinner.succeed(
      `Analyzed ${bundlerLabel} build using ${chalk.dim(result.strategy)} strategy`
    );

    // Initialize tools
    const storage = new GitStorage({ workingDir: projectRoot });
    const reporter = new ReportGenerator();

    let comparison;

    // Load baseline for comparison
    if (cmdOptions.compareAgainst) {
      spinner.start(`Loading baseline from ${chalk.bold(cmdOptions.compareAgainst)}...`);
      try {
        const baseline = await storage.load(cmdOptions.compareAgainst);

        if (baseline) {
          comparison = compareMetrics(result.metrics, baseline, cmdOptions.compareAgainst);
          spinner.succeed(`Loaded baseline from ${chalk.bold(cmdOptions.compareAgainst)}`);
        } else {
          spinner.info(
            `No baseline found for ${chalk.bold(cmdOptions.compareAgainst)}. ` +
            `Run ${chalk.dim('bundlewatch backfill')} to populate history.`
          );
        }
      } catch (error) {
        spinner.warn(`Could not load baseline: ${error}`);
      }
    }

    // Print report
    console.log('\n' + reporter.generateConsoleOutput(result.metrics, comparison));

    // Generate dashboard
    if (cmdOptions.generateDashboard) {
      const dashboardDir = resolve(projectRoot, cmdOptions.dashboardPath || './bundle-report');
      spinner.start('Generating dashboard...');

      await mkdir(dashboardDir, { recursive: true });
      const dashboardHTML = generateEnhancedDashboard(result.metrics, comparison);
      await writeFile(join(dashboardDir, 'index.html'), dashboardHTML);

      spinner.succeed(`Dashboard saved to ${chalk.dim(dashboardDir + '/index.html')}`);
    }

    // Save to git
    if (cmdOptions.saveToGit) {
      spinner.start('Saving metrics to git...');
      try {
        await storage.save(result.metrics);
        spinner.succeed('Metrics saved to bundlewatch-data branch');
      } catch (error) {
        spinner.fail(`Failed to save metrics: ${error}`);
      }
    }

    // Check thresholds
    if (cmdOptions.failOnSizeIncrease && comparison) {
      const threshold = parseFloat(cmdOptions.sizeIncreaseThreshold || '10');
      const increase = comparison.changes.totalSize.diffPercent;

      if (increase > threshold) {
        console.error(chalk.red(
          `\n❌ Bundle size increased by ${increase.toFixed(1)}% ` +
          `(threshold: ${threshold}%)\n`
        ));
        process.exit(1);
      } else if (increase > 0) {
        console.log(chalk.yellow(
          `\n⚠️  Bundle size increased by ${increase.toFixed(1)}% ` +
          `(within ${threshold}% threshold)\n`
        ));
      } else {
        console.log(chalk.green(
          `\n✅ Bundle size is ${Math.abs(increase).toFixed(1)}% smaller\n`
        ));
      }
    }

    console.log(); // Final newline

  } catch (error) {
    spinner.fail('Analysis failed');
    console.error(chalk.red(`\n❌ Error: ${error}\n`));
    process.exit(1);
  }
}

/**
 * Command definition
 */
export const analyzeCommand = new Command('analyze')
  .description('Analyze build output (supports Next.js with Webpack or Turbopack)')
  .option('-d, --dir <path>', 'Project directory', process.cwd())
  .option('--save-to-git', 'Save metrics to bundlewatch-data branch')
  .option('--compare-against <branch>', 'Compare against baseline branch', 'main')
  .option('--generate-dashboard', 'Generate HTML dashboard')
  .option('--dashboard-path <path>', 'Dashboard output path', './bundle-report')
  .option('--fail-on-size-increase', 'Exit with error if size increases beyond threshold')
  .option('--size-increase-threshold <percent>', 'Size increase threshold percentage', '10')
  .option('--real-compression', 'Calculate real gzip/brotli sizes (slower but accurate)')
  .option('--extract-modules', 'Extract module-level metrics')
  .addHelpText('after', `
${chalk.bold('Examples:')}
  ${chalk.dim('# Analyze after a standard Next.js build')}
  $ next build && bundlewatch analyze

  ${chalk.dim('# Analyze Turbopack build with stats')}
  $ TURBOPACK_STATS=1 next build && bundlewatch analyze

  ${chalk.dim('# Save results and compare against main')}
  $ bundlewatch analyze --save-to-git --compare-against main

  ${chalk.dim('# Generate HTML dashboard')}
  $ bundlewatch analyze --generate-dashboard

  ${chalk.dim('# CI usage with threshold')}
  $ bundlewatch analyze --fail-on-size-increase --size-increase-threshold 5

${chalk.bold('Turbopack Support:')}
  Turbopack doesn't have a plugin API, so bundle analysis works differently:

  1. Set TURBOPACK_STATS=1 before running next build
  2. This generates .next/server/webpack-stats.json
  3. Run 'bundlewatch analyze' after the build completes

  Example:
    $ TURBOPACK_STATS=1 next build && bundlewatch analyze --save-to-git
`)
  .action(analyze);
