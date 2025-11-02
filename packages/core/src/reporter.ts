/**
 * Report generator - creates markdown, badges, and formatted output
 * Using functional composition instead of classes
 */

import type { BuildMetrics, Comparison, BundleChange } from './types.js';

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return Math.round((Math.abs(bytes) / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration in ms to human-readable
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get badge color based on size
 */
function getBadgeColor(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 100) return 'brightgreen';
  if (kb < 250) return 'green';
  if (kb < 500) return 'yellow';
  if (kb < 1000) return 'orange';
  return 'red';
}

/**
 * Get emoji for bundle change
 */
function getChangeEmoji(change: BundleChange): string {
  if (change.status === 'added') return '➕';
  if (change.status === 'removed') return '➖';
  if (Math.abs(change.diffPercent) < 1) return '➡️';
  return change.diff > 0 ? '🔼' : '🔽';
}

/**
 * Format bundle change to string
 */
function formatChange(change: BundleChange): string {
  if (change.status === 'added') {
    return `+${formatSize(change.current!)} (new)`;
  }
  if (change.status === 'removed') {
    return `-${formatSize(change.previous!)} (removed)`;
  }
  
  const sign = change.diff > 0 ? '+' : '';
  return `${sign}${formatSize(Math.abs(change.diff))} (${sign}${change.diffPercent.toFixed(1)}%)`;
}

/**
 * Get status label
 */
function getStatusLabel(status: BundleChange['status']): string {
  switch (status) {
    case 'added': return '🆕 Added';
    case 'removed': return '🗑️ Removed';
    case 'changed': return '📝 Changed';
    case 'unchanged': return '✓ Unchanged';
  }
}

/**
 * Generate markdown badge for README
 */
export function generateBadge(metrics: BuildMetrics): string {
  const totalKB = Math.round(metrics.totalSize / 1024);
  const gzipKB = Math.round(metrics.totalGzipSize / 1024);
  
  const color = getBadgeColor(metrics.totalSize);
  
  return `![Bundle Size](https://img.shields.io/badge/bundle-${totalKB}KB-${color}) ![Gzip Size](https://img.shields.io/badge/gzipped-${gzipKB}KB-${color})`;
}

/**
 * Generate full README section with metrics table
 */
export function generateReadmeSection(metrics: BuildMetrics, comparison?: Comparison): string {
  const lines: string[] = [];
  
  lines.push('## 📊 Bundle Watch\n');
  lines.push(generateBadge(metrics));
  lines.push('');
  lines.push(`**Latest Build:** \`${metrics.commit.substring(0, 7)}\` on \`${metrics.branch}\` (${new Date(metrics.timestamp).toLocaleDateString()})\n`);
  
  // Main metrics table
  lines.push('| Metric | Size | Gzipped | Brotli |');
  lines.push('|--------|------|---------|--------|');
  
  lines.push(`| **Total** | ${formatSize(metrics.totalSize)} | ${formatSize(metrics.totalGzipSize)} | ${formatSize(metrics.totalBrotliSize)} |`);
  lines.push(`| JavaScript | ${formatSize(metrics.byType.javascript)} | - | - |`);
  lines.push(`| CSS | ${formatSize(metrics.byType.css)} | - | - |`);
  lines.push(`| Assets | ${formatSize(metrics.byType.images + metrics.byType.fonts + metrics.byType.other)} | - | - |`);
  lines.push('');

  // Comparison section
  if (comparison) {
    lines.push(`### 📈 Comparison vs ${comparison.target}\n`);
    lines.push(comparison.summary);
    lines.push('');

    if (comparison.changes.byBundle.length > 0) {
      lines.push('| Bundle | Current | Previous | Change |');
      lines.push('|--------|---------|----------|--------|');
      
      // Show top 5 changes
      const topChanges = comparison.changes.byBundle
        .filter(c => c.status !== 'unchanged')
        .slice(0, 5);
      
      for (const change of topChanges) {
        const emoji = getChangeEmoji(change);
        const changeStr = formatChange(change);
        lines.push(`| ${change.name} | ${formatSize(change.current || 0)} | ${formatSize(change.previous || 0)} | ${emoji} ${changeStr} |`);
      }
      lines.push('');
    }

    if (comparison.recommendations.length > 0) {
      lines.push('### 💡 Insights\n');
      for (const rec of comparison.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generate PR comment markdown
 */
export function generatePRComment(metrics: BuildMetrics, comparison: Comparison): string {
  const lines: string[] = [];
  
  lines.push('## 🤖 Bundle Watch Report\n');
  lines.push(`### ${comparison.summary}\n`);

  // Summary table
  lines.push('| Metric | Current | Previous | Change |');
  lines.push('|--------|---------|----------|--------|');
  
  const formatChangeCell = (change: number, percent: number) => {
    const emoji = change > 0 ? '🔼' : change < 0 ? '🔽' : '➡️';
    const sign = change > 0 ? '+' : '';
    return `${emoji} ${sign}${formatSize(Math.abs(change))} (${sign}${percent.toFixed(1)}%)`;
  };

  lines.push(`| Total Size | ${formatSize(metrics.totalSize)} | ${formatSize(comparison.changes.totalSize.previous)} | ${formatChangeCell(comparison.changes.totalSize.diff, comparison.changes.totalSize.diffPercent)} |`);
  lines.push(`| Gzip Size | ${formatSize(metrics.totalGzipSize)} | ${formatSize(comparison.changes.totalGzipSize.previous)} | ${formatChangeCell(comparison.changes.totalGzipSize.diff, comparison.changes.totalGzipSize.diffPercent)} |`);
  lines.push(`| Build Time | ${formatDuration(metrics.buildDuration)} | ${formatDuration(comparison.changes.buildDuration.previous)} | ${formatChangeCell(comparison.changes.buildDuration.diff, comparison.changes.buildDuration.diffPercent)} |`);
  lines.push('');

  // Bundle changes
  const significantChanges = comparison.changes.byBundle
    .filter(c => Math.abs(c.diffPercent) > 1 || c.status === 'added' || c.status === 'removed')
    .slice(0, 10);

  if (significantChanges.length > 0) {
    lines.push('### 📦 Bundle Changes\n');
    lines.push('| Bundle | Status | Change |');
    lines.push('|--------|--------|--------|');
    
    for (const change of significantChanges) {
      const emoji = getChangeEmoji(change);
      const changeStr = formatChange(change);
      const status = getStatusLabel(change.status);
      lines.push(`| ${change.name} | ${status} | ${emoji} ${changeStr} |`);
    }
    lines.push('');
  }

  // Insights
  if (comparison.recommendations.length > 0) {
    lines.push('### 💡 Insights\n');
    for (const rec of comparison.recommendations) {
      lines.push(`${rec}\n`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate console output
 */
export function generateConsoleOutput(metrics: BuildMetrics, comparison?: Comparison): string {
  const lines: string[] = [];
  
  lines.push('\n📊 Bundle Watch Report\n');
  lines.push('═'.repeat(50));
  lines.push('');
  
  lines.push(`Total Size:    ${formatSize(metrics.totalSize)}`);
  lines.push(`Gzipped:       ${formatSize(metrics.totalGzipSize)}`);
  lines.push(`Brotli:        ${formatSize(metrics.totalBrotliSize)}`);
  lines.push(`Build Time:    ${formatDuration(metrics.buildDuration)}`);
  lines.push(`Chunks:        ${metrics.chunkCount}`);
  lines.push('');

  // By type breakdown
  lines.push('By Type:');
  lines.push(`  JavaScript:  ${formatSize(metrics.byType.javascript)}`);
  lines.push(`  CSS:         ${formatSize(metrics.byType.css)}`);
  lines.push(`  Images:      ${formatSize(metrics.byType.images)}`);
  lines.push(`  Fonts:       ${formatSize(metrics.byType.fonts)}`);
  lines.push(`  Other:       ${formatSize(metrics.byType.other)}`);
  lines.push('');

  // Dependency breakdown (if available)
  if (metrics.dependencies && metrics.dependencies.length > 0) {
    lines.push('📦 Dependencies:');
    const topDeps = metrics.dependencies.slice(0, 5);
    for (const dep of topDeps) {
      const percent = ((dep.size / metrics.totalSize) * 100).toFixed(1);
      lines.push(`  ${dep.name.padEnd(20)} ${formatSize(dep.size).padStart(10)} (${percent}%)`);
    }
    if (metrics.dependencies.length > 5) {
      lines.push(`  ... and ${metrics.dependencies.length - 5} more`);
    }
    lines.push('');
  }

  // Comparison
  if (comparison) {
    lines.push('─'.repeat(50));
    lines.push(`Comparison vs ${comparison.target}:`);
    lines.push('');
    lines.push(comparison.summary);
    lines.push('');

    if (comparison.recommendations.length > 0) {
      lines.push('💡 Insights:');
      for (const rec of comparison.recommendations) {
        lines.push(`  ${rec}`);
      }
      lines.push('');
    }
  }

  // Warnings
  if (metrics.warnings.length > 0) {
    lines.push('⚠️  Warnings:');
    for (const warning of metrics.warnings) {
      lines.push(`  ${warning}`);
    }
    lines.push('');
  }

  // Recommendations
  if (metrics.recommendations.length > 0) {
    lines.push('💡 Recommendations:');
    for (const rec of metrics.recommendations) {
      lines.push(`  ${rec}`);
    }
    lines.push('');
  }

  lines.push('═'.repeat(50));
  
  return lines.join('\n');
}

/**
 * Legacy class wrapper for backwards compatibility
 * @deprecated Use generateBadge(), generateReadmeSection(), etc. functions directly
 */
export class ReportGenerator {
  generateBadge(metrics: BuildMetrics): string {
    return generateBadge(metrics);
  }

  generateReadmeSection(metrics: BuildMetrics, comparison?: Comparison): string {
    return generateReadmeSection(metrics, comparison);
  }

  generatePRComment(metrics: BuildMetrics, comparison: Comparison): string {
    return generatePRComment(metrics, comparison);
  }

  generateConsoleOutput(metrics: BuildMetrics, comparison?: Comparison): string {
    return generateConsoleOutput(metrics, comparison);
  }
}
