/**
 * Main withBundleWatch wrapper function
 *
 * This is the primary API for integrating BundleWatch with Next.js.
 * It automatically detects whether Webpack or Turbopack is being used
 * and configures the appropriate analysis method.
 */

import type { BundleWatchNextOptions, ResolvedBundleWatchOptions } from './types.js';
import { resolveBundler, isCI } from './detect.js';
import { injectWebpackPlugin } from './webpack-mode.js';
import { setupTurbopackAnalysis } from './turbopack-mode.js';

/**
 * Base type for Next.js config
 * Using a minimal constraint to support all Next.js versions (14-16+)
 */
interface NextConfigBase {
  [key: string]: unknown;
}

/**
 * Resolve options with defaults
 */
function resolveOptions(options: BundleWatchNextOptions): ResolvedBundleWatchOptions {
  return {
    enabled: options.enabled ?? true,
    bundler: options.bundler ?? 'auto',
    verbose: options.verbose ?? false,
    printReport: options.printReport ?? true,
    saveToGit: options.saveToGit, // undefined means auto-detect (CI = true)
    compareAgainst: options.compareAgainst ?? 'main',
    failOnSizeIncrease: options.failOnSizeIncrease ?? false,
    sizeIncreaseThreshold: options.sizeIncreaseThreshold ?? 10,
    generateDashboard: options.generateDashboard ?? false,
    dashboardPath: options.dashboardPath ?? './bundle-report',
    extractModules: options.extractModules ?? true,
    buildDependencyGraph: options.buildDependencyGraph ?? true,
    generateRecommendations: options.generateRecommendations ?? true,
  };
}

/**
 * Wrap a Next.js configuration with BundleWatch integration
 *
 * @example
 * ```typescript
 * // next.config.ts
 * import { withBundleWatch } from '@milencode/bundlewatch-nextjs';
 *
 * const nextConfig = {
 *   // your config
 * };
 *
 * export default withBundleWatch(nextConfig, {
 *   compareAgainst: 'main',
 *   generateDashboard: true,
 * });
 * ```
 *
 * @example With Turbopack (Next.js 16+)
 * ```typescript
 * // The wrapper auto-detects Turbopack usage
 * // Just run: next build --turbo
 * // Or set: TURBOPACK=1 next build
 * export default withBundleWatch(nextConfig);
 * ```
 */
export function withBundleWatch<T extends NextConfigBase>(
  nextConfig: T = {} as T,
  options: BundleWatchNextOptions = {}
): T {
  const resolvedOptions = resolveOptions(options);

  // Early return if disabled
  if (!resolvedOptions.enabled) {
    return nextConfig;
  }

  // Resolve saveToGit based on CI environment if not explicitly set
  if (resolvedOptions.saveToGit === undefined) {
    resolvedOptions.saveToGit = isCI();
  }

  // Detect bundler
  const bundler = resolveBundler(resolvedOptions.bundler, nextConfig);

  if (bundler === 'turbopack') {
    // Turbopack mode: Set up post-build analysis
    setupTurbopackAnalysis(resolvedOptions);
    return nextConfig; // No config modification needed
  }

  // Webpack mode: Inject the plugin
  return injectWebpackPlugin(nextConfig, resolvedOptions);
}

/**
 * Default export for convenience
 */
export default withBundleWatch;
