/**
 * Webpack stats.json parser
 * Converts webpack stats output to BundleWatch BuildMetrics format
 */

import type { BuildMetrics, ModuleMetrics, Bundle } from '@milencode/bundlewatch-core';
import { compressBoth } from './compression.js';
import {
  extractPackageName,
  getModuleType,
  buildDependencyGraph,
  aggregateDependencyMetrics,
  generateOptimizationRecommendations,
} from './analysis-utils.js';

/**
 * Webpack stats.json format (simplified)
 */
export interface WebpackStats {
  time?: number;
  hash?: string;
  assets?: Array<{
    name: string;
    size: number;
    chunks?: number[];
    chunkNames?: string[];
  }>;
  chunks?: Array<{
    id: number | string;
    size: number;
    files: string[];
    modules?: Array<{
      id?: string | number;
      identifier?: string;
      name?: string;
      nameForCondition?: string;
      size: number;
      reasons?: Array<{
        moduleIdentifier?: string;
        moduleName?: string;
      }>;
    }>;
  }>;
  modules?: Array<{
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
  }>;
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
 * Parse webpack stats.json into BuildMetrics
 * This is MUCH faster than re-analyzing files!
 */
export function parseWebpackStats(
  stats: WebpackStats,
  options: WebpackParseOptions = {}
): BuildMetrics {
  const bundles: Bundle[] = [];
  const modules: ModuleMetrics[] = [];

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

      bundles.push({
        name: asset.name,
        size: asset.size,
        gzipSize,
        brotliSize,
        type: getFileType(asset.name),
        path: asset.name,
      });
    }
  }

  // Extract module-level metrics if requested
  if (options.extractModules && stats.modules) {
    for (const module of stats.modules) {
      if (!module.name || typeof module.size !== 'number') {
        continue;
      }

      // Skip node_modules and .pnpm to avoid cluttering the analysis
      if (module.name.includes('node_modules') || module.name.includes('.pnpm')) {
        continue;
      }

      const moduleId = module.identifier || module.name;
      const packageName = extractPackageName(module.name);

      modules.push({
        id: moduleId,
        package: packageName,
        size: module.size,
        chunks: (module.chunks || []).map(String),
        importedBy: (module.reasons || [])
          .map(r => r.moduleIdentifier || r.moduleName)
          .filter((id): id is string => !!id),
        imports: [], // Webpack doesn't provide forward deps easily
        type: getModuleType(module.name),
        treeshakeable: module.name.includes('esm') || module.name.includes('.mjs'),
      });
    }
  }

  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const totalBrotliSize = bundles.reduce((sum, b) => sum + b.brotliSize, 0);

  // Calculate breakdown by type
  const byType = calculateAssetBreakdown(bundles);

  // Build detailed analysis if modules were extracted
  let detailedDependencies;
  let dependencyGraph;
  let optimizations;

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


