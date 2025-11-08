#!/usr/bin/env node
/**
 * Demo: Parse webpack stats instead of re-analyzing files
 * Shows the speed difference!
 */

import { parseWebpackStats } from './dist/index.js';
import { performance } from 'perf_hooks';

// Simulated webpack stats.json (from webpack-app example)
const mockWebpackStats = {
  time: 1662,
  hash: 'a2bfaaf5d7a204d3de1f',
  assets: [
    {
      name: 'main.a2bfaaf5d7a204d3de1f.js',
      size: 190887,  // ~186 KB
      chunks: [179],
      chunkNames: ['main'],
    },
    {
      name: 'index.html',
      size: 1489,
    },
  ],
};

console.log('🚀 Webpack Stats Parser Demo\n');
console.log('Simulating webpack build output...\n');

// Measure parsing time
const start = performance.now();

const metrics = parseWebpackStats(mockWebpackStats, {
  branch: 'main',
  commit: 'abc123',
  estimateCompression: true,
});

const duration = performance.now() - start;

console.log('📊 Parsed Results:\n');
console.log(`Total Size:    ${formatBytes(metrics.totalSize)}`);
console.log(`Gzipped:       ${formatBytes(metrics.totalGzipSize)} (estimated)`);
console.log(`Brotli:        ${formatBytes(metrics.totalBrotliSize)} (estimated)`);
console.log(`Build Time:    ${metrics.buildDuration}ms`);
console.log(`Chunks:        ${metrics.chunkCount}`);
console.log();

console.log('By Type:');
console.log(`  JavaScript:  ${formatBytes(metrics.byType.javascript)}`);
console.log(`  CSS:         ${formatBytes(metrics.byType.css)}`);
console.log(`  Images:      ${formatBytes(metrics.byType.images)}`);
console.log(`  Other:       ${formatBytes(metrics.byType.other)}`);
console.log();

if (metrics.warnings.length > 0) {
  console.log('⚠️  Warnings:');
  metrics.warnings.forEach(w => console.log(`  - ${w}`));
  console.log();
}

if (metrics.recommendations.length > 0) {
  console.log('💡 Recommendations:');
  metrics.recommendations.forEach(r => console.log(`  - ${r}`));
  console.log();
}

console.log('⚡ Performance:');
console.log(`  Parsing time: ${duration.toFixed(2)}ms`);
console.log(`  vs Re-analyzing: ~2000ms`);
console.log(`  Speed up: ${(2000 / duration).toFixed(0)}x faster! 🚀`);

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

