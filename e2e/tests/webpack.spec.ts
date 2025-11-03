import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const WEBPACK_APP_DIR = join(process.cwd(), '../examples/webpack-app');

test.describe('Webpack Plugin', () => {
  test.beforeAll(async () => {
    // Clean build
    try {
      await execAsync('rm -rf dist', { cwd: WEBPACK_APP_DIR });
    } catch (e) {
      // Ignore if dist doesn't exist
    }
  });

  test('should build Webpack app successfully', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: WEBPACK_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check build succeeded
    expect(stdout).toContain('asset main');
    
    // Check that bundle watch ran
    expect(stdout).toContain('Bundle Watch');
  });

  test('should generate dist directory', async () => {
    const distPath = join(WEBPACK_APP_DIR, 'dist');
    
    // Check dist directory exists
    await expect(access(distPath)).resolves.not.toThrow();
  });

  test('should collect metrics during Webpack build', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: WEBPACK_APP_DIR,
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
      cwd: WEBPACK_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for asset type breakdown
    expect(stdout).toContain('JavaScript');
  });

  test('should have correct Brotli compression', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: WEBPACK_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Extract sizes to verify Brotli < Gzip
    const gzipMatch = stdout.match(/Gzipped:\s+([\d.]+)\s+KB/);
    const brotliMatch = stdout.match(/Brotli:\s+([\d.]+)\s+KB/);
    
    if (gzipMatch && brotliMatch) {
      const gzipSize = parseFloat(gzipMatch[1]);
      const brotliSize = parseFloat(brotliMatch[1]);
      
      // Brotli should be smaller than Gzip
      expect(brotliSize).toBeLessThan(gzipSize);
    }
  });

  test('should show webpack output info', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: WEBPACK_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for webpack's own output
    expect(stdout).toContain('asset');
    expect(stdout).toContain('webpack');
    expect(stdout).toContain('compiled successfully');
  });
});

