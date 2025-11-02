/**
 * Dependency size analyzer
 * Analyzes which dependencies contribute to bundle size
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Bundle, DependencySize } from './types.js';

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Estimate dependency sizes from bundle contents
 */
export async function analyzeDependencies(
  bundles: Bundle[],
  projectRoot: string = process.cwd()
): Promise<DependencySize[]> {
  try {
    // Read package.json
    const packageJson = await readPackageJson(projectRoot);
    if (!packageJson) return [];

    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const dependencySizes: Map<string, number> = new Map();

    // For each bundle, estimate which dependencies it contains
    for (const bundle of bundles) {
      if (bundle.type !== 'js') continue;

      // Read bundle content to detect dependencies
      const bundlePath = join(projectRoot, bundle.path || bundle.name);
      try {
        const content = await readFile(bundlePath, 'utf-8');
        
        // Detect which dependencies are in this bundle
        for (const [depName, version] of Object.entries(deps)) {
          if (containsDependency(content, depName)) {
            const currentSize = dependencySizes.get(depName) || 0;
            // Estimate: if found, attribute a portion of bundle size
            const estimatedSize = estimateDependencySize(content, depName, bundle.size);
            dependencySizes.set(depName, currentSize + estimatedSize);
          }
        }
      } catch {
        // Bundle file might not exist in some test scenarios
        continue;
      }
    }

    // Convert to array and sort by size
    const results: DependencySize[] = Array.from(dependencySizes.entries())
      .map(([name, size]) => ({
        name,
        size,
        version: deps[name],
      }))
      .filter(d => d.size > 0)
      .sort((a, b) => b.size - a.size);

    return results;
  } catch (error) {
    console.warn('Could not analyze dependencies:', error);
    return [];
  }
}

/**
 * Read and parse package.json
 */
async function readPackageJson(projectRoot: string): Promise<PackageJson | null> {
  try {
    const content = await readFile(join(projectRoot, 'package.json'), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if bundle content contains references to a dependency
 */
function containsDependency(bundleContent: string, depName: string): boolean {
  // Look for various patterns that indicate the dependency is included
  const patterns = [
    new RegExp(`node_modules/${depName}/`, 'i'),
    new RegExp(`from\\s+['"]${depName}['"]`, 'i'),
    new RegExp(`require\\(['"]${depName}['"]\\)`, 'i'),
    new RegExp(`@${depName}/`, 'i'), // Scoped packages
  ];

  return patterns.some(pattern => pattern.test(bundleContent));
}

/**
 * Estimate how much of the bundle size is from this dependency
 */
function estimateDependencySize(
  bundleContent: string,
  depName: string,
  bundleSize: number
): number {
  // Count occurrences of the dependency name as a rough estimate
  const escapedName = depName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedName, 'gi');
  const matches = bundleContent.match(regex);
  const occurrenceCount = matches ? matches.length : 0;

  if (occurrenceCount === 0) return 0;

  // Very rough heuristic: if dep appears many times, it's probably larger
  // This is intentionally conservative - better to underestimate than overestimate
  const estimatedPercentage = Math.min(occurrenceCount * 0.5, 30) / 100;
  return Math.round(bundleSize * estimatedPercentage);
}

/**
 * Generate insights about dependencies
 */
export function generateDependencyInsights(dependencies: DependencySize[], totalSize: number): string[] {
  const insights: string[] = [];

  if (dependencies.length === 0) return insights;

  // Find largest dependencies
  const largest = dependencies[0];
  const largestPercent = (largest.size / totalSize) * 100;

  if (largestPercent > 30) {
    insights.push(
      `📦 ${largest.name} is your largest dependency (${largestPercent.toFixed(1)}% of bundle)`
    );
  }

  // Check for known large/replaceable packages
  const recommendations = getDependencyRecommendations(dependencies);
  insights.push(...recommendations);

  // Count total dependencies in bundle
  if (dependencies.length > 20) {
    insights.push(
      `📚 ${dependencies.length} dependencies detected - consider reviewing if all are necessary`
    );
  }

  return insights;
}

/**
 * Get recommendations for specific dependencies
 */
function getDependencyRecommendations(dependencies: DependencySize[]): string[] {
  const recommendations: string[] = [];
  const depNames = new Set(dependencies.map(d => d.name));

  // Known heavy packages with lighter alternatives
  const alternatives: Record<string, { alternative: string; savings: string }> = {
    'moment': { alternative: 'date-fns or dayjs', savings: '~60KB' },
    'lodash': { alternative: 'lodash-es (with tree-shaking)', savings: '~50KB' },
    'axios': { alternative: 'native fetch', savings: '~15KB' },
    'request': { alternative: 'native fetch or node-fetch', savings: '~200KB' },
    'core-js': { alternative: 'targeted polyfills', savings: 'varies' },
  };

  for (const [depName, info] of Object.entries(alternatives)) {
    if (depNames.has(depName)) {
      recommendations.push(
        `💡 Consider replacing ${depName} with ${info.alternative} (save ${info.savings})`
      );
    }
  }

  // Check for duplicate functionality
  if (depNames.has('moment') && depNames.has('date-fns')) {
    recommendations.push('⚠️ Both moment and date-fns detected - you only need one date library');
  }

  if (depNames.has('axios') && depNames.has('node-fetch')) {
    recommendations.push('⚠️ Multiple HTTP clients detected - consider using just one');
  }

  return recommendations;
}

