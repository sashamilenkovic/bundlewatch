/**
 * Export command - Generate static HTML dashboard
 */

import { exportStatic } from '@milencode/bundlewatch-dashboard';
import { collectMetrics } from '@milencode/bundlewatch-core';
import { resolve } from 'path';

export interface ExportCommandOptions {
  output?: string;
  outputDir?: string;
  workingDir?: string;
}

export async function exportCommand(
  buildDir: string,
  options: ExportCommandOptions
): Promise<void> {
  console.log('📊 Generating Bundle Watch Dashboard...\n');

  const outputDir = options.output || options.outputDir || './bundle-report';
  const workingDir = options.workingDir || process.cwd();
  const distPath = resolve(workingDir, buildDir);

  console.log(`  📂 Analyzing: ${distPath}`);
  console.log(`  💾 Output:    ${outputDir}\n`);

  // Collect metrics
  const metrics = await collectMetrics({
    outputDir: distPath,
    buildStartTime: Date.now(),
    projectRoot: workingDir,
  });

  // Export dashboard
  const indexPath = await exportStatic({
    output: outputDir,
    metrics,
  });

  console.log('✅ Dashboard generated successfully!\n');
  console.log(`  📄 HTML:  ${indexPath}`);
  console.log(`  📊 Data:  ${outputDir}/data.json\n`);
  console.log('💡 To view: open ' + indexPath);
  console.log('💡 Or run: npx serve ' + outputDir + '\n');
}

