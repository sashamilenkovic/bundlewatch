/**
 * @milencode/bundlewatch-core
 * Framework-agnostic build analytics core
 */

// export * from './collector.js'; // DELETED - Use parsers instead (vite.ts, webpack.ts)
export * from './analyzer.js';
export {
  ReportGenerator,
  generateBadge,
  generateCompactJson,
  generateCompactSummary,
  generateConsoleOutput,
  generatePRComment,
  generateReadmeSection,
} from './reporter.js';
export {
  GitStorage,
  getCurrentBranch,
  getCurrentCommit,
  listMetrics,
  loadMetrics,
  saveMetrics,
} from './storage.js';
export * from './types.js';

// Attribution system
export {
  // Types
  type ModuleAttribution,
  type AttributionOptions,
  type ModuleType,
  type FrameworkType,
  type LocalCategory,
  // Constants
  DEFAULT_LOCAL_DIRECTORIES,
  FRAMEWORK_PATTERNS,
  CATEGORY_PATTERNS,
  // Functions
  attributeModule,
  attributeModules,
  groupByAttribution,
  extractPackageName,
  // Individual extractors
  extractNpmAttribution,
  isNpmPath,
  extractLocalAttribution,
  isLocalPath,
  extractFrameworkAttribution,
  isFrameworkPath,
  detectFramework,
  extractWorkspaceAttribution,
  isWorkspacePath,
  // Class
  AttributionEngine,
} from './attribution/index.js';
