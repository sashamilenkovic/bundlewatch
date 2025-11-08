/**
 * @milencode/bundlewatch-next-plugin
 * Bundle Watch plugin for Next.js with per-route analysis
 */

import { collectMetrics, compareMetrics, GitStorage, ReportGenerator, type BundleWatchConfig } from '@milencode/bundlewatch-core';
import { resolve, join } from 'path';
import { readFile, readdir } from 'fs/promises';
import type { NextConfig } from 'next';

export interface NextBundleWatchOptions extends Partial<BundleWatchConfig> {
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
   * Enable per-route analysis
   * @default true
   */
  perRoute?: boolean;

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
   * Route-specific budgets
   */
  budgets?: {
    [route: string]: {
      maxSize?: number;
      maxGzipSize?: number;
    };
  };

  /**
   * Next.js output directory
   * @default '.next'
   */
  outputDir?: string;
}

const defaultOptions: NextBundleWatchOptions = {
  enabled: true,
  printReport: true,
  saveToGit: undefined, // Will be determined based on CI env
  perRoute: true,
  compareAgainst: 'main',
  failOnSizeIncrease: false,
  sizeIncreaseThreshold: 10,
  outputDir: '.next',
};

/**
 * Analyze Next.js build output
 */
async function analyzeNextBuild(buildDir: string, options: NextBundleWatchOptions) {
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  const workingDir = process.cwd();

  // Determine output directory
  const nextDir = resolve(workingDir, options.outputDir || '.next');
  const staticDir = join(nextDir, 'static');
  
  console.warn('\n⚠️  DEPRECATED: @milencode/bundlewatch-next-plugin is deprecated.');
  console.warn('   Next.js has built-in bundle analysis. Consider using:');
  console.warn('   - next.config.js with webpack bundle analyzer');
  console.warn('   - @next/bundle-analyzer\n');

  console.log('📊 Bundle Watch: Analyzing Next.js build (legacy mode)...');

  try {
    // Collect metrics from static directory
    const metrics = await collectMetrics({
      outputDir: staticDir,
      branch: await GitStorage.getCurrentBranch(workingDir).catch(() => 'unknown'),
      commit: await GitStorage.getCurrentCommit(workingDir).catch(() => 'unknown'),
      buildStartTime: Date.now(),
      projectRoot: workingDir,
    });

    // Per-route analysis if enabled
    if (options.perRoute) {
      await analyzeRoutes(nextDir, metrics);
    }

    // Initialize storage if saving
    let comparison;
    if (options.saveToGit) {
      const storage = new GitStorage({
        branch: options.storage?.branch || 'bundlewatch-data',
        workingDir,
      });

      // Load baseline for comparison
      if (options.compareAgainst) {
        const baseline = await storage.load(options.compareAgainst);
        if (baseline) {
          comparison = compareMetrics(metrics, baseline, options.compareAgainst);
        }
      }

      // Save metrics
      console.log('💾 Saving metrics to git...');
      await storage.save(metrics);
      console.log('✅ Metrics saved successfully');
    }

    // Print report
    if (options.printReport) {
      const reporter = new ReportGenerator();
      const report = reporter.generateConsoleOutput(metrics, comparison);
      console.log(report);
    }

    // Check budgets
    if (options.budgets) {
      checkBudgets(metrics, options.budgets);
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
    console.error('❌ Bundle Watch error:', error);
    if (options.failOnSizeIncrease) {
      throw error;
    }
  }
}

/**
 * Analyze routes from Next.js build manifest
 */
async function analyzeRoutes(nextDir: string, metrics: any) {
  try {
    // Read build manifest for route information
    const manifestPath = join(nextDir, 'build-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    
    console.log('\n📄 Per-Route Analysis:');
    console.log('══════════════════════════════════════════════════');
    
    // Analyze each page
    for (const [route, files] of Object.entries(manifest.pages) as [string, string[]][]) {
      const routeSize = files.reduce((total, file) => {
        const bundle = metrics.bundles.find((b: any) => b.name.includes(file));
        return total + (bundle?.size || 0);
      }, 0);
      
      if (routeSize > 0) {
        console.log(`\n${route === '/' ? '/ (Home)' : route}`);
        console.log(`  Bundle: ${formatBytes(routeSize)}`);
      }
    }
    
    console.log('\n══════════════════════════════════════════════════');
  } catch (error) {
    // Manifest not available, skip per-route analysis
    console.log('⚠️  Could not analyze routes (manifest not found)');
  }
}

/**
 * Check if any budgets are exceeded
 */
function checkBudgets(metrics: any, budgets: NonNullable<NextBundleWatchOptions['budgets']>) {
  for (const [route, budget] of Object.entries(budgets)) {
    // Find bundles matching this route
    const routeBundles = metrics.bundles.filter((b: any) => 
      b.name.includes(route.replace(/\*/g, ''))
    );
    
    const totalSize = routeBundles.reduce((sum: number, b: any) => sum + b.size, 0);
    const totalGzip = routeBundles.reduce((sum: number, b: any) => sum + b.gzipSize, 0);
    
    if (budget.maxSize && totalSize > budget.maxSize) {
      console.warn(
        `⚠️  Route ${route} exceeds size budget: ${formatBytes(totalSize)} > ${formatBytes(budget.maxSize)}`
      );
    }
    
    if (budget.maxGzipSize && totalGzip > budget.maxGzipSize) {
      console.warn(
        `⚠️  Route ${route} exceeds gzip budget: ${formatBytes(totalGzip)} > ${formatBytes(budget.maxGzipSize)}`
      );
    }
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Wrap Next.js config with Bundle Watch
 */
export function withBundleWatch(
  nextConfig: NextConfig = {},
  bundleWatchOptions: NextBundleWatchOptions = {}
): NextConfig {
  const options = { ...defaultOptions, ...bundleWatchOptions };
  
  if (!options.enabled) {
    return nextConfig;
  }

  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  
  // Default saveToGit based on CI environment
  if (options.saveToGit === undefined) {
    options.saveToGit = isCI;
  }

  return {
    ...nextConfig,
    webpack(config, context) {
      // Call original webpack function if it exists
      if (typeof nextConfig.webpack === 'function') {
        config = nextConfig.webpack(config, context);
      }

      // Only run on client builds during production
      if (!context.isServer && !context.dev) {
        // Hook into the build completion
        config.plugins = config.plugins || [];
        
        // Add a plugin that runs after build completes
        const originalOnEnd = config.plugins.find((p: any) => p?.constructor?.name === 'WebpackManifestPlugin');
        
        // Create a custom plugin to run after build
        class BundleWatchPlugin {
          apply(compiler: any) {
            compiler.hooks.done.tapPromise('BundleWatchPlugin', async () => {
              // Run analysis after build completes
              await analyzeNextBuild(config.output.path, options);
            });
          }
        }
        
        config.plugins.push(new BundleWatchPlugin());
      }

      return config;
    },
  };
}

export default withBundleWatch;

