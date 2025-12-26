/**
 * Attribution Engine
 * Combines all extractors to attribute modules to their sources
 */

export * from './types.js';

import type {
  ModuleAttribution,
  AttributionOptions,
  FrameworkType,
  LocalCategory,
} from './types.js';
import {
  DEFAULT_LOCAL_DIRECTORIES,
  FRAMEWORK_PATTERNS,
  CATEGORY_PATTERNS,
} from './types.js';
import { extractNpmAttribution, isNpmPath } from './extractors/npm.js';
import { extractLocalAttribution, isLocalPath } from './extractors/local.js';
import { extractFrameworkAttribution, isFrameworkPath, detectFramework } from './extractors/framework.js';
import { extractWorkspaceAttribution, isWorkspacePath } from './extractors/workspace.js';

// Re-export extractors for direct use
export { extractNpmAttribution, isNpmPath } from './extractors/npm.js';
export { extractLocalAttribution, isLocalPath } from './extractors/local.js';
export { extractFrameworkAttribution, isFrameworkPath, detectFramework } from './extractors/framework.js';
export { extractWorkspaceAttribution, isWorkspacePath } from './extractors/workspace.js';

/**
 * Default attribution options
 */
const DEFAULT_OPTIONS: Required<AttributionOptions> = {
  customDirectories: [],
  maxLocalDepth: 3,
  frameworkDetection: true,
  extractVersions: true,
  projectRoot: process.cwd(),
};

/**
 * Attribute a module to its source
 * Tries extractors in order of specificity
 */
export function attributeModule(
  path: string,
  options: AttributionOptions = {},
): ModuleAttribution {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // 1. Try framework detection first (most specific for framework internals)
  if (opts.frameworkDetection) {
    const frameworkResult = extractFrameworkAttribution(path, opts, FRAMEWORK_PATTERNS);
    if (frameworkResult) {
      return frameworkResult;
    }
  }

  // 2. Try npm package extraction
  const npmResult = extractNpmAttribution(path, opts);
  if (npmResult) {
    return npmResult;
  }

  // 3. Try workspace package detection
  const workspaceResult = extractWorkspaceAttribution(path, opts);
  if (workspaceResult) {
    return workspaceResult;
  }

  // 4. Try local code extraction
  const localResult = extractLocalAttribution(
    path,
    opts,
    DEFAULT_LOCAL_DIRECTORIES,
    CATEGORY_PATTERNS,
  );
  if (localResult) {
    return localResult;
  }

  // 5. Fallback to unknown
  return {
    name: extractFallbackName(path),
    type: 'unknown',
    confidence: 50,
    normalizedPath: `unknown:${path}`,
    originalPath: path,
  };
}

/**
 * Extract a reasonable fallback name from any path
 */
function extractFallbackName(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/');

  // Remove common extensions
  let name = normalizedPath.replace(/\.(ts|tsx|js|jsx|vue|svelte|mjs|cjs|json)$/, '');

  // Get the last meaningful segment
  const segments = name.split('/').filter(Boolean);
  if (segments.length === 0) {
    return 'unknown';
  }

  // Take up to last 2 segments
  const relevantSegments = segments.slice(-2);

  // Remove index from the end
  if (relevantSegments.length > 1 && relevantSegments[relevantSegments.length - 1] === 'index') {
    relevantSegments.pop();
  }

  return relevantSegments.join('/') || 'unknown';
}

/**
 * Batch attribute multiple modules
 */
export function attributeModules(
  paths: string[],
  options: AttributionOptions = {},
): ModuleAttribution[] {
  return paths.map(path => attributeModule(path, options));
}

/**
 * Group modules by their attribution
 */
export function groupByAttribution(
  attributions: ModuleAttribution[],
): Map<string, ModuleAttribution[]> {
  const groups = new Map<string, ModuleAttribution[]>();

  for (const attr of attributions) {
    const key = attr.normalizedPath;
    const existing = groups.get(key) || [];
    existing.push(attr);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Get a simple package name for backwards compatibility
 * This is the main function that replaces extractPackageName in parsers
 */
export function extractPackageName(path: string): string {
  const attribution = attributeModule(path, { frameworkDetection: false });
  return attribution.name;
}

/**
 * Class-based API for more complex use cases
 */
export class AttributionEngine {
  private options: Required<AttributionOptions>;

  constructor(options: AttributionOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Attribute a single module
   */
  attribute(path: string): ModuleAttribution {
    return attributeModule(path, this.options);
  }

  /**
   * Attribute multiple modules
   */
  attributeMany(paths: string[]): ModuleAttribution[] {
    return attributeModules(paths, this.options);
  }

  /**
   * Group attributed modules
   */
  group(attributions: ModuleAttribution[]): Map<string, ModuleAttribution[]> {
    return groupByAttribution(attributions);
  }

  /**
   * Convenience: attribute and group in one call
   */
  attributeAndGroup(paths: string[]): Map<string, ModuleAttribution[]> {
    const attributions = this.attributeMany(paths);
    return this.group(attributions);
  }

  /**
   * Get simple package name (backwards compatibility)
   */
  getPackageName(path: string): string {
    return extractPackageName(path);
  }
}
