/**
 * Tests for dashboard generation
 */

import type { BuildMetrics } from '@milencode/bundlewatch-core';
import { describe, expect, it } from 'vitest';
import { generateDependencyData, generateTreemapData } from '../src/dashboard';

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
    it('should prefer dependencies when available for meaningful names', () => {
      const result = generateTreemapData(mockMetrics);

      // When detailedDependencies are available, use them for better visualization
      expect(result.name).toBe('Dependencies');
      expect(result.children).toHaveLength(2);

      // Should show package names
      expect(result.children[0].name).toBe('react');
      expect(result.children[1].name).toBe('lodash');
    });

    it('should include gzip and brotli sizes from dependencies', () => {
      const result = generateTreemapData(mockMetrics);

      const react = result.children[0];
      expect(react.value).toBe(100000);
      expect(react.gzip).toBe(30000);
      expect(react.brotli).toBe(0); // Not provided in mock
      expect(react.type).toBe('npm');
    });

    it('should fall back to output chunks when no dependencies available', () => {
      const metricsWithoutDeps: BuildMetrics = {
        ...mockMetrics,
        detailedDependencies: undefined,
      };

      const result = generateTreemapData(metricsWithoutDeps);

      expect(result.name).toBe('Output Chunks');
      expect(result.children).toHaveLength(3);
      // Should be "framework-abc123.js" not "static/chunks/framework-abc123.js"
      expect(result.children[0].name).toBe('framework-abc123.js');
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
