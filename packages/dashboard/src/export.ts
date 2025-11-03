/**
 * Static HTML export functionality
 */

import { writeFile, mkdir } from 'fs/promises';
import { resolve, join } from 'path';
import { generateDashboardHTML, type DashboardData } from './template.js';
import type { BuildMetrics } from '@milencode/bundlewatch-core';

export interface ExportOptions {
  /**
   * Output directory for the exported HTML
   */
  output: string;

  /**
   * Build metrics to export
   */
  metrics: BuildMetrics;

  /**
   * Optional historical metrics for trend analysis
   */
  historical?: BuildMetrics[];

  /**
   * Optional baseline for comparison
   */
  baseline?: BuildMetrics;

  /**
   * Whether to create a standalone file
   * @default true
   */
  standalone?: boolean;
}

/**
 * Export dashboard as static HTML
 */
export async function exportStatic(options: ExportOptions): Promise<string> {
  const {
    output,
    metrics,
    historical = [],
    baseline,
  } = options;

  // Prepare data
  const dashboardData: DashboardData = {
    current: metrics,
    historical: historical.length > 0 ? historical : [metrics],
    baseline,
  };

  // Generate HTML
  const html = generateDashboardHTML(dashboardData);

  // Ensure output directory exists
  const outputDir = resolve(process.cwd(), output);
  await mkdir(outputDir, { recursive: true });

  // Write HTML file
  const indexPath = join(outputDir, 'index.html');
  await writeFile(indexPath, html, 'utf-8');

  // Write raw data as JSON (for API access or debugging)
  const dataPath = join(outputDir, 'data.json');
  await writeFile(dataPath, JSON.stringify(dashboardData, null, 2), 'utf-8');

  return indexPath;
}

/**
 * Export multiple builds for comparison
 */
export async function exportComparison(options: {
  output: string;
  builds: Array<{ label: string; metrics: BuildMetrics }>;
}): Promise<string> {
  const { output, builds } = options;

  if (builds.length < 2) {
    throw new Error('Comparison requires at least 2 builds');
  }

  // Use the most recent as current
  const current = builds[builds.length - 1].metrics;
  const baseline = builds[0].metrics;
  const historical = builds.map((b) => b.metrics);

  return exportStatic({
    output,
    metrics: current,
    historical,
    baseline,
  });
}

