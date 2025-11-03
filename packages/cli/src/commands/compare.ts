/**
 * Compare command - compare builds
 */

import { resolve } from 'path';
import { MetricsCollector, GitStorage, ComparisonEngine, ReportGenerator } from '@milencode/bundlewatch-core';

interface CompareOptions {
  output: string;
}

export async function compareCommand(target: string, options: CompareOptions) {
  console.log(`📊 Comparing against ${target}...\n`);

  try {
    const outputDir = resolve(process.cwd(), options.output);
    
    // Get current metrics
    const commit = await GitStorage.getCurrentCommit();
    const branch = await GitStorage.getCurrentBranch();

    const collector = new MetricsCollector({
      outputDir,
      branch,
      commit,
      buildStartTime: Date.now() - 1000,
    });

    const current = await collector.collect();

    // Load baseline
    const storage = new GitStorage();
    const baseline = await storage.load(target);

    if (!baseline) {
      console.error(`❌ No metrics found for ${target}`);
      console.log('\nTip: Run a build and save metrics first with:');
      console.log('  bundlewatch analyze --save');
      process.exit(1);
    }

    // Compare
    const analyzer = new ComparisonEngine();
    const comparison = analyzer.compare(current, baseline, target);

    // Generate report
    const reporter = new ReportGenerator();
    console.log(reporter.generateConsoleOutput(current, comparison));

    // Exit with code based on comparison
    if (comparison.changes.totalSize.diffPercent > 10) {
      console.error('\n❌ Bundle size increased significantly!');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error comparing builds:', error);
    process.exit(1);
  }
}
