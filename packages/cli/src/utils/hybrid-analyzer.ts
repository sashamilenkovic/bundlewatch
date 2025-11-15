/**
 * Hybrid build output analyzer
 * Tries to use existing bundler stats files (fast), falls back to file analysis (slower)
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, relative } from 'path';
import type { BuildMetrics, Bundle } from '@milencode/bundlewatch-core';
import { parseWebpackStats, type WebpackStats } from '@milencode/bundlewatch-parsers';

/**
 * Strategy detection result
 */
interface AnalysisStrategy {
  type: 'webpack-stats' | 'vite-manifest' | 'fallback';
  path?: string;
  reason: string;
}

/**
 * Find the best analysis strategy for this project
 */
async function detectStrategy(projectRoot: string): Promise<AnalysisStrategy> {
  // Strategy 1: Webpack stats.json
  const webpackStatsPaths = [
    join(projectRoot, 'stats.json'),
    join(projectRoot, 'dist', 'stats.json'),
    join(projectRoot, 'build', 'stats.json'),
    join(projectRoot, '.next', 'stats.json'),
  ];

  for (const statsPath of webpackStatsPaths) {
    try {
      const stats = await stat(statsPath);
      if (stats.isFile()) {
        return {
          type: 'webpack-stats',
          path: statsPath,
          reason: 'Found webpack stats.json',
        };
      }
    } catch {
      // File doesn't exist, try next
    }
  }

  // Strategy 2: Vite/Rollup manifest.json
  const viteManifestPaths = [
    join(projectRoot, 'dist', '.vite', 'manifest.json'),
    join(projectRoot, 'dist', 'manifest.json'),
    join(projectRoot, '.output', 'public', 'manifest.json'),
  ];

  for (const manifestPath of viteManifestPaths) {
    try {
      const stats = await stat(manifestPath);
      if (stats.isFile()) {
        return {
          type: 'vite-manifest',
          path: manifestPath,
          reason: 'Found Vite manifest.json',
        };
      }
    } catch {
      // File doesn't exist, try next
    }
  }

  // Strategy 3: Fallback to file analysis
  return {
    type: 'fallback',
    reason: 'No stats files found, using file-based analysis',
  };
}

/**
 * Analyze using webpack stats.json (FAST)
 */
async function analyzeFromWebpackStats(
  statsPath: string,
  commit: string,
  branch: string,
  timestamp: string,
  buildDuration: number
): Promise<BuildMetrics> {
  const content = await readFile(statsPath, 'utf-8');
  const stats: WebpackStats = JSON.parse(content);

  // Use the parser with estimated compression (fast)
  const metrics = parseWebpackStats(stats, {
    commit,
    branch,
    estimateCompression: true, // Fast estimates
    realCompression: false,
    extractModules: false, // Skip for backfill (faster)
    buildDependencyGraph: false,
    generateRecommendations: false,
  });

  // Override timestamp and build duration
  return {
    ...metrics,
    timestamp,
    buildDuration,
  };
}

/**
 * Analyze using Vite manifest (FAST)
 */
async function analyzeFromViteManifest(
  manifestPath: string,
  _projectRoot: string,
  commit: string,
  branch: string,
  timestamp: string,
  buildDuration: number
): Promise<BuildMetrics> {
  const content = await readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(content);

  const bundles: Bundle[] = [];
  const distDir = join(manifestPath, '..');

  // Parse manifest entries
  for (const [_key, entry] of Object.entries(manifest)) {
    const typedEntry = entry as { file: string; css?: string[]; assets?: string[] };

    if (typedEntry.file) {
      const filePath = join(distDir, typedEntry.file);
      try {
        const fileStats = await stat(filePath);
        const size = fileStats.size;

        // Estimate compression (fast)
        const gzipSize = Math.round(size * 0.3);
        const brotliSize = Math.round(gzipSize * 0.85);

        bundles.push({
          name: typedEntry.file,
          size,
          gzipSize,
          brotliSize,
          type: getFileType(typedEntry.file),
          path: typedEntry.file,
        });
      } catch {
        // File might not exist, skip
      }
    }

    // Add CSS files
    if (typedEntry.css) {
      for (const cssFile of typedEntry.css) {
        const filePath = join(distDir, cssFile);
        try {
          const fileStats = await stat(filePath);
          const size = fileStats.size;
          const gzipSize = Math.round(size * 0.3);
          const brotliSize = Math.round(gzipSize * 0.85);

          bundles.push({
            name: cssFile,
            size,
            gzipSize,
            brotliSize,
            type: 'css',
            path: cssFile,
          });
        } catch {
          // File might not exist, skip
        }
      }
    }
  }

  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const totalBrotliSize = bundles.reduce((sum, b) => sum + b.brotliSize, 0);
  const byType = calculateAssetBreakdown(bundles);

  return {
    timestamp,
    commit,
    branch,
    buildDuration,
    bundles,
    totalSize,
    totalGzipSize,
    totalBrotliSize,
    chunkCount: bundles.length,
    byType,
    warnings: [],
    recommendations: [],
  };
}

/**
 * Fallback: Analyze files directly (SLOWER but works always)
 */
