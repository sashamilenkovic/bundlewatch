/**
 * Local development server for the dashboard
 */

import { createApp, createRouter, eventHandler, toNodeListener } from 'h3';
import { createServer } from 'node:http';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import open from 'open';
import { generateDashboardHTML, type DashboardData } from './template.js';
import type { BuildMetrics } from '@milencode/bundlewatch-core';

export interface ServerOptions {
  port?: number;
  host?: string;
  dataSource?: 'git' | 'file';
  gitBranch?: string;
  workingDir?: string;
  open?: boolean;
}

const defaultOptions: Required<ServerOptions> = {
  port: 3333,
  host: 'localhost',
  dataSource: 'git',
  gitBranch: 'bundlewatch-data',
  workingDir: process.cwd(),
  open: true,
};

/**
 * Load metrics from git branch or file
 */
async function loadMetrics(options: Required<ServerOptions>): Promise<DashboardData> {
  if (options.dataSource === 'file') {
    // Load from file
    const filePath = resolve(options.workingDir, 'bundlewatch-metrics.json');
    const content = await readFile(filePath, 'utf-8');
    const metrics = JSON.parse(content) as BuildMetrics;
    
    return {
      current: metrics,
      historical: [],
    };
  }

  // Load from git (placeholder - will implement git loading)
  // For now, try to load from a local file
  try {
    const metricPath = resolve(options.workingDir, '.bundlewatch', 'latest.json');
    const content = await readFile(metricPath, 'utf-8');
    const metrics = JSON.parse(content) as BuildMetrics;
    
    return {
      current: metrics,
      historical: [],
    };
  } catch (error) {
    throw new Error(
      'No metrics found. Please run a build with bundlewatch first, or specify --data-source file'
    );
  }
}

/**
 * Create and start the dashboard server
 */
export async function createDashboard(userOptions: ServerOptions = {}): Promise<void> {
  const options = { ...defaultOptions, ...userOptions };

  // Load data
  let dashboardData: DashboardData;
  try {
    dashboardData = await loadMetrics(options);
  } catch (error) {
    console.error('❌ Error loading metrics:', (error as Error).message);
    process.exit(1);
  }

  // Create h3 app and router
  const app = createApp();
  const router = createRouter();

  // Serve dashboard
  router.get('/', eventHandler(() => {
    const html = generateDashboardHTML(dashboardData);
    return html;
  }));

  // API endpoint for live data (future: SSE or websockets)
  router.get('/api/metrics', eventHandler(() => {
    return dashboardData;
  }));

  // Health check
  router.get('/health', eventHandler(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }));

  app.use(router);

  // Start server
  const server = createServer(toNodeListener(app));
  
  server.listen(options.port, options.host, () => {
    const url = `http://${options.host}:${options.port}`;
    console.log('');
    console.log('📊 Bundle Watch Dashboard');
    console.log('══════════════════════════════════════════════════');
    console.log(`  🌐 Local:     ${url}`);
    console.log(`  📦 Project:   ${dashboardData.current.branch}`);
    console.log(`  📝 Commit:    ${dashboardData.current.commit.slice(0, 7)}`);
    console.log('══════════════════════════════════════════════════');
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');

    // Open browser
    if (options.open) {
      open(url).catch(() => {
        console.log('Could not open browser automatically. Please visit the URL above.');
      });
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down dashboard server...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

