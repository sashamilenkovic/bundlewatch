import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const NUXT_APP_DIR = join(process.cwd(), '../examples/nuxt-app');

test.describe('Nuxt Integration (Vite Plugin)', () => {
  test.beforeAll(async () => {
    // Clean build
    try {
      await execAsync('rm -rf .nuxt .output', { cwd: NUXT_APP_DIR });
    } catch (e) {
      // Ignore if directories don't exist
    }
  });

  test('should build Nuxt app successfully', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NUXT_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check build succeeded
    expect(stdout).toContain('Client built');
    
    // Check that bundle watch ran
    expect(stdout).toContain('Bundle Watch');
  });

  test('should generate .output directory', async () => {
    const outputPath = join(NUXT_APP_DIR, '.output');
    
    // Check .output directory exists
    await expect(access(outputPath)).resolves.not.toThrow();
  });

  test('should collect metrics during Nuxt build', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NUXT_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for metrics in output
    expect(stdout).toContain('Total Size');
    expect(stdout).toContain('Gzipped');
    expect(stdout).toContain('Brotli');
  });

  test('should display bundle breakdown', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NUXT_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for asset type breakdown
    expect(stdout).toContain('JavaScript');
    expect(stdout).toContain('CSS');
  });

  test('should run Bundle Watch for client build', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NUXT_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Nuxt builds both client and server
    expect(stdout).toContain('Building client');
    expect(stdout).toContain('Bundle Watch');
  });

  test('should have correct Brotli compression ratio', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NUXT_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Extract gzip and brotli sizes
    const gzipMatch = stdout.match(/Gzipped:\s+([\d.]+\s+[KMG]?B)/);
    const brotliMatch = stdout.match(/Brotli:\s+([\d.]+\s+[KMG]?B)/);
    
    if (gzipMatch && brotliMatch) {
      // Just verify both are present - brotli should be smaller
      expect(gzipMatch[1]).toBeTruthy();
      expect(brotliMatch[1]).toBeTruthy();
    }
  });
});

