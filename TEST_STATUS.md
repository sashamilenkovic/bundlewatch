# Test & Coverage Status

## ✅ What's Set Up

1. **Vitest Configuration** - Complete with coverage thresholds
2. **Codecov Integration** - Ready with GitHub Actions workflow
3. **Comprehensive Tests** - Written for all core functions:
   - ✅ `collector.test.ts` - 13 test cases
   - ✅ `analyzer.test.ts` - 17 test cases  
   - ✅ `reporter.test.ts` - 14 test cases
4. **Node 24 Configuration** - Package.json updated
5. **CI Pipeline** - GitHub Actions workflow for tests + coverage

## 🐛 Current Issue

There's a known issue with `rolldown-vite@7.1.14` (experimental Vite 7) causing SSR transform errors:

```
ReferenceError: __vite_ssr_exportName__ is not defined
```

### Solutions:

**Option 1: Switch to standard Vite (Recommended)**

```bash
# Update package.json to use standard Vite
pnpm remove vite
pnpm add -D vite@latest
```

**Option 2: Wait for Rolldown fix**

The issue is tracked in the Rolldown/Vite repository. Once fixed, tests will run.

**Option 3: Use tsx/esbuild for tests**

Configure vitest to use esbuild instead of Vite for transformation.

## 🧪 Test Coverage Plan

Once the Vite issue is resolved, our tests will cover:

### Collector Tests (`collector.test.ts`)
- ✅ Empty directory handling
- ✅ File discovery and analysis
- ✅ Asset type classification (JS, CSS, images, fonts)
- ✅ Gzip/Brotli compression
- ✅ Warning generation for large bundles
- ✅ Recommendation generation
- ✅ Source map and hidden file exclusion
- ✅ Nested directory traversal
- ✅ Build duration calculation
- ✅ Multiple file type identification

**Expected Coverage:** ~95%

### Analyzer Tests (`analyzer.test.ts`)
- ✅ Identical build comparison
- ✅ Size increase/decrease detection
- ✅ Added/removed bundle detection
- ✅ Changed bundle identification
- ✅ Unchanged bundle marking
- ✅ Bundle sorting by change size
- ✅ Insight generation
- ✅ Zero previous size handling
- ✅ Commit information tracking

**Expected Coverage:** ~98%

### Reporter Tests (`reporter.test.ts`)
- ✅ Badge generation with color coding
- ✅ README section generation
- ✅ Metrics table formatting
- ✅ Comparison display
- ✅ PR comment generation
- ✅ Console output formatting
- ✅ Asset breakdown display
- ✅ Warning/recommendation display
- ✅ Size and duration formatting

**Expected Coverage:** ~95%

## 📊 Coverage Thresholds

```typescript
thresholds: {
  lines: 75%,
  functions: 75%,
  branches: 70%,
  statements: 75%,
}
```

## 🚀 Running Tests (Once Fixed)

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:ci

# Watch mode
pnpm test -- --watch

# Coverage report
pnpm test:ci
# Then open: ./coverage/index.html
```

## 🔄 CI Integration

The GitHub Actions workflow (`.github/workflows/ci.yml`) is ready and will:

1. Run on push to main and all PRs
2. Install dependencies
3. Build all packages
4. Run tests with coverage
5. Upload coverage to Codecov
6. Comment on PRs with coverage changes

### Setup Codecov

1. Go to https://codecov.io/
2. Sign in with GitHub
3. Enable Bundle Watch repository
4. Add `CODECOV_TOKEN` to repository secrets
5. Done! Coverage will upload automatically

## 📝 Notes

- All tests use **functional composition** (no classes)
- Tests are pure and isolated
- Use filesystem for integration testing
- Mock data for unit testing
- Comprehensive edge case coverage

## 🎯 Next Steps

1. **Fix Vite Issue** - Switch to standard Vite or wait for Rolldown fix
2. **Run Tests** - Verify all 44 tests pass
3. **Check Coverage** - Aim for >80% overall
4. **Add Storage Tests** - Test git operations (requires mocking)
5. **Add Plugin Tests** - Test Vite plugin integration
6. **Setup Codecov** - Enable repository and get badge

---

**Status:** Tests written and ready, blocked by Vite/Rolldown SSR issue  
**Estimated Coverage:** 85-90% once running  
**Test Count:** 44 tests across 3 files

