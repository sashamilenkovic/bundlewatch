import { exec } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { expect, test } from '@playwright/test';

const execAsync = promisify(exec);

const NEXTJS_APP_DIR = join(process.cwd(), '../examples/nextjs-app');

test.describe('Next.js Webpack Plugin', () => {
  // Increase timeout for builds
  test.setTimeout(180000);

  // Store build output for all tests to use
  let buildOutput: string;

  test.beforeAll(async () => {
    // Clean build
    try {
      await execAsync('rm -rf .next bundle-report', { cwd: NEXTJS_APP_DIR });
    } catch {
      // Ignore if directories don't exist
    }

    // Run build once for all tests
    const { stdout } = await execAsync('pnpm build', {
      cwd: NEXTJS_APP_DIR,
      env: { ...process.env, CI: 'false' },
      timeout: 180000,
    });

    buildOutput = stdout;
  });

  test('should build Next.js app successfully', () => {
    // Check build succeeded - Next.js 15.5+ shows route table on success
    expect(buildOutput).toMatch(/Route \(app\)|Generating static pages/);

    // Check that BundleWatch ran
    expect(buildOutput).toContain('Bundle Watch');
  });

  test('should generate .next directory', async () => {
    const nextPath = join(NEXTJS_APP_DIR, '.next');

    // Check .next directory exists
    await expect(access(nextPath)).resolves.not.toThrow();
  });

  test('should collect metrics during Next.js build', () => {
    // Check for metrics in output
    expect(buildOutput).toContain('Total Size');
    expect(buildOutput).toContain('Gzipped');
    expect(buildOutput).toContain('Brotli');
    expect(buildOutput).toContain('Build Time');
  });

  test('should display bundle breakdown', () => {
    // Check for asset type breakdown
    expect(buildOutput).toContain('JavaScript');
    expect(buildOutput).toContain('CSS');
  });

  test('should show Next.js route table', () => {
    // Check Next.js built its route table
    expect(buildOutput).toContain('Route (app)');
    expect(buildOutput).toContain('First Load JS');
  });

  test('should generate HTML dashboard', async () => {
    const dashboardPath = join(NEXTJS_APP_DIR, 'bundle-report', 'index.html');

    // Check dashboard was generated
    await expect(access(dashboardPath)).resolves.not.toThrow();

    // Verify it's a valid HTML file
    const content = await readFile(dashboardPath, 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('Bundle Watch');
  });

  test('should analyze chunks in bundle', () => {
    // Check that chunk analysis is working
    // Next.js outputs chunk info in the route table
    expect(buildOutput).toMatch(/chunks\/.*\.js/);
  });

  test('should extract module dependencies in dashboard', async () => {
    const dashboardPath = join(NEXTJS_APP_DIR, 'bundle-report', 'index.html');
    const content = await readFile(dashboardPath, 'utf-8');

    // Check that real npm packages are detected (not just generic names)
    expect(content).toContain('"name":"next"');
    expect(content).toContain('"name":"react-dom"');
    expect(content).toContain('"name":"lodash"');
    expect(content).toContain('"name":"date-fns"');
    expect(content).toContain('"name":"zustand"');

    // Check that app code is properly identified
    expect(content).toContain('"type":"app"');
    expect(content).toContain('"type":"npm"');
  });

  test('should have human-readable chunk names in dashboard', async () => {
    const dashboardPath = join(NEXTJS_APP_DIR, 'bundle-report', 'index.html');
    const content = await readFile(dashboardPath, 'utf-8');

    // Check for meaningful chunk names (not just hashes or "webpack")
    expect(content).toContain('framework (react)');
    expect(content).toContain('polyfills');
    expect(content).toContain('webpack-runtime');
    expect(content).toContain('app/layout');

    // Should have app router page names
    expect(content).toMatch(/app\/(page|_not-found\/page|about\/page|blog\/page)/);
  });
});
