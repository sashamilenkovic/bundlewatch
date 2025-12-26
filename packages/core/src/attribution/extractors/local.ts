/**
 * Local code extractor
 * Handles project source files with configurable depth
 */

import type {
  ModuleAttribution,
  AttributionOptions,
  LocalCategory,
  DEFAULT_LOCAL_DIRECTORIES,
  CATEGORY_PATTERNS,
} from '../types.js';

/**
 * Check if a path is local project code
 */
export function isLocalPath(
  path: string,
  customDirectories?: string[],
  localDirs: readonly string[] = [],
): boolean {
  const normalizedPath = path.replace(/\\/g, '/');

  // Not local if it's from node_modules
  if (normalizedPath.includes('node_modules') || normalizedPath.includes('.pnpm')) {
    return false;
  }

  // Check for common local directories
  const allDirs = [...localDirs, ...(customDirectories || [])];
  for (const dir of allDirs) {
    if (normalizedPath.includes(`/${dir}/`) || normalizedPath.startsWith(`${dir}/`)) {
      return true;
    }
  }

  // Check for relative paths (likely local)
  if (normalizedPath.startsWith('./') || normalizedPath.startsWith('../')) {
    return true;
  }

  // Check for absolute paths that don't look like packages
  if (normalizedPath.startsWith('/') && !normalizedPath.includes('node_modules')) {
    return true;
  }

  return false;
}

/**
 * Detect the category of local code
 */
export function detectCategory(
  path: string,
  categoryPatterns: Record<LocalCategory, RegExp[]>,
): LocalCategory {
  const normalizedPath = path.replace(/\\/g, '/').toLowerCase();

  for (const [category, patterns] of Object.entries(categoryPatterns) as [
    LocalCategory,
    RegExp[],
  ][]) {
    if (category === 'other') continue;
    for (const pattern of patterns) {
      if (pattern.test(normalizedPath)) {
        return category;
      }
    }
  }

  return 'other';
}

/**
 * Extract a friendly name from a local path with configurable depth
 */
export function extractLocalName(path: string, maxDepth: number = 3): string {
  const normalizedPath = path.replace(/\\/g, '/');

  // Remove common prefixes
  let cleanPath = normalizedPath
    .replace(/^\.\//, '')
    .replace(/^\//, '')
    .replace(/\.(ts|tsx|js|jsx|vue|svelte|mjs|cjs)$/, '');

  // Split into segments
  const segments = cleanPath.split('/').filter(Boolean);

  // Find the index of a known source directory
  const sourceDirs = ['src', 'app', 'pages', 'components', 'lib'];
  let startIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    if (sourceDirs.includes(segments[i])) {
      startIndex = i;
      break;
    }
  }

  // Take segments from the source dir up to maxDepth
  const relevantSegments = segments.slice(startIndex, startIndex + maxDepth);

  // Remove index files from the end
  if (relevantSegments.length > 1) {
    const last = relevantSegments[relevantSegments.length - 1];
    if (last === 'index' || last === 'mod') {
      relevantSegments.pop();
    }
  }

  return relevantSegments.join('/') || 'app';
}

/**
 * Extract local code attribution
 */
export function extractLocalAttribution(
  path: string,
  options: AttributionOptions = {},
  localDirs: readonly string[],
  categoryPatterns: Record<LocalCategory, RegExp[]>,
): ModuleAttribution | null {
  if (!isLocalPath(path, options.customDirectories, localDirs)) {
    return null;
  }

  const maxDepth = options.maxLocalDepth ?? 3;
  const name = extractLocalName(path, maxDepth);
  const category = detectCategory(path, categoryPatterns);

  return {
    name,
    type: 'local',
    confidence: 80,
    category,
    normalizedPath: `local:${name}`,
    originalPath: path,
  };
}
