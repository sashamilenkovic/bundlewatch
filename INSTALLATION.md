# Installing Bundle Watch from GitHub

Bundle Watch is currently in **private development**. Until it's published to npm, you can install it directly from GitHub.

---

## 📦 Installation

### Option 1: SSH (Recommended for Local Development)

If you have SSH keys configured for GitHub:

```bash
pnpm add -D \
  bundlewatch@github:yourusername/bundlewatch \
  @bundlewatch/core@github:yourusername/bundlewatch#workspace=@bundlewatch/core \
  @bundlewatch/vite-plugin@github:yourusername/bundlewatch#workspace=@bundlewatch/vite-plugin
```

Or add to `package.json`:

```json
{
  "devDependencies": {
    "@bundlewatch/core": "github:yourusername/bundlewatch#workspace=@bundlewatch/core",
    "@bundlewatch/vite-plugin": "github:yourusername/bundlewatch#workspace=@bundlewatch/vite-plugin"
  }
}
```

### Option 2: HTTPS with Personal Access Token (For CI/CD)

#### Step 1: Create a GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens/new
2. Select scopes:
   - ✅ `repo` (for private repos)
3. Generate token and copy it (you won't see it again!)

#### Step 2: Configure in `.npmrc`

**Local Development:**

Create `.npmrc` in your project root:

```ini
# .npmrc
@bundlewatch:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then set environment variable:

```bash
# In your shell profile (~/.zshrc, ~/.bashrc)
export GITHUB_TOKEN=ghp_yourpersonalaccesstoken
```

**CI/CD (GitHub Actions):**

```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: pnpm install
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### Step 3: Install via HTTPS

```bash
# Using environment variable
GITHUB_TOKEN=ghp_xxx pnpm add -D \
  @bundlewatch/core@github:yourusername/bundlewatch#workspace=@bundlewatch/core \
  @bundlewatch/vite-plugin@github:yourusername/bundlewatch#workspace=@bundlewatch/vite-plugin
```

### Option 3: Direct GitHub URL (Alternative)

```json
{
  "devDependencies": {
    "@bundlewatch/core": "https://<token>@github.com/yourusername/bundlewatch.git#workspace=@bundlewatch/core",
    "@bundlewatch/vite-plugin": "https://<token>@github.com/yourusername/bundlewatch.git#workspace=@bundlewatch/vite-plugin"
  }
}
```

⚠️ **Security Warning**: Don't commit tokens to `package.json`! Use environment variables instead.

---

## 🚀 Quick Start

### 1. For Vite Projects

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { bundleWatch } from '@bundlewatch/vite-plugin';

export default defineConfig({
  plugins: [
    bundleWatch({
      enabled: true,
      printReport: true,
      saveToGit: false, // Set true in CI
    }),
  ],
});
```

### 2. For CLI Usage

```bash
# After build
npx @bundlewatch/cli analyze ./dist
```

### 3. For Programmatic Usage

```typescript
import { collectMetrics, compareMetrics } from '@bundlewatch/core';

const metrics = await collectMetrics({
  outputDir: './dist',
  branch: 'main',
  commit: 'abc123',
});

console.log(`Total size: ${metrics.totalSize} bytes`);
```

---

## 🔧 Configuration

### Vite Plugin Options

```typescript
interface BundleWatchOptions {
  /** Enable/disable the plugin */
  enabled?: boolean;
  
  /** Print report to console */
  printReport?: boolean;
  
  /** Save metrics to git branch */
  saveToGit?: boolean;
  
  /** Git branch to store data (default: 'bundlewatch-data') */
  gitBranch?: string;
  
  /** Branch to compare against (default: 'main') */
  compareAgainst?: string;
  
  /** Fail build if size increases */
  failOnSizeIncrease?: boolean;
  
  /** Size increase threshold % (default: 10) */
  sizeIncreaseThreshold?: number;
  
  /** Generate markdown report */
  generateMarkdown?: boolean;
  
  /** Markdown output path */
  markdownPath?: string;
}
```

---

## 🏗️ CI/CD Setup

### GitHub Actions

```yaml
name: Bundle Watch CI

on: [push, pull_request]

permissions:
  contents: write  # Required to push metrics to bundlewatch-data branch

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full git history for comparison
      
      - name: Setup Node.js 24
        uses: actions/setup-node@v4
        with:
          node-version: '24'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
      
      - name: Install dependencies
        run: pnpm install
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build with Bundle Watch
        run: pnpm build
        env:
          CI: true
```

### Configure Git for CI

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    bundleWatch({
      enabled: true,
      saveToGit: process.env.CI === 'true',  // Only save in CI
      compareAgainst: process.env.GITHUB_BASE_REF || 'main',
      failOnSizeIncrease: process.env.CI === 'true',
    }),
  ],
});
```

---

## 📦 Installing Optional Plugins

### Lighthouse Plugin (Optional)

For performance correlation analysis:

```bash
pnpm add -D \
  @bundlewatch/lighthouse-plugin@github:yourusername/bundlewatch#workspace=@bundlewatch/lighthouse-plugin
```

**Requirements:**
- Chrome/Chromium installed
- Preview server running

```typescript
import { runLighthouse, correlateBundleAndPerformance } from '@bundlewatch/lighthouse-plugin';

// In your build script or vite config
const lighthouse = await runLighthouse({
  url: 'http://localhost:4173',
  headless: true,
});

console.log(`Performance Score: ${lighthouse.performance}/100`);
```

---

## 🔒 Security Best Practices

### 1. Never Commit Tokens

❌ **Bad:**
```json
{
  "devDependencies": {
    "@bundlewatch/core": "https://ghp_token123@github.com/user/repo.git"
  }
}
```

✅ **Good:**
```bash
# .env (gitignored)
GITHUB_TOKEN=ghp_token123

# .npmrc
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

### 2. Use Environment Variables

```bash
# Install command
GITHUB_TOKEN=$TOKEN pnpm install

# CI
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Scope Tokens Appropriately

Only grant necessary permissions:
- `repo` for private repos
- `read:packages` if using GitHub Packages

### 4. Add to `.gitignore`

```gitignore
# .gitignore
.npmrc
.env
*.local
```

---

## 🐛 Troubleshooting

### "Permission denied (publickey)"

**Problem:** SSH keys not configured for GitHub

**Solution:** Use HTTPS with token (Option 2) or configure SSH:
```bash
ssh-keygen -t ed25519 -C "your@email.com"
# Add ~/.ssh/id_ed25519.pub to GitHub settings
```

### "Could not resolve dependency"

**Problem:** Token not configured or expired

**Solution:**
1. Check token is set: `echo $GITHUB_TOKEN`
2. Verify token has `repo` scope
3. Ensure `.npmrc` is configured

### "404 Not Found"

**Problem:** Incorrect repository path or no access

**Solution:**
```bash
# Verify you have access
gh repo view yourusername/bundlewatch

# Check workspace path is correct
@bundlewatch/core@github:yourusername/bundlewatch#workspace=@bundlewatch/core
```

### "WARN Unsupported engine"

**Problem:** Node.js version < 24

**Solution:**
```bash
# Using nvm
nvm install 24
nvm use 24

# Or update Node.js
```

---

## 🎯 Example Project Setup

Complete example from scratch:

```bash
# 1. Create new project
mkdir my-app && cd my-app
npm init -y

# 2. Set up authentication
export GITHUB_TOKEN=ghp_yourtoken

# 3. Install Vite + Bundle Watch
pnpm add -D vite
pnpm add -D \
  @bundlewatch/core@github:yourusername/bundlewatch#workspace=@bundlewatch/core \
  @bundlewatch/vite-plugin@github:yourusername/bundlewatch#workspace=@bundlewatch/vite-plugin

# 4. Create vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import { bundleWatch } from '@bundlewatch/vite-plugin';

export default defineConfig({
  plugins: [bundleWatch({ enabled: true, printReport: true })],
});
EOF

# 5. Build
pnpm vite build
```

---

## 📚 Next Steps

- Read [QUICKSTART.md](./QUICKSTART.md) for detailed usage
- Check [EXPERIMENTS.md](./EXPERIMENTS.md) for advanced features
- See [GIT_PERMISSIONS.md](./GIT_PERMISSIONS.md) for CI configuration
- Review [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute

---

## 🚀 When We Go Public

Once published to npm, installation will be simpler:

```bash
# Future public installation
pnpm add -D @bundlewatch/core @bundlewatch/vite-plugin
```

**Until then**, use GitHub installation method above! 🎉

