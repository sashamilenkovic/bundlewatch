/**
 * Webpack stats.json parser
 * Converts webpack stats output to BundleWatch BuildMetrics format
 */

// Local type definitions (for POC - will import from core later)
interface Bundle {
  name: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  type: 'js' | 'css' | 'html' | 'asset' | 'other';
  path: string;
}

interface AssetBreakdown {
  javascript: number;
  css: number;
  images: number;
  fonts: number;
  other: number;
}

export interface BuildMetrics {
  timestamp: string;
  commit: string;
  branch: string;
  buildDuration: number;
  bundles: Bundle[];
  totalSize: number;
  totalGzipSize: number;
  totalBrotliSize: number;
  chunkCount: number;
  byType: AssetBreakdown;
  warnings: string[];
  recommendations: string[];
}

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
  }>;
}

/**
 * Parse webpack stats.json into BuildMetrics
 * This is MUCH faster than re-analyzing files!
 */
export function parseWebpackStats(
  stats: WebpackStats,
  options: {
    branch?: string;
    commit?: string;
    estimateCompression?: boolean;
  } = {}
): BuildMetrics {
  const bundles: Bundle[] = [];

  // Process webpack assets
  if (stats.assets) {
    for (const asset of stats.assets) {
      // Skip source maps and other metadata
      if (asset.name.endsWith('.map') || asset.name.endsWith('.LICENSE.txt')) {
        continue;
      }

      // Estimate compression sizes (webpack doesn't provide these by default)
      // gzip is typically 30% of original, brotli is 85% of gzip
      const gzipEstimate = options.estimateCompression !== false
        ? Math.round(asset.size * 0.3)
        : 0;
      const brotliEstimate = options.estimateCompression !== false
        ? Math.round(gzipEstimate * 0.85)
        : 0;

      bundles.push({
        name: asset.name,
        size: asset.size,
        gzipSize: gzipEstimate,
        brotliSize: brotliEstimate,
        type: getFileType(asset.name),
        path: asset.name,
      });
    }
  }

  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const totalBrotliSize = bundles.reduce((sum, b) => sum + b.brotliSize, 0);

  // Calculate breakdown by type
  const byType = calculateAssetBreakdown(bundles);

  // Generate warnings and recommendations
  const warnings = generateWarnings(bundles, totalSize);
  const recommendations = generateRecommendations(bundles, byType);

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
    warnings,
    recommendations,
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

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
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
function generateRecommendations(bundles: Bundle[], byType: BuildMetrics['byType']): string[] {
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

