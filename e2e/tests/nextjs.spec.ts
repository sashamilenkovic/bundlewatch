import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const NEXTJS_APP_DIR = join(process.cwd(), '../examples/nextjs-app');

test.describe('Next.js Plugin', () => {
  test.beforeAll(async () => {
    // Clean build
    try {
      await execAsync('rm -rf .next', { cwd: NEXTJS_APP_DIR });
    } catch (e) {
      // Ignore if .next doesn't exist
    }
  });

  test('should build Next.js app successfully', async () => {
    const { stdout, stderr } = await execAsync('pnpm build', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check build succeeded
    expect(stdout).toContain('Compiled successfully');
    
    // Check that bundle watch ran
    expect(stdout).toContain('Bundle Watch');
  });

  test('should generate .next directory', async () => {
    const nextPath = join(NEXTJS_APP_DIR, '.next');
    
    // Check .next directory exists
    await expect(access(nextPath)).resolves.not.toThrow();
  });

  test('should collect metrics during Next.js build', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for metrics in output
    expect(stdout).toContain('Total Size');
    expect(stdout).toContain('Gzipped');
    expect(stdout).toContain('Brotli');
    expect(stdout).toContain('Build Time');
  });

  test('should show per-route analysis section', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for per-route analysis header
    expect(stdout).toContain('Per-Route Analysis');
  });

  test('should display bundle breakdown', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check for asset type breakdown
    expect(stdout).toContain('JavaScript');
    expect(stdout).toContain('CSS');
  });

  test('should check route budgets', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Should show budget warnings (we set low budgets in config)
    expect(stdout).toContain('exceeds 500 KB');
  });

  test('should show Next.js route table', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
    });

    // Check Next.js built its route table
    expect(stdout).toContain('Route (app)');
    expect(stdout).toContain('First Load JS');
  });
});

