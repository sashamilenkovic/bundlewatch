/**
 * Detailed Vite/Rollup bundle analyzer (functional composition)
 * Collects module data during build and generates comprehensive metrics
 */

import { gzipSync, brotliCompressSync } from 'node:zlib';
import type { OutputBundle, OutputChunk, OutputAsset } from 'rollup';
import type {
  BuildMetrics,
  ModuleMetrics,
  DependencyMetrics,
  DependencyGraph,
  DependencyGraphNode,
  OptimizationRecommendation,
  Bundle,
  AssetBreakdown,
  SourceFileMetrics,
} from '@milencode/bundlewatch-core';
import { parseSourceMapWithContent, mergeSourceFileMetrics } from './source-map-parser.js';

/**
 * Module information collected during build
 */
export interface ModuleInfo {
  id: string;
  code: string;
  size: number;
  imports: string[];
  importedBy: string[];
  package: string;
  type: 'npm' | 'local' | 'vendor';
}

/**
 * Options for detailed analysis
 */
export interface DetailedAnalysisOptions {
  /** Git branch name */
  branch?: string;

  /** Git commit hash */
  commit?: string;

  /** Build start time (for duration calculation) */
  buildStartTime?: number;

  /** Whether to use real compression (slower but accurate) */
  realCompression?: boolean;

  /** Whether to build dependency graph */
  analyzeGraph?: boolean;

  /** Whether to generate optimization recommendations */
  generateRecommendations?: boolean;

  /** Whether to analyze source maps */
  analyzeSourceMaps?: boolean;
}

/**
 * Analyzer state (accumulated during build)
 */
export interface AnalyzerState {
  modules: Map<string, ModuleInfo>;
  options: Required<DetailedAnalysisOptions>;
  analysisStartTime: number;
}

/**
 * Create a new analyzer state
 */
export function createAnalyzerState(
  options: DetailedAnalysisOptions = {}
): AnalyzerState {
  return {
    modules: new Map(),
    options: {
      branch: options.branch || 'unknown',
      commit: options.commit || 'unknown',
      buildStartTime: options.buildStartTime || Date.now(),
      realCompression: options.realCompression ?? true,
      analyzeGraph: options.analyzeGraph ?? true,
      generateRecommendations: options.generateRecommendations ?? true,
      analyzeSourceMaps: options.analyzeSourceMaps ?? true,
    },
    analysisStartTime: Date.now(),
  };
}

/**
 * Process a module during build (called from moduleParsed hook)
 * Returns updated state
 */
export function collectModuleInfo(
  state: AnalyzerState,
  moduleInfo: {
    id: string;
    code: string | null;
    importedIds: readonly string[];
  }
): AnalyzerState {
  if (!moduleInfo.code) return state;

  const packageName = extractPackageName(moduleInfo.id);
  const moduleType = getModuleType(moduleInfo.id);

  const newModule: ModuleInfo = {
    id: moduleInfo.id,
    code: moduleInfo.code,
    size: Buffer.from(moduleInfo.code).length,
    imports: [...moduleInfo.importedIds],
    importedBy: [],
    package: packageName,
    type: moduleType,
  };

  // Create new modules map with the new module
  const newModules = new Map(state.modules);
  newModules.set(moduleInfo.id, newModule);

  // Update importedBy relationships
  for (const importedId of moduleInfo.importedIds) {
    const imported = newModules.get(importedId);
    if (imported && !imported.importedBy.includes(moduleInfo.id)) {
      imported.importedBy = [...imported.importedBy, moduleInfo.id];
      newModules.set(importedId, imported);
    }
  }

  return {
    ...state,
    modules: newModules,
  };
}

/**
 * Analyze the complete bundle and generate metrics
 */
