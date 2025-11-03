#!/usr/bin/env node

/**
 * BundleWatch CLI
 */

import { Command } from 'commander';
import { analyzeCommand } from './commands/analyze.js';
import { compareCommand } from './commands/compare.js';
import { reportCommand } from './commands/report.js';
import { serveCommand } from './commands/serve.js';
import { exportCommand } from './commands/export.js';

const program = new Command();

program
  .name('bundlewatch')
  .description('Analyze and track your build metrics over time')
  .version('0.1.0');

// Analyze command
program
  .command('analyze')
  .description('Analyze the current build output')
  .option('-o, --output <dir>', 'Build output directory', 'dist')
  .option('-s, --save', 'Save metrics to git storage', false)
  .option('-p, --print', 'Print report to console', true)
  .option('-c, --compare <branch>', 'Compare against target branch')
  .action(analyzeCommand);

// Compare command
program
  .command('compare')
  .description('Compare current build against a target')
  .argument('[target]', 'Target branch or commit to compare against', 'main')
  .option('-o, --output <dir>', 'Build output directory', 'dist')
  .action(compareCommand);

// Report command
program
  .command('report')
  .description('Generate reports from stored metrics')
  .option('-b, --branch <branch>', 'Branch to generate report for', 'main')
  .option('-f, --format <format>', 'Output format (console, markdown, json)', 'console')
  .option('-o, --output <file>', 'Output file path')
  .action(reportCommand);

// Serve command
program
  .command('serve')
  .description('Start local dashboard server')
  .option('-p, --port <port>', 'Port to run server on', '3333')
  .option('-h, --host <host>', 'Host to bind to', 'localhost')
  .option('--no-open', 'Don\'t open browser automatically')
  .option('--data-source <source>', 'Data source (git or file)', 'git')
  .option('--git-branch <branch>', 'Git branch to read data from', 'bundlewatch-data')
  .action((options) => {
    serveCommand({
      port: parseInt(options.port),
      host: options.host,
      open: options.open,
      dataSource: options.dataSource,
      gitBranch: options.gitBranch,
    });
  });

// Export command
program
  .command('export')
  .description('Generate static HTML dashboard')
  .argument('[build-dir]', 'Build output directory to analyze', 'dist')
  .option('-o, --output <dir>', 'Output directory for dashboard', './bundle-report')
  .action(exportCommand);

program.parse();
