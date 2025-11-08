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
  });
});

