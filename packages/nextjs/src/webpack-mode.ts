/**
 * Webpack mode - injects the webpack plugin into Next.js config
 */

import { bundleWatchPlugin } from '@milencode/bundlewatch-webpack-plugin';
import type { ResolvedBundleWatchOptions } from './types.js';

// Minimal Next.js types to avoid requiring next as a direct dependency
interface WebpackConfig {
  plugins: unknown[];
}

interface WebpackContext {
  isServer: boolean;
  dev: boolean;
  buildId: string;
}

/**
 * Next.js config base type
 */
interface NextConfigBase {
  [key: string]: unknown;
}

/**
 * Inject the BundleWatch webpack plugin into Next.js config
 */
export function injectWebpackPlugin<T extends NextConfigBase>(
  nextConfig: T,
  options: ResolvedBundleWatchOptions
): T {
  const originalWebpack = nextConfig.webpack as
    | ((config: WebpackConfig, context: WebpackContext) => WebpackConfig)
    | null
    | undefined;

  const result = {
    ...nextConfig,
    webpack: (config: WebpackConfig, context: WebpackContext) => {
      // Run original webpack config first
      let modifiedConfig = config;
      if (originalWebpack) {
        modifiedConfig = originalWebpack(config, context);
      }

      // Only inject on client bundle (not server)
      if (!context.isServer) {
        modifiedConfig.plugins.push(
          bundleWatchPlugin({
            enabled: options.enabled,
            verbose: options.verbose,
            printReport: options.printReport,
            saveToGit: options.saveToGit,
            compareAgainst: options.compareAgainst,
            failOnSizeIncrease: options.failOnSizeIncrease,
            sizeIncreaseThreshold: options.sizeIncreaseThreshold,
            generateDashboard: options.generateDashboard,
            dashboardPath: options.dashboardPath,
            extractModules: options.extractModules,
            buildDependencyGraph: options.buildDependencyGraph,
            generateRecommendations: options.generateRecommendations,
          })
        );
      }

      return modifiedConfig;
    },
  };

  // Return with same type as input
  return result as T;
}
