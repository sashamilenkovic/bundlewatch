/**
 * Webpack stats.json parser
 * Converts webpack stats output to BundleWatch BuildMetrics format
 */

import type {
  BuildMetrics,
  Bundle,
  DependencyGraph,
  DependencyMetrics,
  ModuleMetrics,
  OptimizationRecommendation,
} from '@milencode/bundlewatch-core';
import {
  aggregateDependencyMetrics,
  buildDependencyGraph,
  extractPackageName,
  generateOptimizationRecommendations,
  getModuleType,
} from './analysis-utils.js';
import { compressBoth } from './compression.js';

/**
 * Webpack module structure (used in both stats.modules and stats.chunks[].modules)
 */
export interface WebpackModule {
  id?: string | number;
  identifier?: string;
  name?: string;
  nameForCondition?: string;
  size: number;
  chunks?: Array<number | string>;
  reasons?: Array<{
    moduleIdentifier?: string;
    moduleName?: string;
  }>;
}

/**
 * Webpack chunk structure
 */
export interface WebpackChunk {
  id: number | string;
  names?: string[];
  files: string[];
  size: number;
  modules?: WebpackModule[];
  siblings?: Array<number | string>;
  parents?: Array<number | string>;
  children?: Array<number | string>;
  entry?: boolean;
  initial?: boolean;
  reason?: string;
}

/**
 * Webpack named chunk group (for friendly names)
 */
export interface WebpackNamedChunkGroup {
  name: string;
  chunks: Array<number | string>;
  assets?: Array<{ name: string; size?: number }>;
  childAssets?: Record<string, Array<{ name: string }>>;
}

/**
 * Webpack stats.json format
 */
export interface WebpackStats {
  time?: number;
  hash?: string;
  assets?: Array<{
    name: string;
    size: number;
    chunks?: Array<number | string>;
    chunkNames?: string[];
    info?: {
      chunkhash?: string;
      contenthash?: string;
      minimized?: boolean;
    };
  }>;
  chunks?: WebpackChunk[];
  modules?: WebpackModule[];
  namedChunkGroups?: Record<string, WebpackNamedChunkGroup>;
  entrypoints?: Record<string, WebpackNamedChunkGroup>;
}

export interface WebpackParseOptions {
  branch?: string;
  commit?: string;
  estimateCompression?: boolean;
  realCompression?: boolean;
  extractModules?: boolean;
  buildDependencyGraph?: boolean;
  generateRecommendations?: boolean;
  bundleContent?: Map<string, string>; // Map of filename -> content for real compression
}

/**
 * Build a map of chunk ID -> friendly name from namedChunkGroups/entrypoints
 */
function buildChunkNameMap(stats: WebpackStats): Map<string, string> {
  const chunkIdToName = new Map<string, string>();

  // Process named chunk groups (most reliable for friendly names)
  if (stats.namedChunkGroups) {
    for (const [name, group] of Object.entries(stats.namedChunkGroups)) {
      // Handle both array of chunk IDs and full chunk group object
      const chunks = Array.isArray(group)
        ? group
        : group.chunks && Array.isArray(group.chunks)
          ? group.chunks
          : [];
      for (const chunkId of chunks) {
        chunkIdToName.set(String(chunkId), name);
      }
    }
  }

  // Process entrypoints as fallback
  if (stats.entrypoints) {
    for (const [name, entry] of Object.entries(stats.entrypoints)) {
      // Handle both array of chunk IDs and full entrypoint object
      const chunks = Array.isArray(entry)
        ? entry
        : entry.chunks && Array.isArray(entry.chunks)
          ? entry.chunks
          : [];
      for (const chunkId of chunks) {
        // Don't override namedChunkGroups
        if (!chunkIdToName.has(String(chunkId))) {
          chunkIdToName.set(String(chunkId), name);
        }
      }
    }
  }

  // Also extract names from chunks themselves
  if (stats.chunks) {
    for (const chunk of stats.chunks) {
      const chunkId = String(chunk.id);
      if (!chunkIdToName.has(chunkId) && chunk.names && chunk.names.length > 0) {
        chunkIdToName.set(chunkId, chunk.names[0]);
      }
    }
  }

  return chunkIdToName;
}

