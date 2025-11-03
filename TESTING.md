# Testing Guide

## 🧪 Test Suite Overview

Bundle Watch has comprehensive E2E tests using Playwright that validate the entire build → analyze → report pipeline.

## ✅ Current Test Coverage

### Vite Plugin Tests (5/5 passing)
- ✅ Build succeeds with plugin enabled
- ✅ Bundle analysis runs during build  
- ✅ Metrics are collected accurately
- ✅ Bundle breakdown is displayed
- ✅ Build completes successfully

### Dashboard Generation Tests (7/7 passing)
- ✅ Static HTML export works
- ✅ Data.json is generated with correct structure
- ✅ Dashboard is self-contained (CSS/JS embedded)
- ✅ All views are present (Overview, Treemap, Dependencies, History, Compare)
- ✅ Metrics are embedded correctly
- ✅ Chart.js is included
- ✅ Server command exists

### Next.js Plugin Tests (7/7 passing)
- ✅ Build succeeds with Next.js 15
- ✅ Metrics are collected during build
- ✅ Per-route analysis works
- ✅ Bundle breakdown is displayed
- ✅ Route budgets are checked
- ✅ Route table is shown
- ✅ .next directory is generated

### Nuxt Integration Tests (6/6 passing)
- ✅ Nuxt app builds successfully
- ✅ .output directory is generated
- ✅ Metrics are collected during build
- ✅ Bundle breakdown is displayed
- ✅ Bundle Watch runs for client build
- ✅ Brotli compression is correct

### Webpack Plugin Tests (6/6 passing)
- ✅ Webpack app builds successfully
- ✅ dist directory is generated
- ✅ Metrics are collected during build
- ✅ Bundle breakdown is displayed
- ✅ Brotli compression is correct
- ✅ Webpack output info is shown

## 🚀 Running Tests

### Quick Start
```bash
cd e2e
pnpm install
pnpm test
```

### Run Specific Tests
```bash
cd e2e
npx playwright test tests/vite.spec.ts        # Vite plugin (5 tests)
npx playwright test tests/dashboard.spec.ts   # Dashboard (7 tests)
npx playwright test tests/nextjs.spec.ts      # Next.js plugin (7 tests)
npx playwright test tests/nuxt.spec.ts        # Nuxt integration (6 tests)
npx playwright test tests/webpack.spec.ts     # Webpack plugin (6 tests)
```

### Debug Mode
```bash
pnpm test:debug       # Run with Playwright Inspector
pnpm test:ui          # Run with Playwright UI Mode
```

## 📊 Test Results

```
✓ 31/31 tests passing
✓ Vite Plugin: 5/5 passing
✓ Dashboard: 7/7 passing
✓ Next.js Plugin: 7/7 passing
✓ Nuxt Integration: 6/6 passing
✓ Webpack Plugin: 6/6 passing
```

## 🎯 What We Test

### 1. Build Integration
- Plugins integrate correctly with build tools
- No build errors introduced
- Build output is correct
- Bundle analysis runs automatically

### 2. Metrics Collection
- File sizes measured accurately
- Gzip/Brotli compression calculated
- Bundle breakdown correct
- Dependencies analyzed
- Build duration tracked

### 3. Dashboard Generation
- HTML export works
- Dashboard is self-contained
- All views render
- Data is accurate
- Interactive features work

### 4. CLI Commands
- `bundlewatch export` works
- `bundlewatch serve` command exists
- Help text is correct

## 🔮 Future Tests

### Advanced Features
- [ ] Git storage save/load functionality
- [ ] Historical comparisons with baseline
- [ ] PR comment integration
- [ ] Multi-repo support
- [ ] Rollup plugin integration
- [ ] Parcel plugin integration
- [ ] esbuild plugin integration

## 📁 Test Structure

```
e2e/
├── tests/
│   ├── vite.spec.ts        ✅ 5/5 passing
│   ├── dashboard.spec.ts   ✅ 7/7 passing
│   ├── nextjs.spec.ts      ✅ 7/7 passing
│   ├── nuxt.spec.ts        ✅ 6/6 passing
│   └── webpack.spec.ts     ✅ 6/6 passing
├── playwright.config.ts
├── package.json
└── README.md
```

## 🏗️ Test Philosophy

These are **integration tests**, not unit tests:

- ✅ Real builds with real build tools
- ✅ Real bundle files analyzed
- ✅ Full user workflows tested
- ✅ No mocks - use actual tools

## 📝 Adding New Tests

### Template
```typescript
import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test.describe('Feature Name', () => {
  test('should do something', async () => {
    const { stdout } = await execAsync('pnpm build', {
      cwd: '/path/to/example',
    });
    
    expect(stdout).toContain('expected output');
  });
});
```

## 🐛 Debugging

```bash
# Run specific test with trace
npx playwright test tests/vite.spec.ts --trace=on

# View report
open playwright-report/index.html

# Run in headed mode
npx playwright test --headed

# Run with browser
npx playwright test --debug
```

## 🎨 Best Practices

1. **Clean State** - Use `beforeAll` to reset
2. **Real Examples** - Test against actual projects
3. **Full Pipeline** - Test end-to-end workflows
4. **Clear Assertions** - Verify both success and content
5. **Cleanup** - Remove artifacts in `afterAll`

## 🔧 CI Integration

Tests run automatically on:
- Every push to main
- Every pull request
- Before releases

See `.github/workflows/e2e.yml` for configuration.

## 📊 Coverage Goals

- ✅ Vite Plugin: 100% (5/5 tests)
- ✅ Dashboard: 100% (7/7 tests)
- ✅ Next.js Plugin: 100% (7/7 tests)
- ✅ Nuxt Integration: 100% (6/6 tests)
- ✅ Webpack Plugin: 100% (6/6 tests)
- 🔄 CLI: Partial
- 🔄 Git Storage: Not yet
- 🔄 Comparisons: Not yet

---

**These tests ensure bundlewatch works correctly in real-world scenarios!** 🚀

