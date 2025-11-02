/**
 * Analyze command - analyze current build
 */

import { resolve } from 'path';
import { MetricsCollector, GitStorage, ComparisonEngine, ReportGenerator } from '@bundlewatch/core';

interface AnalyzeOptions {
  output: string;
  save: boolean;
  print: boolean;
  compare?: string;
}

export async function analyzeCommand(options: AnalyzeOptions) {
  console.log('📊 Analyzing build output...\n');

  try {
    const outputDir = resolve(process.cwd(), options.output);
    
    // Get git info
    const commit = await GitStorage.getCurrentCommit();
    const branch = await GitStorage.getCurrentBranch();

    // Collect metrics
    const collector = new MetricsCollector({
      outputDir,
      branch,
      commit,
      buildStartTime: Date.now() - 1000, // Approximate
    });

    const metrics = await collector.collect();
    const reporter = new ReportGenerator();

    // Compare if requested
    let comparison;
    if (options.compare) {
      console.log(`📊 Comparing against ${options.compare}...\n`);
      const storage = new GitStorage();
      const baseline = await storage.load(options.compare);
      
      if (baseline) {
        const analyzer = new ComparisonEngine();
        comparison = analyzer.compare(metrics, baseline, options.compare);
      } else {
        console.warn(`⚠️  No baseline found for ${options.compare}`);
      }
    }

    // Print report
    if (options.print) {
      console.log(reporter.generateConsoleOutput(metrics, comparison));
    }

    // Save to storage
    if (options.save) {
      console.log('💾 Saving metrics to git storage...');
      const storage = new GitStorage();
      await storage.save(metrics);
      console.log('✅ Metrics saved successfully\n');
    }

    // Exit with appropriate code
    if (metrics.warnings.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error analyzing build:', error);
    process.exit(1);
  }
}