/**
 * Build a map of asset filename -> chunk IDs from stats
 */
function buildAssetChunkMap(stats: WebpackStats): Map<string, Array<number | string>> {
  const assetToChunks = new Map<string, Array<number | string>>();

  // From assets directly
  if (stats.assets) {
    for (const asset of stats.assets) {
      if (asset.chunks && asset.chunks.length > 0) {
        assetToChunks.set(asset.name, asset.chunks);
      }
    }
  }

  // From chunks -> files mapping
  if (stats.chunks) {
    for (const chunk of stats.chunks) {
      for (const file of chunk.files) {
        const existing = assetToChunks.get(file) || [];
        if (!existing.includes(chunk.id)) {
          existing.push(chunk.id);
        }
        assetToChunks.set(file, existing);
      }
    }
  }

  return assetToChunks;
}

/**
 * Derive a friendly name for an asset based on file patterns
 * Uses file name patterns primarily since chunk groups can have many chunks with the same name
 */
function deriveFriendlyName(
  assetName: string,
  _chunkIds: Array<number | string>,
  _chunkNameMap: Map<string, string>,
): string {
  // Parse file patterns - these are more unique than chunk group names
  const fileName = assetName.split('/').pop() || assetName;

  // Next.js well-known patterns: framework-[hash].js, main-[hash].js, etc.
  const nextJsPatterns: Array<[RegExp, string]> = [
    [/^framework-[a-f0-9]+\.js$/, 'framework (react)'],
    [/^main-[a-f0-9]+\.js$/, 'main'],
    [/^main-app-[a-f0-9]+\.js$/, 'main-app'],
    [/^polyfills-[a-f0-9]+\.js$/, 'polyfills'],
    [/^webpack-[a-f0-9]+\.js$/, 'webpack-runtime'],
    [/^_app-[a-f0-9]+\.js$/, '_app'],
    [/^_error-[a-f0-9]+\.js$/, '_error'],
    [/^_buildManifest\.js$/, 'build-manifest'],
    [/^_ssgManifest\.js$/, 'ssg-manifest'],
  ];

  for (const [pattern, name] of nextJsPatterns) {
    if (pattern.test(fileName)) {
      return name;
    }
  }

  // Next.js app router path patterns in full asset path
  // e.g., static/chunks/app/layout-[hash].js -> app/layout
  // e.g., static/chunks/app/blog/page-[hash].js -> app/blog/page
  const appPathMatch = assetName.match(/app\/(.+)-[a-f0-9]+\.(js|css)$/);
  if (appPathMatch) {
    return `app/${appPathMatch[1]}`;
  }

  // Next.js pages router path patterns
  const pagesPathMatch = assetName.match(/pages\/(.+)-[a-f0-9]+\.js$/);
  if (pagesPathMatch) {
    return `pages/${pagesPathMatch[1]}`;
  }

  // Standalone layout/page/error patterns (only at start of filename, not in path)
  // These are typically entry points: layout-[hash].js -> layout
  const standaloneAppMatch = fileName.match(/^(layout|page|error|loading|not-found)-[a-f0-9]+\.js$/);
  if (standaloneAppMatch) {
    return standaloneAppMatch[1];
  }

  // Numeric chunk pattern: 123-[hash].js -> chunk-123
  // These are code-split chunks, the number is the chunk ID
  const numericChunk = fileName.match(/^(\d+)-[a-f0-9]+\.(js|css)$/);
  if (numericChunk) {
    return `chunk-${numericChunk[1]}`;
  }

  // Hex vendor chunks: abc123-[hash].js -> vendor-abc123
  // These are typically vendor/node_modules code splits
  const hexHashPattern = fileName.match(/^([a-f0-9]{6,10})-[a-f0-9]+\.(js|css)$/);
  if (hexHashPattern) {
    return `vendor-${hexHashPattern[1].slice(0, 6)}`;
  }

  // Generic hash pattern: [name]-[hash].ext -> [name]
  // Handles custom named chunks
  const hashPattern = fileName.match(/^(.+)-[a-f0-9]{8,}\.([a-z]+)$/);
  if (hashPattern) {
    return hashPattern[1];
  }

  // Manifest files - keep the manifest name
  if (fileName.includes('manifest')) {
    return fileName.replace(/\.js$/, '').replace(/\.json$/, '');
  }

  // Fallback: just clean up the filename
  return fileName.replace(/\.[a-z]+$/, '');
}

