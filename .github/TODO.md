# TODO: When Going Public

## Codecov Setup

When you make this repo public, add Codecov integration:

### 1. Add codecov.yml

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 1%
    patch:
      default:
        target: 80%
        threshold: 1%

comment:
  layout: "reach,diff,flags,files,footer"
  behavior: default
  require_changes: false

ignore:
  - "examples/**"
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/dist/**"
```

### 2. Update CI Workflow

In `.github/workflows/ci.yml`, add after "Run tests with coverage":

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
    fail_ci_if_error: false
```

### 3. Add Badge to README

```markdown
[![codecov](https://codecov.io/gh/yourusername/bundlewatch/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/bundlewatch)
```

No token needed for public repos! Codecov will auto-detect on first upload.

---

## Other Public Repo Tasks

- [ ] Add LICENSE file (MIT)
- [ ] Add CONTRIBUTING.md guidelines
- [ ] Set up GitHub Discussions
- [ ] Add GitHub issue templates
- [ ] Create release workflow
- [ ] Publish to npm
- [ ] Add to npm keywords: bundle, analyzer, vite, performance
- [ ] Tweet about it! 🚀

