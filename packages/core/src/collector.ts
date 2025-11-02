/**
 * Metrics collector - framework agnostic
 * Analyzes build output directory and collects metrics
 * Using functional composition instead of classes
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, relative } from 'path';
import { gzipSize } from 'gzip-size';
import brotliSize from 'brotli-size';
import type { BuildMetrics, Bundle, AssetBreakdown } from './types.js';
import { analyzeDependencies, generateDependencyInsights } from './dependencies.js';

export interface CollectorOptions {
  outputDir: string;
  branch?: string;
  commit?: string;
  buildStartTime?: number;
  projectRoot?: string;
  analyzeDeps?: boolean;
}

/**
 * Analyze a single file and create a Bundle entry
 */
async function analyzeFile(filePath: string, basePath: string): Promise<Bundle | null> {
  try {
    const stats = await stat(filePath);
    const content = await readFile(filePath);
    
    const ext = extname(filePath).toLowerCase();
    const relativePath = relative(basePath, filePath);
    
    // Calculate gzip size
    const gzip = await gzipSize(content);
    
    // Try brotli compression (optional, may not be available)
    let brotli = 0;
    try {
      brotli = await brotliSize(content);
    } catch (error) {
      // Brotli compression failed, use estimate as fallback
      brotli = Math.round(stats.size * 0.8);
    }

    return {
      name: relativePath,
      size: stats.size,
      gzipSize: gzip,
      brotliSize: brotli,
      type: getFileType(ext),
      path: relativePath,
    };
  } catch (error) {
    console.error(`Error analyzing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Determine file type from extension
 */
function getFileType(ext: string): Bundle['type'] {
  switch (ext) {
    case '.js':
    case '.mjs':
    case '.cjs':
      return 'js';
    case '.css':
      return 'css';
    case '.html':
      return 'html';
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
    case '.svg':
    case '.webp':
    case '.ico':
      return 'asset';
    default:
      return 'other';
  }
}

/**
 * Recursively collect all bundles from output directory
 */
async function collectBundles(dir: string, basePath: string = dir): Promise<Bundle[]> {
  const bundles: Bundle[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively process subdirectories
        const subBundles = await collectBundles(fullPath, basePath);
        bundles.push(...subBundles);
      } else if (entry.isFile()) {
        // Skip source maps and other metadata files
        if (entry.name.endsWith('.map') || entry.name.startsWith('.')) {
          continue;
        }

        const bundle = await analyzeFile(fullPath, basePath);
        if (bundle) {
          bundles.push(bundle);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return bundles;
}

/**
 * Calculate breakdown by asset type
 */
function calculateAssetBreakdown(bundles: Bundle[]): AssetBreakdown {
  const breakdown: AssetBreakdown = {
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
      const ext = extname(bundle.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].includes(ext)) {
        breakdown.images += bundle.size;
      } else if (['.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
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

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate warnings based on bundle analysis
 */
function generateWarnings(bundles: Bundle[], totalSize: number): string[] {
  const warnings: string[] = [];

  // Large total bundle warning
  if (totalSize > 500 * 1024) {
    warnings.push(`Total bundle size (${formatSize(totalSize)}) exceeds 500 KB`);
  }

  // Large individual bundles
  for (const bundle of bundles) {
    if (bundle.type === 'js' && bundle.size > 250 * 1024) {
      warnings.push(`${bundle.name} is large (${formatSize(bundle.size)})`);
    }
  }

  return warnings;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(bundles: Bundle[], byType: AssetBreakdown): string[] {
  const recommendations: string[] = [];

  // JavaScript optimization suggestions
  if (byType.javascript > 300 * 1024) {
    recommendations.push('Consider code splitting to reduce JavaScript bundle size');
  }

  // Large JS bundles that could benefit from splitting
  const largeJsBundles = bundles.filter(b => b.type === 'js' && b.size > 200 * 1024);
  if (largeJsBundles.length > 0) {
    recommendations.push('Large JavaScript bundles detected - consider lazy loading or dynamic imports');
  }

  // CSS optimization
  if (byType.css > 100 * 1024) {
    recommendations.push('Consider optimizing CSS bundle size with purging or critical CSS extraction');
  }

  // Image optimization
  if (byType.images > 500 * 1024) {
    recommendations.push('Large image assets detected - consider optimization or lazy loading');
  }

  return recommendations;
}

/**
 * Collect all metrics from build output
 * This is the main API - a pure function that composes all the others
 */
export async function collectMetrics(options: CollectorOptions): Promise<BuildMetrics> {
  const buildStartTime = options.buildStartTime || Date.now();
  const bundles = await collectBundles(options.outputDir);
  
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const totalBrotliSize = bundles.reduce((sum, b) => sum + b.brotliSize, 0);
  
  const byType = calculateAssetBreakdown(bundles);
  const warnings = generateWarnings(bundles, totalSize);
  let recommendations = generateRecommendations(bundles, byType);

  // Analyze dependencies if requested
  let dependencies;
  if (options.analyzeDeps !== false) {
    const projectRoot = options.projectRoot || process.cwd();
    dependencies = await analyzeDependencies(bundles, projectRoot);
    
    // Add dependency-specific insights to recommendations
    const depInsights = generateDependencyInsights(dependencies, totalSize);
    recommendations = [...recommendations, ...depInsights];
  }

  return {
    timestamp: new Date().toISOString(),
    commit: options.commit || 'unknown',
    branch: options.branch || 'unknown',
    buildDuration: Date.now() - buildStartTime,
    bundles,
    totalSize,
    totalGzipSize,
    totalBrotliSize,
    chunkCount: bundles.length,
    byType,
    dependencies,
    warnings,
    recommendations,
  };
}

/**
 * Legacy class wrapper for backwards compatibility
 * @deprecated Use collectMetrics() function directly
 */
export class MetricsCollector {
  constructor(private options: CollectorOptions) {}
  
  async collect(): Promise<BuildMetrics> {
    return collectMetrics(this.options);
  }
}
