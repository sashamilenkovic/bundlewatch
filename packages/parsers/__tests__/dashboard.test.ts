/**
 * Tests for dashboard generation
 */

import { describe, it, expect } from 'vitest';
import { generateTreemapData, generateDependencyData } from '../src/dashboard';
import type { BuildMetrics } from '@milencode/bundlewatch-core';

describe('Dashboard', () => {
  const mockMetrics: BuildMetrics = {
    timestamp: new Date().toISOString(),
    commit: 'abc123',
    branch: 'main',
    buildDuration: 1000,
    totalSize: 500000,
    totalGzipSize: 150000,
    totalBrotliSize: 127500,
    chunkCount: 3,
    byType: {
      javascript: 450000,
      css: 50000,
      images: 0,
      fonts: 0,
      other: 0,
    },
    bundles: [
      {
        name: 'static/chunks/framework-abc123.js',
        size: 200000,
        gzipSize: 60000,
        brotliSize: 51000,
        type: 'js',
        path: 'static/chunks/framework-abc123.js',
      },
      {
        name: 'static/chunks/main-def456.js',
        size: 150000,
        gzipSize: 45000,
        brotliSize: 38250,
        type: 'js',
        path: 'static/chunks/main-def456.js',
      },
      {
        name: 'static/css/styles-ghi789.css',
        size: 50000,
        gzipSize: 15000,
        brotliSize: 12750,
        type: 'css',
        path: 'static/css/styles-ghi789.css',
      },
    ],
    detailedDependencies: [
      {
        name: 'react',
        totalSize: 100000,
        gzipSize: 30000,
        moduleCount: 5,
        chunks: ['framework-abc123.js'],
        treeshakeable: true,
        duplicate: false,
      },
      {
        name: 'lodash',
        totalSize: 80000,
        gzipSize: 24000,
        moduleCount: 10,
        chunks: ['main-def456.js'],
        treeshakeable: false,
        duplicate: false,
      },
    ],
    warnings: [],
    recommendations: [],
  };

  describe('generateTreemapData', () => {
    it('should return output chunks (bundles), not module aggregations', () => {
      const result = generateTreemapData(mockMetrics);

      expect(result.name).toBe('Output Chunks');
      expect(result.children).toHaveLength(3);

      // Should show actual chunk filenames
      expect(result.children[0].name).toBe('framework-abc123.js');
      expect(result.children[1].name).toBe('main-def456.js');
      expect(result.children[2].name).toBe('styles-ghi789.css');
    });

    it('should include gzip and brotli sizes for each chunk', () => {
      const result = generateTreemapData(mockMetrics);

      const framework = result.children[0];
      expect(framework.value).toBe(200000);
      expect(framework.gzip).toBe(60000);
      expect(framework.brotli).toBe(51000);
      expect(framework.type).toBe('js');
    });

    it('should extract just the filename from full path', () => {
      const result = generateTreemapData(mockMetrics);

      // Should be "framework-abc123.js" not "static/chunks/framework-abc123.js"
      expect(result.children[0].name).not.toContain('/');
    });
  });

  describe('generateDependencyData', () => {
    it('should return dependency breakdown when available', () => {
      const result = generateDependencyData(mockMetrics);

      expect(result).not.toBeNull();
      expect(result!.name).toBe('Dependencies');
      expect(result!.children).toHaveLength(2);

      expect(result!.children[0].name).toBe('react');
      expect(result!.children[0].value).toBe(100000);
      expect(result!.children[0].gzip).toBe(30000);
    });

    it('should return null when no dependencies available', () => {
      const metricsWithoutDeps: BuildMetrics = {
        ...mockMetrics,
        detailedDependencies: undefined,
      };

      const result = generateDependencyData(metricsWithoutDeps);
      expect(result).toBeNull();
    });

    it('should categorize app code vs npm packages', () => {
      const metricsWithAppCode: BuildMetrics = {
        ...mockMetrics,
        detailedDependencies: [
          {
            name: 'src/components',
            totalSize: 50000,
            gzipSize: 15000,
            moduleCount: 3,
            chunks: ['main.js'],
            treeshakeable: true,
            duplicate: false,
          },
          {
            name: 'react',
            totalSize: 100000,
            gzipSize: 30000,
            moduleCount: 5,
            chunks: ['framework.js'],
            treeshakeable: true,
            duplicate: false,
          },
        ],
      };

      const result = generateDependencyData(metricsWithAppCode);

      expect(result!.children[0].type).toBe('app'); // src/components
      expect(result!.children[1].type).toBe('npm'); // react
    });
  });
});
