/**
 * @milencode/bundlewatch-dashboard
 * Interactive visualization and reporting for bundle metrics
 */

// Re-export dashboard generation from parsers
export {
  generateEnhancedDashboard,
  generateTreemapData,
  formatBytes,
} from '@milencode/bundlewatch-parsers';

// Export utilities
export { exportStatic, exportComparison, type ExportOptions } from './export.js';
