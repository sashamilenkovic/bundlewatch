/**
 * Comparison engine - analyzes and compares build metrics
 * Using functional composition instead of classes
 */

import type { BuildMetrics, Comparison, BundleChange, SizeChange } from './types.js';

/**
 * Calculate size change between two values
 */
function calculateSizeChange(current: number, previous: number): SizeChange {
  const diff = current - previous;
  const diffPercent = previous === 0 ? 0 : (diff / previous) * 100;

  return {
    current,
    previous,
    diff,
    diffPercent,
  };
}

/**
 * Compare bundles between current and baseline
 */
function compareBundles(
  current: BuildMetrics['bundles'],
  baseline: BuildMetrics['bundles']
): BundleChange[] {
  const changes: BundleChange[] = [];
  const baselineMap = new Map(baseline.map(b => [b.name, b]));
  const currentMap = new Map(current.map(b => [b.name, b]));

  // Check all current bundles
  for (const bundle of current) {
    const baseBundle = baselineMap.get(bundle.name);

    if (!baseBundle) {
      // New bundle
      changes.push({
        name: bundle.name,
        current: bundle.size,
        previous: undefined,
        diff: bundle.size,
        diffPercent: 100,
        status: 'added',
      });
    } else {
      // Changed or unchanged
      const diff = bundle.size - baseBundle.size;
      const diffPercent = baseBundle.size === 0 ? 0 : (diff / baseBundle.size) * 100;
      
      changes.push({
        name: bundle.name,
        current: bundle.size,
        previous: baseBundle.size,
        diff,
        diffPercent,
        status: Math.abs(diffPercent) < 0.1 ? 'unchanged' : 'changed',
      });
    }
  }

  // Check for removed bundles
  for (const bundle of baseline) {
    if (!currentMap.has(bundle.name)) {
      changes.push({
        name: bundle.name,
        current: undefined,
        previous: bundle.size,
        diff: -bundle.size,
        diffPercent: -100,
        status: 'removed',
      });
    }
  }

  // Sort by absolute diff (largest changes first)
  changes.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  return changes;
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return Math.round((Math.abs(bytes) / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate human-readable summary
 */
function generateSummary(totalSize: SizeChange, gzipSize: SizeChange, target: string): string {
  const { diff, diffPercent } = totalSize;
  const absDiff = Math.abs(diff);
  const absPercent = Math.abs(diffPercent);

  if (Math.abs(diffPercent) < 0.1) {
    return `Bundle size unchanged from ${target}`;
  }

  const sizeStr = formatSize(absDiff);
  const percentStr = absPercent.toFixed(1);
  const direction = diff > 0 ? 'larger' : 'smaller';
  const emoji = diff > 0 ? '📈' : '📉';

  return `${emoji} Bundle is ${sizeStr} (${percentStr}%) ${direction} than ${target}`;
}

/**
 * Generate insights based on comparison
 */
function generateInsights(changes: BundleChange[], totalSize: SizeChange): string[] {
  const insights: string[] = [];

  // Overall size change
  if (totalSize.diffPercent > 10) {
    insights.push(`⚠️ Total bundle size increased by ${totalSize.diffPercent.toFixed(1)}%`);
  } else if (totalSize.diffPercent < -10) {
    insights.push(`✅ Great job! Bundle size reduced by ${Math.abs(totalSize.diffPercent).toFixed(1)}%`);
  }

  // Largest increases
  const largestIncrease = changes.find(c => c.status === 'changed' && c.diff > 0);
  if (largestIncrease && largestIncrease.diff > 50 * 1024) {
    insights.push(
      `📦 ${largestIncrease.name} grew by ${formatSize(largestIncrease.diff)} (${largestIncrease.diffPercent.toFixed(1)}%)`
    );
  }

  // New bundles
  const newBundles = changes.filter(c => c.status === 'added');
  if (newBundles.length > 0) {
    const totalNew = newBundles.reduce((sum, b) => sum + b.diff, 0);
    insights.push(`➕ ${newBundles.length} new bundle(s) added (${formatSize(totalNew)})`);
  }

  // Removed bundles
  const removedBundles = changes.filter(c => c.status === 'removed');
  if (removedBundles.length > 0) {
    const totalRemoved = Math.abs(removedBundles.reduce((sum, b) => sum + b.diff, 0));
    insights.push(`➖ ${removedBundles.length} bundle(s) removed (${formatSize(totalRemoved)} saved)`);
  }

  return insights;
}

/**
 * Compare current metrics against a baseline
 * This is the main API - a pure function that composes all the others
 */
export function compareMetrics(
  current: BuildMetrics,
  baseline: BuildMetrics,
  targetName: string = 'previous'
): Comparison {
  const totalSize = calculateSizeChange(current.totalSize, baseline.totalSize);
  const totalGzipSize = calculateSizeChange(current.totalGzipSize, baseline.totalGzipSize);
  const totalBrotliSize = calculateSizeChange(current.totalBrotliSize, baseline.totalBrotliSize);
  const buildDuration = calculateSizeChange(current.buildDuration, baseline.buildDuration);

  const byBundle = compareBundles(current.bundles, baseline.bundles);
  const summary = generateSummary(totalSize, totalGzipSize, targetName);
  const recommendations = generateInsights(byBundle, totalSize);

  return {
    target: targetName as any,
    targetCommit: baseline.commit,
    currentCommit: current.commit,
    changes: {
      totalSize,
      totalGzipSize,
      totalBrotliSize,
      buildDuration,
      byBundle,
    },
    summary,
    recommendations,
  };
}

/**
 * Legacy class wrapper for backwards compatibility
 * @deprecated Use compareMetrics() function directly
 */
export class ComparisonEngine {
  compare(current: BuildMetrics, baseline: BuildMetrics, targetName: string = 'previous'): Comparison {
    return compareMetrics(current, baseline, targetName);
  }
}