export async function analyzeBundle(
  state: AnalyzerState,
  bundle: OutputBundle
): Promise<BuildMetrics> {
  const bundles: Bundle[] = [];
  const moduleMetrics: ModuleMetrics[] = [];
  const chunkToModules = new Map<string, string[]>();
  const sourceFilesArrays: SourceFileMetrics[][] = [];

  // Process each chunk/asset
  for (const [fileName, output] of Object.entries(bundle)) {
    if (fileName.endsWith('.map')) continue;

    if (output.type === 'chunk') {
      const chunkData = await processChunk(state, fileName, output, bundle);
      bundles.push(chunkData.bundle);
      moduleMetrics.push(...chunkData.modules);
      chunkToModules.set(fileName, chunkData.moduleIds);

      if (chunkData.sourceFiles && chunkData.sourceFiles.length > 0) {
        sourceFilesArrays.push(chunkData.sourceFiles);
      }
    } else {
      const assetData = await processAsset(state, fileName, output);
      bundles.push(assetData);
    }
  }

  // Build dependency graph
  const dependencyGraph = state.options.analyzeGraph
    ? buildDependencyGraph(state, chunkToModules)
    : undefined;

  // Calculate dependency metrics
  const detailedDependencies = calculateDependencyMetrics(
    moduleMetrics,
    bundles
  );

  // Merge source file metrics from all chunks
  const sourceFiles = sourceFilesArrays.length > 0
    ? mergeSourceFileMetrics(sourceFilesArrays)
    : undefined;

  // Generate optimizations
  const optimizations = state.options.generateRecommendations
    ? generateOptimizations(detailedDependencies, moduleMetrics, dependencyGraph)
    : undefined;

  // Calculate totals and breakdown
  const totalSize = bundles.reduce((sum, b) => sum + b.size, 0);
  const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0);
  const totalBrotliSize = bundles.reduce((sum, b) => sum + b.brotliSize, 0);
  const byType = calculateAssetBreakdown(bundles);

  const warnings = generateWarnings(bundles, totalSize);
  const recommendations = optimizations?.map(o => o.message) || [];

  const buildDuration = Date.now() - state.options.buildStartTime;
  const analysisTime = Date.now() - state.analysisStartTime;

  return {
    timestamp: new Date().toISOString(),
    commit: state.options.commit,
    branch: state.options.branch,
    buildDuration,
    bundles,
    totalSize,
    totalGzipSize,
    totalBrotliSize,
    chunkCount: bundles.length,
    byType,
    warnings,
    recommendations,
    modules: moduleMetrics,
    detailedDependencies,
    sourceFiles,
    dependencyGraph,
    optimizations,
    analysis: {
      realCompression: state.options.realCompression,
      sourceMapsAnalyzed: !!sourceFiles && sourceFiles.length > 0,
      graphAnalyzed: state.options.analyzeGraph,
      analysisTime,
    },
  };
}

// ===== PROCESSING FUNCTIONS =====

async function processChunk(
  state: AnalyzerState,
  fileName: string,
  chunk: OutputChunk,
  bundle: OutputBundle
): Promise<{
  bundle: Bundle;
  modules: ModuleMetrics[];
  moduleIds: string[];
  sourceFiles?: SourceFileMetrics[];
}> {
  const buffer = Buffer.from(chunk.code);
  const size = buffer.length;

  // Compression
  const { gzipSize, brotliSize } = state.options.realCompression
    ? {
        gzipSize: gzipSync(buffer).length,
        brotliSize: brotliCompressSync(buffer).length,
      }
    : {
        gzipSize: Math.round(size * 0.3),
        brotliSize: Math.round(size * 0.3 * 0.85),
      };

  // Extract module info
  const moduleIds = chunk.modules ? Object.keys(chunk.modules) : [];
  const modules: ModuleMetrics[] = [];

  for (const moduleId of moduleIds) {
    const moduleInfo = state.modules.get(moduleId);
    if (!moduleInfo) continue;

    modules.push({
      id: moduleId,
      package: moduleInfo.package,
      size: moduleInfo.size,
      chunks: [fileName],
      importedBy: moduleInfo.importedBy,
      imports: moduleInfo.imports,
      type: moduleInfo.type,
      treeshakeable: isTreeShakeable(moduleId),
    });
  }

  // Parse source map if available and enabled
  let sourceFiles: SourceFileMetrics[] | undefined;

  if (state.options.analyzeSourceMaps && chunk.map) {
    try {
      // Check if corresponding .map file exists in bundle
      const mapFileName = `${fileName}.map`;
      const mapOutput = bundle[mapFileName];

      if (mapOutput && mapOutput.type === 'asset') {
        const mapSource = typeof mapOutput.source === 'string'
          ? mapOutput.source
          : mapOutput.source.toString();

        sourceFiles = await parseSourceMapWithContent(
          JSON.parse(mapSource),
          fileName
        );
      } else if (typeof chunk.map === 'object') {
        // Use inline source map
        sourceFiles = await parseSourceMapWithContent(chunk.map, fileName);
      }
    } catch (error) {
      // Source map parsing failed - not critical, continue without it
      console.warn(`Failed to parse source map for ${fileName}:`, error);
    }
  }

  return {
    bundle: {
      name: fileName,
      size,
      gzipSize,
      brotliSize,
      type: getFileType(fileName),
      path: fileName,
      modules: moduleIds,
    },
    modules,
    moduleIds,
    sourceFiles,
  };
}

