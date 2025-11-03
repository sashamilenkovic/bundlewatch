/**
 * Serve command - Start local dashboard server
 */

import { createDashboard } from '@milencode/bundlewatch-dashboard';

export interface ServeCommandOptions {
  port?: number;
  host?: string;
  dataSource?: 'git' | 'file';
  gitBranch?: string;
  open?: boolean;
}

export async function serveCommand(options: ServeCommandOptions): Promise<void> {
  console.log('🚀 Starting Bundle Watch Dashboard...\n');

  await createDashboard({
    port: options.port || 3333,
    host: options.host || 'localhost',
    dataSource: options.dataSource || 'git',
    gitBranch: options.gitBranch || 'bundlewatch-data',
    workingDir: process.cwd(),
    open: options.open !== false,
  });
}

