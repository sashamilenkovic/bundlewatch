/**
 * @milencode/bundlewatch-dashboard
 * Interactive visualization and reporting for bundle metrics
 */

export { createDashboard, type ServerOptions } from './server.js';
export { exportStatic, exportComparison, type ExportOptions } from './export.js';
export { generateDashboardHTML, type DashboardData } from './template.js';

