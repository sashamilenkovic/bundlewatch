import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const ROOT_DIR = join(process.cwd(), '..');
const VITE_APP_DIR = join(ROOT_DIR, 'examples/vite-app');

test.describe('Dashboard Generation', () => {
  const reportDir = join(ROOT_DIR, 'test-bundle-report');

  test.beforeAll(async () => {
    // Build the vite app first
    await execAsync('pnpm build', { cwd: VITE_APP_DIR });
  });

  test.afterAll(async () => {
    // Clean up
    try {
      await execAsync(`rm -rf ${reportDir}`);
    } catch (e) {
      // Ignore
    }
  });

  test('should generate dashboard HTML', async () => {
    await execAsync(
      `node packages/cli/dist/cli.js export examples/vite-app/dist --output ${reportDir}`,
      { cwd: ROOT_DIR }
    );

    // Check index.html was created
    const indexPath = join(reportDir, 'index.html');
    await expect(access(indexPath)).resolves.not.toThrow();
  });

  test('should generate data.json', async () => {
    const dataPath = join(reportDir, 'data.json');
    await expect(access(dataPath)).resolves.not.toThrow();

    // Validate JSON structure
    const data = JSON.parse(await readFile(dataPath, 'utf-8'));
    expect(data).toHaveProperty('current');
    expect(data.current).toHaveProperty('totalSize');
    expect(data.current).toHaveProperty('bundles');
  });

  test('dashboard HTML should be self-contained', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Should contain embedded styles
    expect(html).toContain('<style>');
    
    // Should contain embedded script
    expect(html).toContain('<script>');
    
    // Should contain data
    expect(html).toContain('window.DASHBOARD_DATA');
  });

  test('dashboard should contain all views', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Check for navigation tabs
    expect(html).toContain('overview');
    expect(html).toContain('treemap');
    expect(html).toContain('dependencies');
    expect(html).toContain('history');
    expect(html).toContain('compare');
  });

  test('dashboard should contain metrics', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Check for metric labels
    expect(html).toContain('Total Size');
    expect(html).toContain('Gzipped');
    expect(html).toContain('Brotli');
    expect(html).toContain('Build Time');
  });

  test('dashboard should include Chart.js', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Should reference Chart.js
    expect(html).toContain('chart.js');
  });
});

test.describe('Dashboard Server', () => {
  test('should start server (manual test)', async () => {
    // This is a manual test - just verify the command exists
    const { stdout } = await execAsync(
      'node packages/cli/dist/cli.js --help',
      { cwd: join(process.cwd(), '..') }
    );

    expect(stdout).toContain('serve');
  });
});

