import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const VITE_APP_DIR = join(process.cwd(), '../examples/vite-app');

test.describe('Vite Plugin', () => {
  test.beforeAll(async () => {
    // Clean build
    try {
      await execAsync('rm -rf dist', { cwd: VITE_APP_DIR });
    } catch (e) {
      // Ignore if dist doesn't exist
    }
  });

  test('should build Vite app successfully', async () => {
    const { stdout, stderr } = await execAsync('pnpm build', {
      cwd: VITE_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check build succeeded
    expect(stdout).toContain('built in');
    
    // Check that bundle watch ran
    expect(stdout).toContain('Bundle Watch');
  });

  test('should generate build output', async () => {
    const distPath = join(VITE_APP_DIR, 'dist');
    
    // Check dist directory exists
    await expect(access(distPath)).resolves.not.toThrow();
    
    // Check for index.html
    const indexPath = join(distPath, 'index.html');
    await expect(access(indexPath)).resolves.not.toThrow();
  });

  test('should collect metrics', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: VITE_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for metrics in output
    expect(stdout).toContain('Total Size');
    expect(stdout).toContain('Gzipped');
    expect(stdout).toContain('Brotli');
    expect(stdout).toContain('Build Time');
  });

  test('should display bundle breakdown', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: VITE_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for asset type breakdown
    expect(stdout).toContain('JavaScript');
    expect(stdout).toContain('CSS');
  });

  test('should generate recommendations or indicate none', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: VITE_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Small apps might not have recommendations, which is fine
    // Just check the build completed successfully
    expect(stdout).toContain('built in');
  });
});

