#!/usr/bin/env node

/**
 * BundleWatch CLI
 * Utilities for managing bundle metrics
 */

import { Command } from 'commander';
import { backfillCommand } from './commands/backfill.js';
import { analyzeCommand } from './commands/analyze.js';

const program = new Command();

program
  .name('bundlewatch')
  .description('CLI utilities for BundleWatch - analyze bundle size history')
  .version('2.2.0');

// Register commands
program.addCommand(backfillCommand);
program.addCommand(analyzeCommand);

program.parse();
