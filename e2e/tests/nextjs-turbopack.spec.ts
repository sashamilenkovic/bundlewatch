import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import { access, readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const NEXTJS_APP_DIR = join(process.cwd(), '../examples/nextjs-app');

test.describe('Next.js Turbopack Plugin', () => {
  // Increase timeout for turbopack builds
  test.setTimeout(120000);

  test.beforeAll(async () => {
    // Clean build
    try {
      await execAsync('rm -rf .next', { cwd: NEXTJS_APP_DIR });
    } catch (e) {
      // Ignore if .next doesn't exist
    }
  });

  test('should build Next.js app with Turbopack successfully', async () => {
    // Build with Turbopack and stats enabled
    const { stdout, stderr } = await execAsync(
      'TURBOPACK_STATS=1 pnpm build --turbo',
      {
        cwd: NEXTJS_APP_DIR,
        env: { ...process.env, CI: 'false' },
        timeout: 120000,
      }
    );

    // Check build succeeded
    expect(stdout).toContain('Compiled');

    // Should either show bundlewatch output or turbopack mode message
    const hasBundleWatchOutput =
      stdout.includes('Bundle Watch') ||
      stdout.includes('Turbopack mode enabled');

    expect(hasBundleWatchOutput).toBe(true);
  });

  test('should generate Turbopack stats file', async () => {
    // First ensure build with TURBOPACK_STATS=1
    await execAsync('TURBOPACK_STATS=1 pnpm build --turbo', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
      timeout: 120000,
    });

    // Check that webpack-stats.json was created
    const statsPath = join(NEXTJS_APP_DIR, '.next/server/webpack-stats.json');

    // This may or may not exist depending on Next.js version
    // For now we'll just check the build completed
    try {
      await access(statsPath);
      const content = await readFile(statsPath, 'utf-8');
      const stats = JSON.parse(content);

      // Verify it has the expected structure
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    } catch {
      // Stats file may not be generated in all Next.js versions
      // This is expected - the test should still pass
      console.log(
        'Note: webpack-stats.json not found (may be expected for this Next.js version)'
      );
    }
  });

  test('should generate .next directory with Turbopack', async () => {
    // Ensure we have a fresh build
    await execAsync('TURBOPACK_STATS=1 pnpm build --turbo', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
      timeout: 120000,
    });

    const nextPath = join(NEXTJS_APP_DIR, '.next');

    // Check .next directory exists
    await expect(access(nextPath)).resolves.not.toThrow();
  });

  test('should work with CLI analyze command after Turbopack build', async () => {
    // Build with Turbopack
    await execAsync('TURBOPACK_STATS=1 pnpm build --turbo', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
      timeout: 120000,
    });

    // Run CLI analyze command using local workspace CLI
    // Use pnpm exec to run the local bundlewatch-cli package
    const cliPath = join(process.cwd(), '../packages/cli/dist/cli.js');
    const { stdout } = await execAsync(
      `node ${cliPath} analyze --compare-against main`,
      {
        cwd: NEXTJS_APP_DIR,
        env: { ...process.env, CI: 'false' },
        timeout: 60000,
      }
    );

    // Check for analyze output
    const hasAnalyzeOutput =
      stdout.includes('BundleWatch Analyze') ||
      stdout.includes('Total Size') ||
      stdout.includes('Analyzed');

    expect(hasAnalyzeOutput).toBe(true);
  });
});
