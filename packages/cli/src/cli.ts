#!/usr/bin/env node

/**
 * BundleWatch CLI
 * Utilities for managing bundle metrics
 */

import { Command } from 'commander';
import { backfillCommand } from './commands/backfill.js';

const program = new Command();

program
  .name('bundlewatch')
  .description('CLI utilities for BundleWatch - analyze bundle size history')
  .version('1.4.0');

// Register commands
program.addCommand(backfillCommand);

program.parse();
