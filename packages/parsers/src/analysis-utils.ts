/**
 * Shared bundle analysis utilities
 * Used by both Vite and Webpack parsers for detailed metrics
 */

import type {
  DependencyMetrics,
  DependencyGraph,
  DependencyGraphNode,
  OptimizationRecommendation,
  ModuleMetrics,
} from '@milencode/bundlewatch-core';

/**
 * Extract package name from module path
 */
export function extractPackageName(modulePath: string): string {
  // Handle node_modules paths (including pnpm structure)
  if (modulePath.includes('node_modules')) {
    // pnpm uses: node_modules/.pnpm/package@version/node_modules/package
    // npm uses: node_modules/package

    // Try to match the last node_modules occurrence for pnpm
    const parts = modulePath.split('node_modules/');
    const lastPart = parts[parts.length - 1];

    if (!lastPart) return 'unknown';

    // Extract package name (handle scoped packages)
    const match = lastPart.match(/^(@[^/]+\/[^/]+|[^/@]+)/);
    return match ? match[1] : 'unknown';
  }

  // Handle webpack internal modules
  if (modulePath.startsWith('webpack/')) {
    return 'webpack-runtime';
  }

  // Everything else is your app
  return 'your-app';
}

/**
 * Determine module type from path
 */
export function getModuleType(modulePath: string): 'npm' | 'local' | 'vendor' {
  if (modulePath.includes('node_modules')) {
    return 'npm';
  }
  if (modulePath.startsWith('webpack/') || modulePath.includes('vite/')) {
    return 'vendor';
  }
  return 'local';
}

/**
 * Build dependency graph from modules
 */
export function buildDependencyGraph(modules: ModuleMetrics[]): DependencyGraph {
  const nodes = new Map<string, DependencyGraphNode>();

  // Create nodes
  for (const module of modules) {
    nodes.set(module.id, {
      id: module.id,
      imports: module.imports || [],
      importedBy: module.importedBy || [],
      depth: 0,
      reason: (module.importedBy?.length || 0) === 0 ? 'entry' : 'static-import',
    });
  }

  // Calculate depth
  const visited = new Set<string>();
  const calculateDepth = (moduleId: string, currentDepth: number): void => {
    if (visited.has(moduleId)) return;
    visited.add(moduleId);

    const node = nodes.get(moduleId);
    if (!node) return;

    node.depth = Math.max(node.depth || 0, currentDepth);

    for (const importId of node.imports) {
      calculateDepth(importId, currentDepth + 1);
    }
  };

  // Find entry points (modules with no importers)
  for (const module of modules) {
    if (!module.importedBy || module.importedBy.length === 0) {
      calculateDepth(module.id, 0);
    }
  }

  // Detect circular dependencies
  const circular: Array<{ chain: string[]; impact: 'warning' | 'error' }> = [];
  const seenChains = new Set<string>();

  const detectCircular = (
    moduleId: string,
    path: string[],
    visited: Set<string>,
  ): void => {
    if (path.includes(moduleId)) {
      const cycleStart = path.indexOf(moduleId);
      const cycle = path.slice(cycleStart);
      const chainKey = cycle.sort().join('->');

      if (!seenChains.has(chainKey)) {
        seenChains.add(chainKey);
        circular.push({
          chain: cycle,
          impact: cycle.length > 5 ? 'error' : 'warning',
        });
      }
      return;
    }

    if (visited.has(moduleId)) return;
    visited.add(moduleId);

    const node = nodes.get(moduleId);
    if (!node) return;

    for (const importId of node.imports) {
      detectCircular(importId, [...path, moduleId], visited);
    }
  };

  for (const module of modules) {
    detectCircular(module.id, [], new Set());
  }

  // Detect duplicate packages
  const packageVersions = new Map<
    string,
    Map<string, { size: number; modules: string[] }>
  >();

  for (const module of modules) {
    if (module.package && module.package !== 'your-app') {
      if (!packageVersions.has(module.package)) {
        packageVersions.set(module.package, new Map());
      }

      const versions = packageVersions.get(module.package)!;
      // Extract version from path (simplified)
      const version = 'unknown'; // In real impl, parse from node_modules path

      if (!versions.has(version)) {
        versions.set(version, { size: 0, modules: [] });
      }

      const versionInfo = versions.get(version)!;
      versionInfo.size += module.size;
      versionInfo.modules.push(module.id);
    }
  }

  const duplicates: Array<{
    package: string;
    versions: Array<{ version: string; size: number; modules: string[] }>;
  }> = [];

  for (const [pkg, versions] of packageVersions) {
    if (versions.size > 1) {
      duplicates.push({
        package: pkg,
        versions: Array.from(versions.entries()).map(([version, info]) => ({
          version,
          size: info.size,
          modules: info.modules,
        })),
      });
    }
  }

  return {
    nodes,
    circular,
    duplicates,
  };
}

