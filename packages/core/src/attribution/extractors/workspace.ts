/**
 * Workspace extractor
 * Handles monorepo package detection
 */

import type { ModuleAttribution, AttributionOptions } from '../types.js';

/**
 * Common workspace/monorepo patterns
 */
const WORKSPACE_PATTERNS = [
  // pnpm workspace
  /packages\/([^/]+)\//,
  /apps\/([^/]+)\//,
  /libs\/([^/]+)\//,
  /modules\/([^/]+)\//,

  // Scoped packages in node_modules that might be workspace packages
  /@([^/]+)\/([^/]+)/,
];

/**
 * Check if a path looks like a workspace package
 */
export function isWorkspacePath(path: string, projectRoot?: string): boolean {
  const normalizedPath = path.replace(/\\/g, '/');

  // If it's in node_modules but is a scoped package matching project scope
  if (normalizedPath.includes('node_modules')) {
    // Could be a workspace package symlinked in node_modules
    // We'd need to check package.json to be sure
    return false;
  }

  // Check for common workspace directory patterns
  for (const pattern of WORKSPACE_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract workspace package name
 */
export function extractWorkspaceName(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/');

  // Try each pattern
  for (const pattern of WORKSPACE_PATTERNS) {
    const match = normalizedPath.match(pattern);
    if (match) {
      // For scoped packages, combine scope and name
      if (match.length === 3) {
        return `@${match[1]}/${match[2]}`;
      }
      return match[1];
    }
  }

  return 'workspace';
}

/**
 * Extract workspace package attribution
 */
export function extractWorkspaceAttribution(
  path: string,
  options: AttributionOptions = {},
): ModuleAttribution | null {
  if (!isWorkspacePath(path, options.projectRoot)) {
    return null;
  }

  const name = extractWorkspaceName(path);

  return {
    name,
    type: 'workspace',
    confidence: 75,
    normalizedPath: `workspace:${name}`,
    originalPath: path,
  };
}
