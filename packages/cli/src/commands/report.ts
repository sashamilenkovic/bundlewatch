/**
 * Report command - generate reports
 */

import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { GitStorage, ReportGenerator } from '@milencode/bundlewatch-core';

interface ReportOptions {
  branch: string;
  format: 'console' | 'markdown' | 'json';
  output?: string;
}

export async function reportCommand(options: ReportOptions) {
  console.log(`📊 Generating report for ${options.branch}...\n`);

  try {
    const storage = new GitStorage();
    const metrics = await storage.load(options.branch);

    if (!metrics) {
      console.error(`❌ No metrics found for ${options.branch}`);
      process.exit(1);
    }

    const reporter = new ReportGenerator();
    let output: string;

    switch (options.format) {
      case 'markdown':
        output = reporter.generateReadmeSection(metrics);
        break;
      case 'json':
        output = JSON.stringify(metrics, null, 2);
        break;
      case 'console':
      default:
        output = reporter.generateConsoleOutput(metrics);
        break;
    }

    if (options.output) {
      const outputPath = resolve(process.cwd(), options.output);
      await writeFile(outputPath, output, 'utf-8');
      console.log(`✅ Report saved to ${outputPath}`);
    } else {
      console.log(output);
    }

  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}
