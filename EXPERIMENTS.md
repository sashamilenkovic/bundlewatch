# Bundle Watch Experiments

Try these experiments to see Bundle Watch in action!

## Experiment 1: Size Increase Detection

```bash
cd examples/vite-app

# 1. Build baseline
pnpm build

# 2. Add a large string to your code
echo "export const LARGE = 'x'.repeat(10000);" >> src/main.ts

# 3. Build again and see the warning
pnpm build
```

**What you'll see:** Bundle size increased warning!

---

## Experiment 2: Code Splitting

```bash
cd examples/vite-app

# 1. Create a large module
cat > src/heavy.ts << 'EOF'
export const heavyFunction = () => {
  const data = new Array(1000).fill('some data');
  return data.join(',');
};
EOF

# 2. Import it dynamically (lazy load)
cat > src/lazy-example.ts << 'EOF'
export async function loadHeavy() {
  const { heavyFunction } = await import('./heavy');
  return heavyFunction();
}
EOF

# 3. Build and see multiple chunks!
pnpm build
```

**What you'll see:** Bundle Watch detects multiple chunks!

---

## Experiment 3: Git Storage

```bash
# 1. Enable git storage
cd examples/vite-app
# Edit vite.config.ts: set saveToGit: true

# 2. Make initial commit
git add .
git commit -m "Initial commit"

# 3. Build - this creates bundle-watch-data branch
pnpm build

# 4. Check the data branch
git fetch origin bundle-watch-data
git log bundle-watch-data
git show bundle-watch-data:data/main/latest.json
```

**What you'll see:** Metrics stored in git!

---

## Experiment 4: Comparison

```bash
# 1. Build on main
git checkout -b main
pnpm --filter example-vite build

# 2. Create feature branch and make changes
git checkout -b feature/test
echo "export const NEW_FEATURE = 'test';" >> examples/vite-app/src/main.ts

# 3. Build and see comparison!
pnpm --filter example-vite build
```

**What you'll see:** Comparison against main branch!

---

## Experiment 5: CLI Usage

```bash
# Analyze existing build
node packages/cli/dist/cli.js analyze --output examples/vite-app/dist

# Generate markdown report
node packages/cli/dist/cli.js report --format markdown > BUNDLE_REPORT.md

# Generate JSON for CI
node packages/cli/dist/cli.js report --format json > metrics.json
```

---

## Experiment 6: Threshold Testing

```bash
cd examples/vite-app

# Edit vite.config.ts:
bundleWatch({
  failOnSizeIncrease: true,
  sizeIncreaseThreshold: 1, // Very strict - 1%
})

# Add large code
echo "export const BIG = 'x'.repeat(50000);" >> src/main.ts

# Build - should FAIL!
pnpm build
```

**What you'll see:** Build fails if size exceeds threshold!

---

## Experiment 7: Multiple Frameworks

Bundle Watch core works with ANY bundler!

### With Webpack:

```javascript
// In your webpack build script
const { MetricsCollector } = require('@bundle-watch/core');

// After webpack compiles:
const collector = new MetricsCollector({
  outputDir: './dist',
  branch: 'main',
  commit: 'abc123',
});

const metrics = await collector.collect();
console.log(metrics);
```

### With Rollup:

```javascript
// rollup.config.js
import { MetricsCollector } from '@bundle-watch/core';

export default {
  // ... rollup config
  plugins: [
    {
      name: 'bundle-watch',
      closeBundle: async () => {
        const collector = new MetricsCollector({
          outputDir: './dist',
        });
        const metrics = await collector.collect();
        console.log(metrics);
      }
    }
  ]
};
```

---

## What to Try Next

1. **Add dependencies** - Install a large library and see warnings
2. **Optimize images** - Compress images and see size reduction
3. **Test in CI** - Push to GitHub and see it work in Actions
4. **Create HTML reports** - Extend ReportGenerator to output charts
5. **Build a dashboard** - Use the JSON output to create visualizations

---

## Debugging

### Common Issues:

**"Git errors"?**
- Make sure you're in a git repository: `git init`
- Add a remote if needed: `git remote add origin <url>`

**"No comparison data"?**
- First build won't have comparison
- Enable saveToGit to build history
- Or manually save: `node packages/cli/dist/cli.js analyze --save`

**"TypeScript errors"?**
- Run `pnpm build` in the root to compile all packages
- Check that dependencies are installed

---

Happy experimenting! 🚀

