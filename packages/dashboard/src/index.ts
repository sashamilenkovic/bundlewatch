/**
 * @milencode/bundlewatch-dashboard
 * Interactive visualization and reporting for bundle metrics
 */

// Re-export dashboard generation from parsers
export {
  formatBytes,
  generateEnhancedDashboard,
  generateTreemapData,
} from '@milencode/bundlewatch-parsers';

// Export utilities
export { type ExportOptions, exportComparison, exportStatic } from './export.js';
