/**
 * Build output analyzer - works with any build tool
 * Detects and analyzes dist/build folders
 */

import { readdir, stat } from 'fs/promises';
import { join, extname, relative } from 'path';
import { gzipSync, brotliCompressSync } from 'zlib';
import { readFile } from 'fs/promises';
import type { BuildMetrics, Bundle } from '@milencode/bundlewatch-core';

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
 * Analyze a single bundle file
 */
async function analyzeFile(filePath: string, buildDir: string): Promise<Bundle> {
  const content = await readFile(filePath);
  const size = content.length;
  const gzipSize = gzipSync(content).length;
  const brotliSize = brotliCompressSync(content).length;
  const name = relative(buildDir, filePath);
  const type = getFileType(filePath);

  return {
    name,
    size,
    gzipSize,
    brotliSize,
    type,
  };
}

/**
 * Analyze build output and generate metrics
 */
export async function analyzeBuildOutput(
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

  // Analyze each file
  const bundles: Bundle[] = [];
  for (const filePath of filePaths) {
    try {
      const bundle = await analyzeFile(filePath, buildDir);
      bundles.push(bundle);
    } catch (error) {
      console.warn(`Failed to analyze ${filePath}: ${error}`);
    }
  }

  // Calculate totals
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const totalBrotliSize = bundles.reduce((sum, b) => sum + b.brotliSize, 0);
  const chunkCount = bundles.length;

  // Calculate by type
  // Note: Bundle type uses 'asset' for images/fonts, but AssetBreakdown
  // still uses the granular breakdown. We approximate based on file extensions.
  const assetBundles = bundles.filter(b => b.type === 'asset');
  const imageAssets = assetBundles.filter(b => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(b.name));
  const fontAssets = assetBundles.filter(b => /\.(woff|woff2|ttf|eot|otf)$/i.test(b.name));
  const otherAssets = assetBundles.filter(b =>
    !imageAssets.includes(b) && !fontAssets.includes(b)
  );

  const byType = {
    javascript: bundles.filter(b => b.type === 'js').reduce((sum, b) => sum + b.size, 0),
    css: bundles.filter(b => b.type === 'css').reduce((sum, b) => sum + b.size, 0),
    images: imageAssets.reduce((sum, b) => sum + b.size, 0),
    fonts: fontAssets.reduce((sum, b) => sum + b.size, 0),
    other: [
      ...bundles.filter(b => b.type === 'other' || b.type === 'html'),
      ...otherAssets
    ].reduce((sum, b) => sum + b.size, 0),
  };

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
