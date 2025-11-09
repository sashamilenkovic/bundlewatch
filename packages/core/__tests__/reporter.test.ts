/**
 * Tests for reporter functions
 */

import { describe, it, expect } from 'vitest';
import {
  generateBadge,
  generateReadmeSection,
  generatePRComment,
  generateConsoleOutput,
} from '../src/reporter';
import type { BuildMetrics, Comparison } from '../src/types';

describe('reporter functions', () => {
  const mockMetrics: BuildMetrics = {
    timestamp: '2025-11-02T12:00:00.000Z',
    commit: 'abc1234567',
    branch: 'main',
    buildDuration: 3240,
    bundles: [
      {
        name: 'assets/index.js',
        size: 185300,
        gzipSize: 67000,
        brotliSize: 60000,
        type: 'js',
      },
      {
        name: 'assets/style.css',
        size: 45200,
        gzipSize: 18000,
        brotliSize: 16000,
        type: 'css',
      },
    ],
    totalSize: 230500,
    totalGzipSize: 85000,
    totalBrotliSize: 76000,
    chunkCount: 2,
    byType: {
      javascript: 185300,
      css: 45200,
      images: 0,
      fonts: 0,
      other: 0,
    },
    warnings: [],
    recommendations: [],
  };

  const mockComparison: Comparison = {
    target: 'main',
    targetCommit: 'def4567890',
    currentCommit: 'abc1234567',
    changes: {
      totalSize: {
        current: 230500,
        previous: 245500,
        diff: -15000,
        diffPercent: -6.11,
      },
      totalGzipSize: {
        current: 85000,
        previous: 89000,
        diff: -4000,
        diffPercent: -4.49,
      },
      totalBrotliSize: {
        current: 76000,
        previous: 80000,
        diff: -4000,
        diffPercent: -5.0,
      },
      buildDuration: {
        current: 3240,
        previous: 3100,
        diff: 140,
        diffPercent: 4.52,
      },
      byBundle: [
        {
          name: 'assets/index.js',
          current: 185300,
          previous: 195300,
          diff: -10000,
          diffPercent: -5.12,
          status: 'changed',
        },
        {
          name: 'assets/style.css',
          current: 45200,
          previous: 50200,
          diff: -5000,
          diffPercent: -9.96,
          status: 'changed',
        },
      ],
    },
    summary: '📉 Bundle is 14.65 KB (6.1%) smaller than main',
    recommendations: [
      '✅ Great job! Bundle size reduced by 6.1%',
    ],
  };

  describe('generateBadge', () => {
    it('should generate badge markdown with correct sizes', () => {
      const badge = generateBadge(mockMetrics);

      expect(badge).toContain('bundle-225KB');
      expect(badge).toContain('gzipped-83KB');
      expect(badge).toContain('img.shields.io');
    });

    it('should use green color for small bundles', () => {
      const smallMetrics = { ...mockMetrics, totalSize: 50 * 1024 }; // 50 KB
      const badge = generateBadge(smallMetrics);

      expect(badge).toContain('brightgreen');
    });

    it('should use red color for large bundles', () => {
      const largeMetrics = { ...mockMetrics, totalSize: 1500 * 1024 }; // 1.5 MB
      const badge = generateBadge(largeMetrics);

      expect(badge).toContain('red');
    });
  });

  describe('generateReadmeSection', () => {
    it('should generate complete README section', () => {
      const markdown = generateReadmeSection(mockMetrics);

      expect(markdown).toContain('## 📊 Bundle Watch');
      expect(markdown).toContain('**Latest Build:**');
      expect(markdown).toContain('abc1234');
      expect(markdown).toContain('main');
    });

    it('should include metrics table', () => {
      const markdown = generateReadmeSection(mockMetrics);

      expect(markdown).toContain('| Metric | Size | Gzipped | Brotli |');
      expect(markdown).toContain('| **Total** |');
      expect(markdown).toContain('| JavaScript |');
      expect(markdown).toContain('| CSS |');
    });

    it('should include comparison when provided', () => {
      const markdown = generateReadmeSection(mockMetrics, mockComparison);

      expect(markdown).toContain('### 📈 Comparison vs main');
      expect(markdown).toContain('smaller than main');
      expect(markdown).toContain('### 💡 Insights');
    });

    it('should format sizes correctly', () => {
      const markdown = generateReadmeSection(mockMetrics);

      expect(markdown).toContain('225.1 KB'); // Total size
      expect(markdown).toContain('83.01 KB'); // Gzip size
    });
  });

  describe('generatePRComment', () => {
    it('should generate PR comment with summary', () => {
      const comment = generatePRComment(mockMetrics, mockComparison);

      expect(comment).toContain('## 🤖 Bundle Watch Report');
      expect(comment).toContain('smaller than main');
    });

    it('should include comparison table', () => {
      const comment = generatePRComment(mockMetrics, mockComparison);

      expect(comment).toContain('| Metric | Current | Previous | Change |');
      expect(comment).toContain('| Total Size |');
      expect(comment).toContain('| Gzip Size |');
      expect(comment).toContain('| Build Time |');
    });

    it('should use correct emoji for changes', () => {
      const comment = generatePRComment(mockMetrics, mockComparison);

      expect(comment).toContain('🔽'); // Size decreased
    });

    it('should include bundle changes', () => {
      const comment = generatePRComment(mockMetrics, mockComparison);

      expect(comment).toContain('### 📦 Bundle Changes');
      expect(comment).toContain('assets/index.js');
      expect(comment).toContain('assets/style.css');
    });

    it('should include insights', () => {
      const comment = generatePRComment(mockMetrics, mockComparison);

      expect(comment).toContain('### 💡 Insights');
      expect(comment).toContain('Great job');
    });
  });

  describe('generateConsoleOutput', () => {
    it('should generate formatted console output', () => {
      const output = generateConsoleOutput(mockMetrics);

      expect(output).toContain('📊 Bundle Watch Report');
      expect(output).toContain('═'.repeat(50));
      expect(output).toContain('Total Size:');
      expect(output).toContain('Gzipped:');
      expect(output).toContain('Build Time:');
    });

    it('should include asset breakdown', () => {
      const output = generateConsoleOutput(mockMetrics);

      expect(output).toContain('By Type:');
      expect(output).toContain('JavaScript:');
      expect(output).toContain('CSS:');
      expect(output).toContain('Images:');
    });

    it('should include comparison when provided', () => {
      const output = generateConsoleOutput(mockMetrics, mockComparison);

      expect(output).toContain('Comparison vs main:');
      expect(output).toContain('smaller than main');
    });

    it('should display warnings if present', () => {
      const metricsWithWarnings = {
        ...mockMetrics,
        warnings: ['Large bundle detected'],
      };
      const output = generateConsoleOutput(metricsWithWarnings);

      expect(output).toContain('⚠️  Warnings:');
      expect(output).toContain('Large bundle detected');
    });

    it('should display recommendations if present', () => {
      const metricsWithRecs = {
        ...mockMetrics,
        recommendations: ['Consider code splitting'],
      };
      const output = generateConsoleOutput(metricsWithRecs);

      expect(output).toContain('💡 Recommendations:');
      expect(output).toContain('Consider code splitting');
    });

    it('should format build duration correctly', () => {
      const output = generateConsoleOutput(mockMetrics);

      expect(output).toContain('3.24s'); // 3240ms = 3.24s
    });

    it('should format short build duration in ms', () => {
      const quickMetrics = { ...mockMetrics, buildDuration: 850 };
      const output = generateConsoleOutput(quickMetrics);

      expect(output).toContain('850ms');
    });

    it('should display dependencies when present', () => {
      const metricsWithDeps = {
        ...mockMetrics,
        dependencies: [
          { name: 'react', size: 50000, modules: 10 },
          { name: 'lodash', size: 30000, modules: 5 },
          { name: 'axios', size: 20000, modules: 3 },
        ],
      };
      const output = generateConsoleOutput(metricsWithDeps);

      expect(output).toContain('📦 Dependencies:');
      expect(output).toContain('react');
      expect(output).toContain('lodash');
    });

    it('should show "and X more" when > 5 dependencies', () => {
      const metricsWithManyDeps = {
        ...mockMetrics,
        dependencies: [
          { name: 'dep1', size: 10000, modules: 1 },
          { name: 'dep2', size: 10000, modules: 1 },
          { name: 'dep3', size: 10000, modules: 1 },
          { name: 'dep4', size: 10000, modules: 1 },
          { name: 'dep5', size: 10000, modules: 1 },
          { name: 'dep6', size: 10000, modules: 1 },
          { name: 'dep7', size: 10000, modules: 1 },
        ],
      };
      const output = generateConsoleOutput(metricsWithManyDeps);

      expect(output).toContain('... and 2 more');
    });

    it('should handle zero-size bundles', () => {
      const emptyMetrics = {
        ...mockMetrics,
        totalSize: 0,
        byType: {
          javascript: 0,
          css: 0,
          images: 0,
          fonts: 0,
          other: 0,
        },
      };
      const output = generateConsoleOutput(emptyMetrics);

      expect(output).toContain('0 B');
    });
  });

  describe('edge cases and branch coverage', () => {
    it('should handle bundle status: added', () => {
      const comparisonWithAdded: Comparison = {
        ...mockComparison,
        changes: {
          ...mockComparison.changes,
          byBundle: [
            {
              name: 'new-bundle.js',
              current: 50000,
              previous: 0,
              diff: 50000,
              diffPercent: 100,
              status: 'added',
            },
          ],
        },
      };
      const comment = generatePRComment(mockMetrics, comparisonWithAdded);

      expect(comment).toContain('🆕 Added');
      expect(comment).toContain('➕');
      expect(comment).toContain('(new)');
    });

    it('should handle bundle status: removed', () => {
      const comparisonWithRemoved: Comparison = {
        ...mockComparison,
        changes: {
          ...mockComparison.changes,
          byBundle: [
            {
              name: 'old-bundle.js',
              current: 0,
              previous: 50000,
              diff: -50000,
              diffPercent: -100,
              status: 'removed',
            },
          ],
        },
      };
      const comment = generatePRComment(mockMetrics, comparisonWithRemoved);

      expect(comment).toContain('🗑️ Removed');
      expect(comment).toContain('➖');
      expect(comment).toContain('(removed)');
    });

    it('should filter out unchanged bundles from PR comment', () => {
      const comparisonWithUnchanged: Comparison = {
        ...mockComparison,
        changes: {
          ...mockComparison.changes,
          byBundle: [
            {
              name: 'stable.js',
              current: 10000,
              previous: 10000,
              diff: 0,
              diffPercent: 0,
              status: 'unchanged',
            },
          ],
        },
      };
      const comment = generatePRComment(mockMetrics, comparisonWithUnchanged);

      // Unchanged bundles should be filtered out from significant changes
      expect(comment).not.toContain('stable.js');
      expect(comment).not.toContain('✓ Unchanged');
    });

    it('should filter out minimal changes (< 1%) from PR comment', () => {
      const comparisonWithMinimal: Comparison = {
        ...mockComparison,
        changes: {
          ...mockComparison.changes,
          byBundle: [
            {
              name: 'minimal.js',
              current: 100100,
              previous: 100000,
              diff: 100,
              diffPercent: 0.1,
              status: 'changed',
            },
          ],
        },
      };
      const comment = generatePRComment(mockMetrics, comparisonWithMinimal);

      // Minimal changes should be filtered out from significant changes
      expect(comment).not.toContain('minimal.js');
    });

    it('should use 🔼 emoji for size increases', () => {
      const comparisonWithIncrease: Comparison = {
        ...mockComparison,
        changes: {
          ...mockComparison.changes,
          byBundle: [
            {
              name: 'bigger.js',
              current: 200000,
              previous: 100000,
              diff: 100000,
              diffPercent: 100,
              status: 'changed',
            },
          ],
        },
      };
      const comment = generatePRComment(mockMetrics, comparisonWithIncrease);

      expect(comment).toContain('🔼');
    });

    it('should handle different badge colors', () => {
      const tinyMetrics = { ...mockMetrics, totalSize: 50 * 1024 }; // 50 KB
      const smallMetrics = { ...mockMetrics, totalSize: 150 * 1024 }; // 150 KB
      const mediumMetrics = { ...mockMetrics, totalSize: 350 * 1024 }; // 350 KB
      const largeMetrics = { ...mockMetrics, totalSize: 750 * 1024 }; // 750 KB
      const hugeMetrics = { ...mockMetrics, totalSize: 1500 * 1024 }; // 1.5 MB

      expect(generateBadge(tinyMetrics)).toContain('brightgreen');
      expect(generateBadge(smallMetrics)).toContain('green');
      expect(generateBadge(mediumMetrics)).toContain('yellow');
      expect(generateBadge(largeMetrics)).toContain('orange');
      expect(generateBadge(hugeMetrics)).toContain('red');
    });

    it('should filter out unchanged bundles in README', () => {
      const comparisonWithUnchanged: Comparison = {
        ...mockComparison,
        changes: {
          ...mockComparison.changes,
          byBundle: [
            {
              name: 'unchanged.js',
              current: 10000,
              previous: 10000,
              diff: 0,
              diffPercent: 0,
              status: 'unchanged',
            },
            {
              name: 'changed.js',
              current: 20000,
              previous: 15000,
              diff: 5000,
              diffPercent: 33.33,
              status: 'changed',
            },
          ],
        },
      };
      const readme = generateReadmeSection(mockMetrics, comparisonWithUnchanged);

      expect(readme).toContain('changed.js');
      expect(readme).not.toContain('unchanged.js');
    });

    it('should handle zero change with ➡️ emoji in PR comment', () => {
      const comparisonWithZero: Comparison = {
        ...mockComparison,
        changes: {
          ...mockComparison.changes,
          totalSize: {
            current: 100000,
            previous: 100000,
            diff: 0,
            diffPercent: 0,
          },
        },
      };
      const comment = generatePRComment(mockMetrics, comparisonWithZero);

      expect(comment).toContain('➡️');
    });

    it('should show ➡️ emoji for minimal changes in README', () => {
      const comparisonWithMinimal: Comparison = {
        ...mockComparison,
        changes: {
          ...mockComparison.changes,
          byBundle: [
            {
              name: 'minimal.js',
              current: 100100,
              previous: 100000,
              diff: 100,
              diffPercent: 0.1,
              status: 'changed',
            },
          ],
        },
      };
      const readme = generateReadmeSection(mockMetrics, comparisonWithMinimal);

      // README shows minimal changes with ➡️ emoji
      expect(readme).toContain('minimal.js');
      expect(readme).toContain('➡️');
    });
  });
});