async function processAsset(
  _state: AnalyzerState,
  fileName: string,
  asset: OutputAsset
): Promise<Bundle> {
  const source = typeof asset.source === 'string'
    ? asset.source
    : asset.source.toString();
  const size = Buffer.from(source).length;

  // Assets often already compressed
  const gzipSize = Math.round(size * 0.3);
  const brotliSize = Math.round(gzipSize * 0.85);

  return {
    name: fileName,
    size,
    gzipSize,
    brotliSize,
    type: getFileType(fileName),
    path: fileName,
  };
}

// ===== GRAPH ANALYSIS =====

function buildDependencyGraph(
  state: AnalyzerState,
  _chunkToModules: Map<string, string[]>
): DependencyGraph {
  const nodes = new Map<string, DependencyGraphNode>();

  // Build nodes
  for (const [moduleId, moduleInfo] of state.modules) {
    const depth = calculateDepth(state.modules, moduleId);

    nodes.set(moduleId, {
      id: moduleId,
      imports: moduleInfo.imports,
      importedBy: moduleInfo.importedBy,
      depth,
      reason: depth === 0 ? 'entry' : 'static-import',
    });
  }

  // Detect issues
  const circular = detectCircularDependencies(nodes);
  const duplicates = detectDuplicatePackages(state.modules);

  // Mark circular nodes
  for (const circ of circular) {
    for (const nodeId of circ.chain) {
      const node = nodes.get(nodeId);
      if (node) {
        node.circular = true;
        node.circularChain = circ.chain;
      }
    }
  }

  return {
    nodes,
    duplicates,
    circular,
  };
}

function detectCircularDependencies(
  nodes: Map<string, DependencyGraphNode>
): Array<{ chain: string[]; impact: 'warning' | 'error' }> {
  const circular: Array<{ chain: string[]; impact: 'warning' | 'error' }> = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (nodeId: string, path: string[]): void => {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      const chain = [...path.slice(cycleStart), nodeId];
      circular.push({ chain, impact: 'warning' });
      return;
    }

    if (visited.has(nodeId)) return;

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const node = nodes.get(nodeId);
    if (node) {
      for (const importId of node.imports) {
        dfs(importId, [...path]);
      }
    }

    recursionStack.delete(nodeId);
  };

  for (const nodeId of nodes.keys()) {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  }

  return circular;
}

function detectDuplicatePackages(
  modules: Map<string, ModuleInfo>
): Array<{
  package: string;
  versions: Array<{ version: string; size: number; modules: string[] }>;
}> {
  const byPackage = new Map<string, Map<string, string[]>>();

  for (const [moduleId, moduleInfo] of modules) {
    if (moduleInfo.type !== 'npm') continue;

    const pkg = moduleInfo.package;
    const version = extractVersion(moduleId) || 'unknown';

    if (!byPackage.has(pkg)) {
      byPackage.set(pkg, new Map());
    }

    const versions = byPackage.get(pkg)!;
    const mods = versions.get(version) || [];
    mods.push(moduleId);
    versions.set(version, mods);
  }

  const duplicates: Array<{
    package: string;
    versions: Array<{ version: string; size: number; modules: string[] }>;
  }> = [];

  for (const [pkg, versions] of byPackage) {
    if (versions.size > 1) {
      duplicates.push({
        package: pkg,
        versions: Array.from(versions.entries()).map(([version, mods]) => ({
          version,
          size: mods.reduce((sum, id) => {
            const mod = modules.get(id);
            return sum + (mod?.size || 0);
          }, 0),
          modules: mods,
        })),
      });
    }
  }

  return duplicates;
}

// ===== METRICS CALCULATION =====

function calculateDependencyMetrics(
  modules: ModuleMetrics[],
  bundles: Bundle[]
): DependencyMetrics[] {
  const byPackage = new Map<string, ModuleMetrics[]>();

  for (const mod of modules) {
    const list = byPackage.get(mod.package) || [];
    list.push(mod);
    byPackage.set(mod.package, list);
  }

  const totalBundleSize = bundles.reduce((sum, b) => sum + b.size, 0);

  return Array.from(byPackage.entries())
    .map(([pkg, mods]) => {
      const totalSize = mods.reduce((sum, m) => sum + m.size, 0);
      const chunks = [...new Set(mods.flatMap(m => m.chunks))];

      return {
        name: pkg,
        totalSize,
        moduleCount: mods.length,
        chunks,
        firstImportedBy: mods[0]?.importedBy[0],
        treeshakeable: mods.some(m => m.treeshakeable),
        duplicate: false,
        percentOfTotal: (totalSize / totalBundleSize) * 100,
      };
    })
    .sort((a, b) => b.totalSize - a.totalSize);
}

