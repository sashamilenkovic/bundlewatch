/**
 * Tests for collector functions
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { collectMetrics } from '../src/collector';

describe('collectMetrics', () => {
  const testDir = join(process.cwd(), 'test-output');

  beforeEach(async () => {
    // Create test directory structure
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'assets'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  it('should collect metrics from empty directory', async () => {
    const metrics = await collectMetrics({
      outputDir: testDir,
      branch: 'main',
      commit: 'abc123',
      buildStartTime: Date.now() - 100,
    });

    expect(metrics).toBeDefined();
    expect(metrics.branch).toBe('main');
    expect(metrics.commit).toBe('abc123');
    expect(metrics.totalSize).toBe(0);
    expect(metrics.bundles).toHaveLength(0);
    expect(metrics.chunkCount).toBe(0);
  });

  it('should collect metrics from directory with files', async () => {
    // Create test files (make them larger so gzip is effective)
    await writeFile(join(testDir, 'index.html'), '<html><body>Hello World! '.repeat(50) + '</body></html>');
    await writeFile(join(testDir, 'assets', 'main.js'), 'console.log("hello world");'.repeat(50));
    await writeFile(join(testDir, 'assets', 'style.css'), 'body { margin: 0; padding: 0; }'.repeat(50));

    const metrics = await collectMetrics({
      outputDir: testDir,
      branch: 'test',
      commit: 'def456',
      buildStartTime: Date.now() - 50,
    });

    expect(metrics.bundles).toHaveLength(3);
    expect(metrics.totalSize).toBeGreaterThan(0);
    expect(metrics.totalGzipSize).toBeGreaterThan(0);
    // Gzip should be smaller for repeated content
    expect(metrics.totalGzipSize).toBeLessThan(metrics.totalSize);
    expect(metrics.chunkCount).toBe(3);
    
    // Check bundle types
    const jsBundle = metrics.bundles.find(b => b.name.includes('main.js'));
    expect(jsBundle?.type).toBe('js');
    
    const cssBundle = metrics.bundles.find(b => b.name.includes('style.css'));
    expect(cssBundle?.type).toBe('css');
    
    const htmlBundle = metrics.bundles.find(b => b.name.includes('index.html'));
    expect(htmlBundle?.type).toBe('html');
  });

  it('should calculate asset breakdown correctly', async () => {
    await writeFile(join(testDir, 'main.js'), 'a'.repeat(1000));
    await writeFile(join(testDir, 'style.css'), 'b'.repeat(500));
    await writeFile(join(testDir, 'image.png'), 'c'.repeat(2000));

    const metrics = await collectMetrics({
      outputDir: testDir,
    });

    expect(metrics.byType.javascript).toBe(1000);
    expect(metrics.byType.css).toBe(500);
    expect(metrics.byType.images).toBe(2000);
  });

  it('should generate warnings for large bundles', async () => {
    // Create large JS file (> 250 KB)
    await writeFile(join(testDir, 'large.js'), 'x'.repeat(300 * 1024));

    const metrics = await collectMetrics({
      outputDir: testDir,
    });

    expect(metrics.warnings.length).toBeGreaterThan(0);
    expect(metrics.warnings.some(w => w.includes('large.js'))).toBe(true);
  });

  it('should generate recommendations for large JavaScript', async () => {
    // Create large JS bundle (> 300 KB)
    await writeFile(join(testDir, 'bundle.js'), 'x'.repeat(350 * 1024));

    const metrics = await collectMetrics({
      outputDir: testDir,
    });

    expect(metrics.recommendations.length).toBeGreaterThan(0);
    expect(metrics.recommendations.some(r => r.includes('code splitting'))).toBe(true);
  });

  it('should skip .map files', async () => {
    await writeFile(join(testDir, 'main.js'), 'code');
    await writeFile(join(testDir, 'main.js.map'), 'sourcemap');

    const metrics = await collectMetrics({
      outputDir: testDir,
    });

    expect(metrics.bundles).toHaveLength(1);
    expect(metrics.bundles[0].name).toContain('main.js');
    expect(metrics.bundles[0].name).not.toContain('.map');
  });

  it('should skip hidden files', async () => {
    await writeFile(join(testDir, 'visible.js'), 'code');
    await writeFile(join(testDir, '.hidden'), 'hidden');

    const metrics = await collectMetrics({
      outputDir: testDir,
    });

    expect(metrics.bundles).toHaveLength(1);
    expect(metrics.bundles[0].name).toContain('visible.js');
  });

  it('should handle nested directories', async () => {
    await mkdir(join(testDir, 'assets', 'js'), { recursive: true });
    await mkdir(join(testDir, 'assets', 'css'), { recursive: true });
    
    await writeFile(join(testDir, 'assets', 'js', 'app.js'), 'code');
    await writeFile(join(testDir, 'assets', 'css', 'style.css'), 'styles');

    const metrics = await collectMetrics({
      outputDir: testDir,
    });

    expect(metrics.bundles).toHaveLength(2);
    expect(metrics.bundles.some(b => b.name.includes('assets/js/app.js'))).toBe(true);
    expect(metrics.bundles.some(b => b.name.includes('assets/css/style.css'))).toBe(true);
  });

  it('should calculate build duration', async () => {
    const startTime = Date.now();
    await writeFile(join(testDir, 'file.js'), 'code');

    const metrics = await collectMetrics({
      outputDir: testDir,
      buildStartTime: startTime - 100,
    });

    expect(metrics.buildDuration).toBeGreaterThanOrEqual(100);
  });

  it('should identify different file types', async () => {
    await writeFile(join(testDir, 'script.js'), 'js');
    await writeFile(join(testDir, 'module.mjs'), 'mjs');
    await writeFile(join(testDir, 'common.cjs'), 'cjs');
    await writeFile(join(testDir, 'style.css'), 'css');
    await writeFile(join(testDir, 'page.html'), 'html');
    await writeFile(join(testDir, 'image.png'), 'png');
    await writeFile(join(testDir, 'icon.svg'), 'svg');
    await writeFile(join(testDir, 'data.json'), 'json');

    const metrics = await collectMetrics({
      outputDir: testDir,
    });

    expect(metrics.bundles.find(b => b.name.includes('script.js'))?.type).toBe('js');
    expect(metrics.bundles.find(b => b.name.includes('module.mjs'))?.type).toBe('js');
    expect(metrics.bundles.find(b => b.name.includes('common.cjs'))?.type).toBe('js');
    expect(metrics.bundles.find(b => b.name.includes('style.css'))?.type).toBe('css');
    expect(metrics.bundles.find(b => b.name.includes('page.html'))?.type).toBe('html');
    expect(metrics.bundles.find(b => b.name.includes('image.png'))?.type).toBe('asset');
    expect(metrics.bundles.find(b => b.name.includes('icon.svg'))?.type).toBe('asset');
    expect(metrics.bundles.find(b => b.name.includes('data.json'))?.type).toBe('other');
  });

  it('should provide default values when git info not provided', async () => {
    await writeFile(join(testDir, 'file.js'), 'code');

    const metrics = await collectMetrics({
      outputDir: testDir,
    });

    expect(metrics.branch).toBe('unknown');
    expect(metrics.commit).toBe('unknown');
  });
});

