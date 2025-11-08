/**
 * @milencode/bundlewatch-parsers
 * Parse existing analyzer tool outputs instead of re-analyzing
 */

export { parseWebpackStats, type WebpackStats } from './webpack.js';

export {
  createAnalyzerState,
  collectModuleInfo,
  analyzeBundle,
  type DetailedAnalysisOptions,
  type AnalyzerState,
  type ModuleInfo,
} from './vite.js';

export {
  parseSourceMap,
  parseSourceMapWithContent,
  mergeSourceFileMetrics,
} from './source-map-parser.js';

export {
  generateEnhancedDashboard,
  generateTreemapData,
  formatBytes,
} from './dashboard.js';

export {
  compressGzip,
  compressBrotli,
  compressBoth,
} from './compression.js';

export {
  extractPackageName,
  getModuleType,
  buildDependencyGraph,
  aggregateDependencyMetrics,
  generateOptimizationRecommendations,
} from './analysis-utils.js';

// Future parsers:
// export { parseRollupVisualizer } from './rollup.js';