async function analyzeFromFiles(
  projectRoot: string,
  commit: string,
  branch: string,
  timestamp: string,
  buildDuration: number
): Promise<BuildMetrics> {
  // Find build directory
  const buildDir = await findBuildDir(projectRoot);
  if (!buildDir) {
    throw new Error('Could not find build output directory (dist, build, .next/static, etc.)');
  }

  // Collect all files
  const filePaths = await collectFiles(buildDir, buildDir);

  if (filePaths.length === 0) {
    throw new Error(`No bundle files found in ${buildDir}`);
  }

  // Analyze each file with ESTIMATED compression (fast)
  const bundles: Bundle[] = [];
  for (const filePath of filePaths) {
    try {
      const fileStats = await stat(filePath);
      const size = fileStats.size;

      // ESTIMATED compression (much faster than real compression)
      const gzipSize = Math.round(size * 0.3);
      const brotliSize = Math.round(gzipSize * 0.85);

      const name = relative(buildDir, filePath);

      bundles.push({
        name,
        size,
        gzipSize,
        brotliSize,
        type: getFileType(filePath),
      });
    } catch (error) {
      console.warn(`Failed to analyze ${filePath}: ${error}`);
    }
  }

  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const totalBrotliSize = bundles.reduce((sum, b) => sum + b.brotliSize, 0);
  const chunkCount = bundles.length;

  const byType = calculateAssetBreakdown(bundles);

  return {
    timestamp,
    commit,
    branch,
    buildDuration,
    bundles,
    totalSize,
    totalGzipSize,
    totalBrotliSize,
    chunkCount,
    byType,
    warnings: [],
    recommendations: [],
  };
}

/**
 * Main entry point: Analyze build output using the best available strategy
 */
export async function analyzeBuildOutput(
  projectRoot: string,
  commit: string,
  branch: string,
  timestamp: string,
  buildDuration: number
): Promise<BuildMetrics> {
  const strategy = await detectStrategy(projectRoot);

  console.log(`  📊 Strategy: ${strategy.reason}`);

  switch (strategy.type) {
    case 'webpack-stats':
      return analyzeFromWebpackStats(
        strategy.path!,
        commit,
        branch,
        timestamp,
        buildDuration
      );

    case 'vite-manifest':
      return analyzeFromViteManifest(
        strategy.path!,
        projectRoot,
        commit,
        branch,
        timestamp,
        buildDuration
      );

    case 'fallback':
      return analyzeFromFiles(projectRoot, commit, branch, timestamp, buildDuration);

    default:
      throw new Error(`Unknown strategy: ${strategy.type}`);
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Find common build output directories
 */
async function findBuildDir(projectRoot: string): Promise<string | null> {
  const commonDirs = [
    'dist',
    'build',
    '.next/static',
    '.output/public',
    'out',
    'public/build',
  ];

  for (const dir of commonDirs) {
    const fullPath = join(projectRoot, dir);
    try {
      const stats = await stat(fullPath);
      if (stats.isDirectory()) {
        return fullPath;
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Get file type from extension
 */
function getFileType(filename: string): Bundle['type'] {
  const ext = extname(filename).toLowerCase();
  const map: Record<string, Bundle['type']> = {
    '.js': 'js',
    '.mjs': 'js',
    '.cjs': 'js',
    '.css': 'css',
    '.html': 'html',
    '.png': 'asset',
    '.jpg': 'asset',
    '.jpeg': 'asset',
    '.gif': 'asset',
    '.svg': 'asset',
    '.webp': 'asset',
    '.woff': 'asset',
    '.woff2': 'asset',
    '.ttf': 'asset',
    '.eot': 'asset',
    '.otf': 'asset',
  };
  return map[ext] || 'other';
}

/**
 * Recursively collect all files in directory
 */
async function collectFiles(dir: string, rootDir: string, files: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip common non-bundle directories
      if (!['node_modules', '.git', 'src'].includes(entry.name)) {
        await collectFiles(fullPath, rootDir, files);
      }
    } else if (entry.isFile()) {
      // Only include actual bundle files
      const ext = extname(entry.name).toLowerCase();
      if (['.js', '.mjs', '.cjs', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
           '.webp', '.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Calculate breakdown by asset type
 */
function calculateAssetBreakdown(bundles: Bundle[]): BuildMetrics['byType'] {
  const assetBundles = bundles.filter(b => b.type === 'asset');
  const imageAssets = assetBundles.filter(b => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(b.name));
  const fontAssets = assetBundles.filter(b => /\.(woff|woff2|ttf|eot|otf)$/i.test(b.name));
  const otherAssets = assetBundles.filter(b =>
    !imageAssets.includes(b) && !fontAssets.includes(b)
  );

  return {
    javascript: bundles.filter(b => b.type === 'js').reduce((sum, b) => sum + b.size, 0),
    css: bundles.filter(b => b.type === 'css').reduce((sum, b) => sum + b.size, 0),
    images: imageAssets.reduce((sum, b) => sum + b.size, 0),
    fonts: fontAssets.reduce((sum, b) => sum + b.size, 0),
    other: [
      ...bundles.filter(b => b.type === 'other' || b.type === 'html'),
      ...otherAssets
    ].reduce((sum, b) => sum + b.size, 0),
  };
}
