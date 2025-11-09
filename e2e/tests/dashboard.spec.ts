import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const ROOT_DIR = join(process.cwd(), '..');
const VITE_APP_DIR = join(ROOT_DIR, 'examples/vite-app');

test.describe('Dashboard Generation', () => {
  const reportDir = join(VITE_APP_DIR, 'bundle-report');

  test.beforeAll(async () => {
    // Build the vite app which generates the dashboard
    await execAsync('pnpm build', { cwd: VITE_APP_DIR });
  });

  test('should generate dashboard HTML', async () => {
    // Dashboard is generated during build by the plugin
    const indexPath = join(reportDir, 'index.html');
    await expect(access(indexPath)).resolves.not.toThrow();
  });

  test('dashboard HTML should contain embedded data', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Dashboard embeds data inline, not as separate file
    expect(html).toContain('const data =');
  });

  test('dashboard HTML should be self-contained', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Should contain embedded styles
    expect(html).toContain('<style>');

    // Should contain embedded script
    expect(html).toContain('<script>');
  });

  test('dashboard should contain bundle visualization', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Check for key dashboard sections
    expect(html).toContain('Bundle Watch Dashboard');
    expect(html).toContain('treemap');
  });

  test('dashboard should contain metrics', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Check for stat cards that display metrics
    expect(html).toContain('stat-card');
    expect(html).toContain('stat-label');
    expect(html).toContain('stat-value');
  });

  test('dashboard should include D3.js', async () => {
    const indexPath = join(reportDir, 'index.html');
    const html = await readFile(indexPath, 'utf-8');

    // Should reference D3.js for treemap visualization
    expect(html).toContain('d3.v7');
  });
});


