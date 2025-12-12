/**
 * @milencode/bundlewatch-parsers
 * Parse existing analyzer tool outputs instead of re-analyzing
 */

export {
  aggregateDependencyMetrics,
  buildDependencyGraph,
  extractPackageName,
  generateOptimizationRecommendations,
  getModuleType,
  isLocalPackage,
} from './analysis-utils.js';
export {
  compressBoth,
  compressBrotli,
  compressGzip,
} from './compression.js';
export {
  formatBytes,
  generateEnhancedDashboard,
  generateOutputChunksData,
  generateTreemapData,
} from './dashboard.js';
export {
  mergeSourceFileMetrics,
  parseSourceMap,
  parseSourceMapWithContent,
} from './source-map-parser.js';
export {
  type AnalyzerState,
  analyzeBundle,
  collectModuleInfo,
  createAnalyzerState,
  type DetailedAnalysisOptions,
  type ModuleInfo,
} from './vite.js';
export { parseWebpackStats, type WebpackStats } from './webpack.js';

// Future parsers:
// export { parseRollupVisualizer } from './rollup.js';
