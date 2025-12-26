/**
 * NPM package extractor
 * Handles node_modules paths including pnpm's nested structure
 */

import type { ModuleAttribution, AttributionOptions } from '../types.js';

/**
 * Check if a path is from node_modules
 */
export function isNpmPath(path: string): boolean {
  return path.includes('node_modules') || path.includes('.pnpm');
}

/**
 * Extract package name and version from npm module path
 *
 * Handles various formats:
 * - node_modules/react/index.js
 * - node_modules/@scope/package/index.js
 * - node_modules/.pnpm/react@18.2.0/node_modules/react/index.js
 * - node_modules/.pnpm/@scope+package@1.0.0/node_modules/@scope/package/index.js
 */
export function extractNpmAttribution(
  path: string,
  _options?: AttributionOptions,
): ModuleAttribution | null {
  if (!isNpmPath(path)) {
    return null;
  }

  // Normalize path separators
  const normalizedPath = path.replace(/\\/g, '/');

  let packageName: string | null = null;
  let version: string | undefined;
  let confidence = 90;

  // Try pnpm format first (more specific, higher confidence)
  // Format: .pnpm/package@version/node_modules/package/...
  // Or: .pnpm/@scope+package@version/node_modules/@scope/package/...
  const pnpmMatch = normalizedPath.match(
    /\.pnpm\/(@[^/]+\+[^@/]+|[^@/]+)@([^/]+)\/node_modules\/((?:@[^/]+\/)?[^/]+)/,
  );

  if (pnpmMatch) {
    const [, pnpmPackage, ver, actualPackage] = pnpmMatch;
    packageName = actualPackage;
    version = ver;
    confidence = 95;

    // For scoped packages in pnpm, the format uses + instead of /
    // e.g., @scope+package becomes @scope/package
    if (pnpmPackage.startsWith('@') && pnpmPackage.includes('+')) {
      // Already have the actual package name from the path
    }
  }

  // Try standard node_modules format
  if (!packageName) {
    // Match @scope/package or package after node_modules/
    const standardMatch = normalizedPath.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
    if (standardMatch) {
      packageName = standardMatch[1];
      confidence = 85;

      // Skip .pnpm directory itself
      if (packageName === '.pnpm') {
        return null;
      }
    }
  }

  if (!packageName) {
    return null;
  }

  // Clean up package name
  packageName = packageName.replace(/\/$/, '');

  // Skip internal/virtual modules
  if (packageName.startsWith('.') || packageName.startsWith('_')) {
    return null;
  }

  return {
    name: packageName,
    type: 'npm',
    confidence,
    version,
    normalizedPath: `npm:${packageName}`,
    originalPath: path,
  };
}

/**
 * Extract just the package name (for backwards compatibility)
 */
export function extractPackageName(path: string): string {
  const attribution = extractNpmAttribution(path);
  return attribution?.name || 'unknown';
}