/**
 * Aggregate modules into dependency metrics
 */
export function aggregateDependencyMetrics(
  modules: ModuleMetrics[],
  totalSize: number,
): DependencyMetrics[] {
  const depMap = new Map<string, DependencyMetrics>();

  for (const module of modules) {
    const pkg = module.package || 'unknown';

    if (!depMap.has(pkg)) {
      depMap.set(pkg, {
        name: pkg,
        totalSize: 0,
        moduleCount: 0,
        chunks: [],
        treeshakeable: true,
        duplicate: false,
      });
    }

    const dep = depMap.get(pkg)!;
    dep.totalSize += module.size;
    dep.moduleCount += 1;
    dep.chunks = [...new Set([...dep.chunks, ...module.chunks])];

    if (module.gzipSize) {
      dep.gzipSize = (dep.gzipSize || 0) + module.gzipSize;
    }
    if (module.brotliSize) {
      dep.brotliSize = (dep.brotliSize || 0) + module.brotliSize;
    }

    if (module.treeshakeable === false) {
      dep.treeshakeable = false;
    }
  }

  // Calculate percentages and find first importer
  const results: DependencyMetrics[] = [];
  for (const dep of depMap.values()) {
    dep.percentOfTotal = (dep.totalSize / totalSize) * 100;

    // Find first importer
    const firstModule = modules.find(m => m.package === dep.name);
    if (firstModule && firstModule.importedBy && firstModule.importedBy.length > 0) {
      dep.firstImportedBy = firstModule.importedBy[0];
    }

    results.push(dep);
  }

  return results.sort((a, b) => b.totalSize - a.totalSize);
}

/**
 * Generate optimization recommendations
 */
export function generateOptimizationRecommendations(
  dependencies: DependencyMetrics[],
  graph: DependencyGraph,
  totalSize: number,
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  // Large dependencies
  for (const dep of dependencies) {
    if (dep.totalSize > 100 * 1024 && dep.name !== 'your-app') {
      recommendations.push({
        type: 'code-splitting',
        severity: dep.totalSize > 500 * 1024 ? 'error' : 'warning',
        message: `${dep.name} is large (${formatBytes(dep.totalSize)})`,
        action: 'Consider code-splitting or lazy loading this dependency',
        potentialSavings: Math.round(dep.totalSize * 0.7), // Assume 70% could be lazy-loaded
        affectedPackages: [dep.name],
      });
    }
  }

  // Duplicate packages
  for (const dup of graph.duplicates) {
    const totalSize = dup.versions.reduce((sum, v) => sum + v.size, 0);
    recommendations.push({
      type: 'duplicate',
      severity: 'warning',
      message: `${dup.package} has ${dup.versions.length} versions`,
      action: 'Deduplicate by aligning to a single version',
      potentialSavings: Math.round(totalSize * 0.5),
      affectedPackages: [dup.package],
    });
  }

  // Circular dependencies
  if (graph.circular.length > 0) {
    recommendations.push({
      type: 'tree-shaking',
      severity: graph.circular.some(c => c.impact === 'error') ? 'error' : 'warning',
      message: `${graph.circular.length} circular dependencies detected`,
      action: 'Refactor to remove circular dependencies for better tree-shaking',
    });
  }

  // Non-tree-shakeable dependencies
  const nonTreeShakeable = dependencies.filter(d => !d.treeshakeable && d.totalSize > 50 * 1024);
  for (const dep of nonTreeShakeable) {
    recommendations.push({
      type: 'tree-shaking',
      severity: 'info',
      message: `${dep.name} is not tree-shakeable`,
      action: 'Consider switching to a tree-shakeable alternative',
      affectedPackages: [dep.name],
      potentialSavings: Math.round(dep.totalSize * 0.3),
    });
  }

  // Overall bundle size
  if (totalSize > 500 * 1024) {
    recommendations.push({
      type: 'compression',
      severity: totalSize > 1024 * 1024 ? 'error' : 'warning',
      message: `Total bundle size is ${formatBytes(totalSize)}`,
      action: 'Enable compression and consider code-splitting',
      potentialSavings: Math.round(totalSize * 0.4),
    });
  }

  return recommendations;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
