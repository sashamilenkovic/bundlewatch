/**
 * @milencode/bundlewatch-nextjs
 *
 * Next.js integration for BundleWatch - supports both Webpack and Turbopack
 *
 * @example Basic usage
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
 * @example Webpack mode (Next.js 14-15)
 * ```bash
 * next build
 * ```
 *
 * @example Turbopack mode (Next.js 15-16+)
 * ```bash
 * # Auto-detected when using --turbo flag
 * next build --turbo
 *
 * # Or with explicit TURBOPACK_STATS for manual analysis
 * TURBOPACK_STATS=1 next build && bundlewatch analyze
 * ```
 */

// Main API
export { withBundleWatch, default } from './wrapper.js';

// Types
export type { BundleWatchNextOptions, BundlerType, ResolvedBundleWatchOptions } from './types.js';

// Utilities (for advanced usage)
export { detectBundler, isCI, resolveBundler } from './detect.js';
export { injectWebpackPlugin } from './webpack-mode.js';
export { setupTurbopackAnalysis, analyzeTurbopackBuild } from './turbopack-mode.js';
