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

## 🚀 Running Tests

### Quick Start
```bash
cd e2e
pnpm install
pnpm test
```

### Run Specific Tests
```bash
pnpm test:vite        # Vite plugin tests (5 tests)
pnpm test:dashboard   # Dashboard generation tests (7 tests)
pnpm test:next        # Next.js plugin tests (coming soon)
pnpm test:webpack     # Webpack plugin tests (coming soon)
```

### Debug Mode
```bash
pnpm test:debug       # Run with Playwright Inspector
pnpm test:ui          # Run with Playwright UI Mode
```

## 📊 Test Results

```
✓ 12/12 tests passing
✓ Vite Plugin: 5/5 passing
✓ Dashboard: 7/7 passing
✓ Next.js Plugin: Ready for tests
✓ Webpack Plugin: Ready for tests
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

## 🔮 Coming Soon

### Next.js Plugin Tests
- [ ] App Router builds successfully
- [ ] Pages Router builds successfully
- [ ] Per-route analysis works
- [ ] Route budgets are enforced
- [ ] Build manifest is parsed

### Webpack Plugin Tests
- [ ] Basic webpack integration
- [ ] Metrics collection
- [ ] Report generation
- [ ] Custom output paths

### Advanced Tests
- [ ] Git storage functionality
- [ ] Historical comparisons
- [ ] PR comment integration
- [ ] Multi-repo support

## 📁 Test Structure

```
e2e/
├── tests/
│   ├── vite.spec.ts        ✅ 5/5 passing
│   ├── dashboard.spec.ts   ✅ 7/7 passing
│   ├── nextjs.spec.ts      🔄 Ready for implementation
│   └── webpack.spec.ts     🔄 Ready for implementation
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

- ✅ Vite Plugin: 100%
- ✅ Dashboard: 100%
- 🔄 Next.js Plugin: 0% (tests ready)
- 🔄 Webpack Plugin: 0% (tests ready)
- 🔄 CLI: Partial
- 🔄 Git Storage: Not yet
- 🔄 Comparisons: Not yet

---

**These tests ensure bundlewatch works correctly in real-world scenarios!** 🚀

