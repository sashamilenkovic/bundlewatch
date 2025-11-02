/**
 * Tests for dependency analysis
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { analyzeDependencies, generateDependencyInsights } from './dependencies';
import type { Bundle } from './types';

describe('analyzeDependencies', () => {
  const testDir = join(process.cwd(), 'test-deps');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should return empty array when no package.json exists', async () => {
    const bundles: Bundle[] = [
      { name: 'app.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js' },
    ];

    const deps = await analyzeDependencies(bundles, testDir);
    expect(deps).toEqual([]);
  });

  it('should detect dependencies in bundle content', async () => {
    // Create package.json
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          lodash: '^4.17.21',
        },
      })
    );

    // Create a bundle that contains react
    const bundleContent = `
      import React from 'react';
      // ... some code from node_modules/react/index.js
      React.createElement('div');
    `;
    await writeFile(join(testDir, 'app.js'), bundleContent);

    const bundles: Bundle[] = [
      { name: 'app.js', size: 1000, gzipSize: 500, brotliSize: 400, type: 'js', path: 'app.js' },
    ];

    const deps = await analyzeDependencies(bundles, testDir);
    
    expect(deps.length).toBeGreaterThan(0);
    const reactDep = deps.find(d => d.name === 'react');
    expect(reactDep).toBeDefined();
    expect(reactDep?.version).toBe('^18.0.0');
  });

  it('should skip non-JS bundles', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({ dependencies: { react: '^18.0.0' } })
    );

    const bundles: Bundle[] = [
      { name: 'style.css', size: 1000, gzipSize: 500, brotliSize: 400, type: 'css' },
    ];

    const deps = await analyzeDependencies(bundles, testDir);
    expect(deps).toEqual([]);
  });

  it('should sort dependencies by size', async () => {
    await writeFile(
      join(testDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          small: '^1.0.0',
          large: '^2.0.0',
        },
      })
    );

    // Create bundle with both deps, but 'large' appears more
    const bundleContent = `
      import large from 'large';
      large.method1(); large.method2(); large.method3();
      import small from 'small';
      small.method();
    `;
    await writeFile(join(testDir, 'app.js'), bundleContent);

    const bundles: Bundle[] = [
      { name: 'app.js', size: 10000, gzipSize: 5000, brotliSize: 4000, type: 'js', path: 'app.js' },
    ];

    const deps = await analyzeDependencies(bundles, testDir);
    
    if (deps.length >= 2) {
      expect(deps[0].size).toBeGreaterThanOrEqual(deps[1].size);
    }
  });
});

describe('generateDependencyInsights', () => {
  it('should identify largest dependency', () => {
    const deps = [
      { name: 'huge-lib', size: 500000, version: '1.0.0' },
      { name: 'small-lib', size: 10000, version: '1.0.0' },
    ];

    const insights = generateDependencyInsights(deps, 1000000);
    
    expect(insights.some(i => i.includes('huge-lib'))).toBe(true);
    expect(insights.some(i => i.includes('largest dependency'))).toBe(true);
  });

  it('should recommend alternatives for moment', () => {
    const deps = [
      { name: 'moment', size: 200000, version: '2.29.0' },
    ];

    const insights = generateDependencyInsights(deps, 500000);
    
    expect(insights.some(i => i.includes('date-fns') || i.includes('dayjs'))).toBe(true);
  });

  it('should recommend alternatives for lodash', () => {
    const deps = [
      { name: 'lodash', size: 150000, version: '4.17.21' },
    ];

    const insights = generateDependencyInsights(deps, 500000);
    
    expect(insights.some(i => i.includes('lodash-es'))).toBe(true);
  });

  it('should warn about duplicate date libraries', () => {
    const deps = [
      { name: 'moment', size: 200000, version: '2.29.0' },
      { name: 'date-fns', size: 50000, version: '2.30.0' },
    ];

    const insights = generateDependencyInsights(deps, 500000);
    
    expect(insights.some(i => i.includes('Both moment and date-fns'))).toBe(true);
  });

  it('should warn about many dependencies', () => {
    const deps = Array.from({ length: 25 }, (_, i) => ({
      name: `dep-${i}`,
      size: 10000,
      version: '1.0.0',
    }));

    const insights = generateDependencyInsights(deps, 500000);
    
    expect(insights.some(i => i.includes('25 dependencies'))).toBe(true);
  });

  it('should return empty array for no dependencies', () => {
    const insights = generateDependencyInsights([], 500000);
    expect(insights).toEqual([]);
  });
});