/**
 * Parse webpack stats.json into BuildMetrics
 * This is MUCH faster than re-analyzing files!
 */
export function parseWebpackStats(
  stats: WebpackStats,
  options: WebpackParseOptions = {},
): BuildMetrics {
  const bundles: Bundle[] = [];
  const modules: ModuleMetrics[] = [];
  const seenModuleIds = new Set<string>();

  // Build helper maps for chunk naming
  const chunkNameMap = buildChunkNameMap(stats);
  const assetChunkMap = buildAssetChunkMap(stats);

  // Process webpack assets (bundles)
  if (stats.assets) {
    for (const asset of stats.assets) {
      // Skip if asset has no name or size
      if (!asset.name || typeof asset.size !== 'number') {
        continue;
      }

      // Skip source maps and other metadata
      if (asset.name.endsWith('.map') || asset.name.endsWith('.LICENSE.txt')) {
        continue;
      }

      let gzipSize = 0;
      let brotliSize = 0;

      // Use real compression if content is available
      if (options.realCompression && options.bundleContent?.has(asset.name)) {
        const content = options.bundleContent.get(asset.name)!;
        const compressed = compressBoth(content);
        gzipSize = compressed.gzip;
        brotliSize = compressed.brotli;
      } else if (options.estimateCompression !== false) {
        // Fall back to estimates
        gzipSize = Math.round(asset.size * 0.3);
        brotliSize = Math.round(gzipSize * 0.85);
      }

      // Get chunk IDs for this asset
      const chunkIds = assetChunkMap.get(asset.name) || asset.chunks || [];

      // Derive a human-readable name
      const friendlyName = deriveFriendlyName(asset.name, chunkIds, chunkNameMap);

      bundles.push({
        name: asset.name,
        friendlyName,
        size: asset.size,
        gzipSize,
        brotliSize,
        type: getFileType(asset.name),
        path: asset.name,
      });
    }
  }

  // Extract module-level metrics if requested
  if (options.extractModules) {
    // Helper to process a single module
    const processModule = (module: WebpackModule, chunkId?: string | number) => {
      if (!module.name || typeof module.size !== 'number') {
        return;
      }

      // Use nameForCondition if available (more readable), fallback to identifier
      const moduleId = module.identifier || module.name;

      // Skip duplicates (modules can appear in multiple chunks)
      if (seenModuleIds.has(moduleId)) {
        return;
      }
      seenModuleIds.add(moduleId);

      // Use nameForCondition for better package extraction (it's the resolved path)
      const pathForExtraction = module.nameForCondition || module.name;
      const packageName = extractPackageName(pathForExtraction);

      // Estimate compression for modules
      let gzipSize = 0;
      let brotliSize = 0;
      if (options.estimateCompression !== false) {
        gzipSize = Math.round(module.size * 0.3);
        brotliSize = Math.round(gzipSize * 0.85);
      }

      // Collect chunk IDs from module and from context
      const moduleChunks = (module.chunks || []).map(String);
      if (chunkId !== undefined && !moduleChunks.includes(String(chunkId))) {
        moduleChunks.push(String(chunkId));
      }

      modules.push({
        id: moduleId,
        package: packageName,
        size: module.size,
        gzipSize,
        brotliSize,
        chunks: moduleChunks,
        importedBy: (module.reasons || [])
          .map(r => r.moduleIdentifier || r.moduleName)
          .filter((id): id is string => !!id),
        imports: [], // Webpack doesn't provide forward deps easily
        type: getModuleType(pathForExtraction),
        treeshakeable:
          pathForExtraction.includes('esm') ||
          pathForExtraction.includes('.mjs') ||
          pathForExtraction.includes('/es/'),
      });
    };

    // First: process top-level modules (if available)
    if (stats.modules) {
      for (const module of stats.modules) {
        processModule(module);
      }
    }

    // Second: process modules inside chunks (Next.js often puts modules here)
    if (stats.chunks) {
      for (const chunk of stats.chunks) {
        if (chunk.modules) {
          for (const module of chunk.modules) {
            processModule(module, chunk.id);
          }
        }
      }
    }
  }

  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const totalBrotliSize = bundles.reduce((sum, b) => sum + b.brotliSize, 0);

  // Calculate breakdown by type
  const byType = calculateAssetBreakdown(bundles);

  // Build detailed analysis if modules were extracted
  let detailedDependencies: DependencyMetrics[] | undefined;
  let dependencyGraph: DependencyGraph | undefined;
  let optimizations: OptimizationRecommendation[] | undefined;

  if (modules.length > 0) {
    // Build dependency graph
    if (options.buildDependencyGraph) {
      dependencyGraph = buildDependencyGraph(modules);
    }

    // Aggregate into dependency metrics
    detailedDependencies = aggregateDependencyMetrics(modules, totalSize);

    // Generate optimization recommendations
    if (options.generateRecommendations && dependencyGraph) {
      optimizations = generateOptimizationRecommendations(
        detailedDependencies,
        dependencyGraph,
        totalSize,
      );
    }
  }

  return {
    timestamp: new Date().toISOString(),
    commit: options.commit || 'unknown',
    branch: options.branch || 'unknown',
    buildDuration: stats.time || 0,
    bundles,
    totalSize,
    totalGzipSize,
    totalBrotliSize,
    chunkCount: bundles.length,
    byType,
    warnings: [], // Legacy field - use optimizations instead
    recommendations: [], // Legacy field - use optimizations instead
    // Enhanced fields
    modules: modules.length > 0 ? modules : undefined,
    detailedDependencies,
    dependencyGraph,
    optimizations,
  };
}

