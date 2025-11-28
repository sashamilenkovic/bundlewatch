/**
 * Bundler detection for Next.js
 * Determines whether Webpack or Turbopack is being used
 */

import type { BundlerType } from './types.js';

// Use a more specific type for Next.js config
interface NextConfigLike {
  experimental?: {
    turbo?: unknown;
  };
  turbopack?: unknown;
}

/**
 * Detect which bundler Next.js is using
 *
 * Detection order:
 * 1. TURBOPACK environment variable (explicit override)
 * 2. NEXT_TURBOPACK environment variable
 * 3. CLI arguments (--turbo, --turbopack)
 * 4. Next.js config (turbopack or experimental.turbo)
 * 5. Default to webpack for backwards compatibility
 */
export function detectBundler(nextConfig: NextConfigLike = {}): 'webpack' | 'turbopack' {
  // Check explicit environment variables
  if (process.env.TURBOPACK === '1' || process.env.TURBOPACK === 'true') {
    return 'turbopack';
  }

  if (process.env.NEXT_TURBOPACK === '1' || process.env.NEXT_TURBOPACK === 'true') {
    return 'turbopack';
  }

  // Check CLI arguments
  const args = process.argv.join(' ');
  if (args.includes('--turbo') || args.includes('--turbopack')) {
    return 'turbopack';
  }

  // Check Next.js config for Turbopack settings
  // Next.js 16+: turbopack is top-level
  if (nextConfig.turbopack !== undefined) {
    return 'turbopack';
  }

  // Next.js 15.x: experimental.turbo
  if (nextConfig.experimental?.turbo !== undefined) {
    return 'turbopack';
  }

  // Default to webpack for backwards compatibility
  return 'webpack';
}

/**
 * Check if we're running in a CI environment
 */
export function isCI(): boolean {
  return (
    process.env.CI === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITLAB_CI === 'true' ||
    process.env.CIRCLECI === 'true' ||
    process.env.JENKINS_URL !== undefined ||
    process.env.TRAVIS === 'true'
  );
}

/**
 * Resolve the bundler type from options
 */
export function resolveBundler(
  bundlerOption: BundlerType,
  nextConfig: NextConfigLike = {}
): 'webpack' | 'turbopack' {
  if (bundlerOption === 'auto') {
    return detectBundler(nextConfig);
  }
  return bundlerOption;
}
