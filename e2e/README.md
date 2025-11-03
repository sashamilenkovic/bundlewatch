# Bundle Watch E2E Tests

End-to-end tests using Playwright to validate the entire build → analyze → report pipeline.

## 🎯 Test Coverage

### ✅ Vite Plugin Tests (`vite.spec.ts`)
- Build succeeds
- Bundle Watch runs during build
- Metrics are collected
- Bundle breakdown is displayed
- Recommendations are generated

### ✅ Dashboard Tests (`dashboard.spec.ts`)
- Static HTML export works
- Dashboard is self-contained
- All views are present (Overview, Treemap, Dependencies, History, Compare)
- Data.json is generated
- Metrics are embedded correctly

### 🔄 Next.js Plugin Tests (`nextjs.spec.ts`)
- App Router support
- Pages Router support
- Per-route analysis
- Route budgets

### 🔄 Webpack Plugin Tests (`webpack.spec.ts`)
- Basic webpack integration
- Metrics collection
- Report generation

## 🚀 Running Tests

### Run All Tests
```bash
cd e2e
pnpm install
pnpm test
```

### Run Specific Test Suite
```bash
pnpm test:vite        # Vite plugin tests
pnpm test:next        # Next.js plugin tests
pnpm test:webpack     # Webpack plugin tests
pnpm test:dashboard   # Dashboard generation tests
```

### Debug Mode
```bash
pnpm test:debug       # Run with Playwright Inspector
pnpm test:ui          # Run with Playwright UI
```

## 📁 Test Structure

```
e2e/
├── tests/
│   ├── vite.spec.ts        # Vite plugin E2E tests
│   ├── nextjs.spec.ts      # Next.js plugin E2E tests
│   ├── webpack.spec.ts     # Webpack plugin E2E tests
│   └── dashboard.spec.ts   # Dashboard generation tests
├── playwright.config.ts    # Playwright configuration
├── package.json
└── README.md
```

## ✅ What These Tests Validate

### 1. Build Integration
- Plugins integrate correctly with build tools
- No build errors introduced
- Build output is correct

### 2. Metrics Collection
- File sizes are measured accurately
- Gzip/Brotli compression is calculated
- Bundle breakdown is correct
- Dependencies are analyzed

### 3. Reporting
- Console output is formatted correctly
- Warnings are shown
- Recommendations are generated

### 4. Dashboard
- HTML is generated
- Dashboard is interactive
- All views work
- Data is accurate

### 5. Git Storage (Future)
- Metrics are saved to git branch
- Historical data is loaded
- Comparisons work

## 🎨 Test Philosophy

These are **integration tests**, not unit tests:

1. **Real Builds** - Run actual build tools (Vite, Next.js, Webpack)
2. **Real Output** - Analyze real bundle files
3. **Real Pipeline** - Test the entire user workflow
4. **No Mocks** - Use real tools, real files

## 📊 CI Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 24
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build packages
        run: pnpm build
      
      - name: Install Playwright
        run: npx playwright install --with-deps
        working-directory: e2e
      
      - name: Run E2E tests
        run: pnpm test
        working-directory: e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

## 🔧 Adding New Tests

### Template:
```typescript
import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

test.describe('My Feature', () => {
  test('should work correctly', async () => {
    // Build something
    const { stdout } = await execAsync('pnpm build', {
      cwd: '/path/to/example',
    });
    
    // Assert expectations
    expect(stdout).toContain('expected output');
  });
});
```

## 📝 Best Practices

1. **Clean State** - Use `beforeAll` to clean build output
2. **Real Examples** - Test against actual example projects
3. **Full Pipeline** - Test build → analyze → report
4. **Assertions** - Verify both success and content
5. **Cleanup** - Remove test artifacts in `afterAll`

## 🐛 Debugging Failed Tests

```bash
# Run specific test with debug
pnpm test:debug tests/vite.spec.ts

# View test report
open playwright-report/index.html

# Run with verbose output
pnpm test --reporter=list

# Run with trace
pnpm test --trace=on
```

## 🎯 Future Test Ideas

- [ ] Test with large projects (1000+ files)
- [ ] Test with monorepos
- [ ] Test error handling (invalid configs)
- [ ] Test with different Node versions
- [ ] Test with different OS (Windows, macOS, Linux)
- [ ] Performance benchmarks
- [ ] Memory usage tests

---

**These tests ensure bundlewatch works correctly in real-world scenarios!** 🚀