function generateOptimizations(
  dependencies: DependencyMetrics[],
  _modules: ModuleMetrics[],
  graph?: DependencyGraph
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  // Large dependencies
  for (const dep of dependencies) {
    if (dep.totalSize > 100 * 1024 && dep.moduleCount > 10) {
      recommendations.push({
        type: 'tree-shaking',
        severity: 'warning',
        message: `${dep.name} is large (${formatSize(dep.totalSize)}) with ${dep.moduleCount} modules`,
        action: 'Consider using named imports or checking if all exports are needed',
        potentialSavings: Math.round(dep.totalSize * 0.5),
        affectedPackages: [dep.name],
      });
    }
  }

  // Duplicates
  if (graph?.duplicates) {
    for (const dup of graph.duplicates) {
      const totalWaste = dup.versions.reduce((sum: number, v: { version: string; size: number; modules: string[] }) => sum + v.size, 0)
        - Math.max(...dup.versions.map((v: { version: string; size: number; modules: string[] }) => v.size));

      recommendations.push({
        type: 'duplicate',
        severity: 'error',
        message: `Duplicate package detected: ${dup.package}`,
        action: "Run 'npm dedupe' or consolidate versions in package.json",
        potentialSavings: totalWaste,
        affectedPackages: [dup.package],
        example: `Versions: ${dup.versions.map((v: { version: string; size: number; modules: string[] }) => v.version).join(', ')}`,
      });
    }
  }

  // Circular dependencies
  if (graph?.circular) {
    for (const circ of graph.circular) {
      recommendations.push({
        type: 'code-splitting',
        severity: circ.impact,
        message: 'Circular dependency detected',
        action: 'Refactor to break circular imports',
        affectedPackages: circ.chain.map((id: string) => extractPackageName(id)),
        example: circ.chain.slice(0, 3).join(' → ') + '...',
      });
    }
  }

  return recommendations;
}

// ===== UTILITY FUNCTIONS =====

function calculateDepth(
  modules: Map<string, ModuleInfo>,
  moduleId: string,
  visited = new Set<string>()
): number {
  if (visited.has(moduleId)) return Infinity;

  const moduleInfo = modules.get(moduleId);
  if (!moduleInfo || moduleInfo.importedBy.length === 0) {
    return 0;
  }

  visited.add(moduleId);
  const depths = moduleInfo.importedBy.map(id =>
    calculateDepth(modules, id, new Set(visited))
  );

  return Math.min(...depths) + 1;
}

function extractPackageName(id: string): string {
  if (id.includes('node_modules')) {
    const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
    return match ? match[1] : 'unknown';
  }
  return 'your-app';
}

function extractVersion(id: string): string | null {
  const match = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)@([^/]+)/);
  return match ? match[2] : null;
}

function getModuleType(id: string): 'npm' | 'local' | 'vendor' {
  if (id.includes('node_modules')) return 'npm';
  if (id.startsWith('\0') || id.startsWith('virtual:')) return 'vendor';
  return 'local';
}

function isTreeShakeable(id: string): boolean {
  if (!id.includes('node_modules')) return true;
  return id.includes('/esm/') || id.includes('/es/') || id.endsWith('.mjs');
}

function getFileType(fileName: string): Bundle['type'] {
  if (fileName.match(/\.(js|mjs|cjs)$/)) return 'js';
  if (fileName.endsWith('.css')) return 'css';
  if (fileName.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) return 'asset';
  if (fileName.endsWith('.html')) return 'html';
  return 'other';
}

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

function generateWarnings(bundles: Bundle[], totalSize: number): string[] {
  const warnings: string[] = [];

  if (totalSize > 500 * 1024) {
    warnings.push(`Total bundle size (${formatSize(totalSize)}) exceeds 500 KB`);
  }

  for (const bundle of bundles) {
    if (bundle.type === 'js' && bundle.size > 250 * 1024) {
      warnings.push(`${bundle.name} is large (${formatSize(bundle.size)})`);
    }
  }

  return warnings;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
