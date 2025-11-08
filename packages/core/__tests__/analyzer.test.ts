/**
 * Tests for analyzer functions
 */

import { describe, it, expect } from 'vitest';
import { compareMetrics } from '../src/analyzer';
import type { BuildMetrics } from '../src/types';

describe('compareMetrics', () => {
  const createMockMetrics = (overrides: Partial<BuildMetrics> = {}): BuildMetrics => ({
    timestamp: new Date().toISOString(),
    commit: 'abc123',
    branch: 'main',
    buildDuration: 1000,
    bundles: [
      {
        name: 'index.js',
        size: 1000,
        gzipSize: 500,
        brotliSize: 400,
        type: 'js',
      },
    ],
    totalSize: 1000,
    totalGzipSize: 500,
    totalBrotliSize: 400,
    chunkCount: 1,
    byType: {
      javascript: 1000,
      css: 0,
      images: 0,
      fonts: 0,
      other: 0,
    },
    warnings: [],
    recommendations: [],
    ...overrides,
  });

  it('should compare two identical builds', () => {
    const current = createMockMetrics();
    const baseline = createMockMetrics();

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.target).toBe('main');
    expect(comparison.changes.totalSize.diff).toBe(0);
    expect(comparison.changes.totalSize.diffPercent).toBe(0);
    expect(comparison.summary).toContain('unchanged');
  });

  it('should detect size increase', () => {
    const baseline = createMockMetrics({ totalSize: 1000, totalGzipSize: 500 });
    const current = createMockMetrics({ totalSize: 1500, totalGzipSize: 700 });

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.changes.totalSize.diff).toBe(500);
    expect(comparison.changes.totalSize.diffPercent).toBe(50);
    expect(comparison.summary).toContain('larger');
    expect(comparison.summary).toContain('📈');
  });

  it('should detect size decrease', () => {
    const baseline = createMockMetrics({ totalSize: 1000, totalGzipSize: 500 });
    const current = createMockMetrics({ totalSize: 800, totalGzipSize: 400 });

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.changes.totalSize.diff).toBe(-200);
    expect(comparison.changes.totalSize.diffPercent).toBe(-20);
    expect(comparison.summary).toContain('smaller');
    expect(comparison.summary).toContain('📉');
  });

  it('should detect added bundles', () => {
    const baseline = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
      ],
    });
    const current = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
        { name: 'new.js', size: 500, gzipSize: 250, brotliSize: 200, type: 'js' },
      ],
      totalSize: 1500,
    });

    const comparison = compareMetrics(current, baseline, 'main');

    const addedBundle = comparison.changes.byBundle.find(b => b.name === 'new.js');
    expect(addedBundle?.status).toBe('added');
    expect(addedBundle?.diff).toBe(500);
    expect(addedBundle?.diffPercent).toBe(100);
  });

  it('should detect removed bundles', () => {
    const baseline = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
        { name: 'old.js', size: 500, gzipSize: 250, brotliSize: 200, type: 'js' },
      ],
      totalSize: 1500,
    });
    const current = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
      ],
      totalSize: 1000,
    });

    const comparison = compareMetrics(current, baseline, 'main');

    const removedBundle = comparison.changes.byBundle.find(b => b.name === 'old.js');
    expect(removedBundle?.status).toBe('removed');
    expect(removedBundle?.diff).toBe(-500);
    expect(removedBundle?.diffPercent).toBe(-100);
  });

  it('should detect changed bundles', () => {
    const baseline = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
      ],
    });
    const current = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1200, gzipSize: 600, brotliSize: 480, type: 'js' },
      ],
      totalSize: 1200,
    });

    const comparison = compareMetrics(current, baseline, 'main');

    const changedBundle = comparison.changes.byBundle.find(b => b.name === 'index.js');
    expect(changedBundle?.status).toBe('changed');
    expect(changedBundle?.diff).toBe(200);
    expect(changedBundle?.diffPercent).toBe(20);
  });

  it('should mark bundles as unchanged when difference is tiny', () => {
    const baseline = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
      ],
    });
    const current = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
      ],
    });

    const comparison = compareMetrics(current, baseline, 'main');

    const unchangedBundle = comparison.changes.byBundle.find(b => b.name === 'index.js');
    expect(unchangedBundle?.status).toBe('unchanged');
  });

  it('should sort bundles by largest change first', () => {
    const baseline = createMockMetrics({
      bundles: [
        { name: 'small.js', size: 100, gzipSize: 50, brotliSize: 40, type: 'js' },
        { name: 'large.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
      ],
      totalSize: 1100,
    });
    const current = createMockMetrics({
      bundles: [
        { name: 'small.js', size: 110, gzipSize: 55, brotliSize: 44, type: 'js' },
        { name: 'large.js', size: 1500, gzipSize: 750, brotliSize: 600, type: 'js' },
      ],
      totalSize: 1610,
    });

    const comparison = compareMetrics(current, baseline, 'main');

    // Large bundle changed by 500, small by 10
    expect(Math.abs(comparison.changes.byBundle[0].diff)).toBeGreaterThan(
      Math.abs(comparison.changes.byBundle[1].diff)
    );
  });

  it('should generate insight for large size increase', () => {
    const baseline = createMockMetrics({ totalSize: 1000 });
    const current = createMockMetrics({ totalSize: 1200 }); // 20% increase

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.recommendations.some(r => r.includes('increased'))).toBe(true);
  });

  it('should generate positive insight for size decrease', () => {
    const baseline = createMockMetrics({ totalSize: 1000 });
    const current = createMockMetrics({ totalSize: 800 }); // 20% decrease

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.recommendations.some(r => r.includes('Great job'))).toBe(true);
  });

  it('should report new bundles in insights', () => {
    const baseline = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
      ],
    });
    const current = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
        { name: 'new1.js', size: 500, gzipSize: 250, brotliSize: 200, type: 'js' },
        { name: 'new2.js', size: 300, gzipSize: 150, brotliSize: 120, type: 'js' },
      ],
      totalSize: 1800,
    });

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.recommendations.some(r => r.includes('2 new bundle'))).toBe(true);
  });

  it('should report removed bundles in insights', () => {
    const baseline = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
        { name: 'old.js', size: 500, gzipSize: 250, brotliSize: 200, type: 'js' },
      ],
      totalSize: 1500,
    });
    const current = createMockMetrics({
      bundles: [
        { name: 'index.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
      ],
      totalSize: 1000,
    });

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.recommendations.some(r => r.includes('removed'))).toBe(true);
  });

  it('should handle zero previous size gracefully', () => {
    const baseline = createMockMetrics({ totalSize: 0 });
    const current = createMockMetrics({ totalSize: 1000 });

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.changes.totalSize.diffPercent).toBe(0);
    expect(comparison.changes.totalSize.diff).toBe(1000);
  });

  it('should include target commit information', () => {
    const baseline = createMockMetrics({ commit: 'baseline123' });
    const current = createMockMetrics({ commit: 'current456' });

    const comparison = compareMetrics(current, baseline, 'main');

    expect(comparison.targetCommit).toBe('baseline123');
    expect(comparison.currentCommit).toBe('current456');
  });
});