/**
 * Determine file type from extension
 */
function getFileType(fileName: string): Bundle['type'] {
  if (fileName.endsWith('.js') || fileName.endsWith('.mjs') || fileName.endsWith('.cjs')) {
    return 'js';
  }
  if (fileName.endsWith('.css')) {
    return 'css';
  }
  if (fileName.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    return 'asset';
  }
  if (fileName.endsWith('.html')) {
    return 'html';
  }
  return 'other';
}

/**
 * Calculate breakdown by asset type
 */
function calculateAssetBreakdown(bundles: Bundle[]): BuildMetrics['byType'] {
  const breakdown = {
    javascript: 0,
    css: 0,
    images: 0,
    fonts: 0,
    other: 0,
  };

  for (const bundle of bundles) {
    if (bundle.type === 'js') {
      breakdown.javascript += bundle.size;
    } else if (bundle.type === 'css') {
      breakdown.css += bundle.size;
    } else if (bundle.type === 'asset') {
      const ext = bundle.name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext || '')) {
        breakdown.images += bundle.size;
      } else if (['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(ext || '')) {
        breakdown.fonts += bundle.size;
      } else {
        breakdown.other += bundle.size;
      }
    } else {
      breakdown.other += bundle.size;
    }
  }

  return breakdown;
}
