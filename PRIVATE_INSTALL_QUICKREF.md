# Private GitHub Installation - Quick Reference

**TL;DR**: Bundle Watch is private, install from GitHub with credentials.

---

## 🏠 Local Development (Choose One)

### SSH (Easiest)
```bash
pnpm add -D \
  @bundlewatch/core@github:yourusername/bundlewatch#workspace=@bundlewatch/core \
  @bundlewatch/vite-plugin@github:yourusername/bundlewatch#workspace=@bundlewatch/vite-plugin
```

### HTTPS with Token
```bash
# 1. Get token: https://github.com/settings/tokens/new (scope: repo)
# 2. Set env var
export GITHUB_TOKEN=ghp_yourtoken

# 3. Create .npmrc
echo "//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}" > .npmrc

# 4. Install
pnpm install
```

---

## 🤖 CI/CD (GitHub Actions)

### Step 1: Grant Permissions

```yaml
# .github/workflows/ci.yml
permissions:
  contents: write  # ⚠️ Required for bundlewatch git storage
```

### Step 2: Configure Installation

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2

- name: Install dependencies
  run: pnpm install
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Auto-available
```

### Step 3: Configure Vite

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    bundleWatch({
      saveToGit: process.env.CI === 'true',  // Only in CI
    }),
  ],
});
```

---

## 📦 Package.json Format

```json
{
  "devDependencies": {
    "@bundlewatch/core": "github:yourusername/bundlewatch#workspace=@bundlewatch/core",
    "@bundlewatch/vite-plugin": "github:yourusername/bundlewatch#workspace=@bundlewatch/vite-plugin"
  }
}
```

**Important:**
- Replace `yourusername` with actual GitHub username/org
- Add `.npmrc` to `.gitignore`
- Never commit tokens

---

## 🔑 GitHub Token Scopes

Minimum required:
- ✅ `repo` (full control of private repositories)

Optional (if using GitHub Packages):
- ✅ `read:packages`
- ✅ `write:packages`

---

## 🚨 Common Issues

| Error | Fix |
|-------|-----|
| `Permission denied` | Use HTTPS + token instead of SSH |
| `404 Not Found` | Check token has `repo` scope |
| `Could not resolve` | Set `GITHUB_TOKEN` env var |
| `Unsupported engine` | Upgrade to Node.js 24+ |

---

## 📖 Full Documentation

See [INSTALLATION.md](./INSTALLATION.md) for complete guide.

