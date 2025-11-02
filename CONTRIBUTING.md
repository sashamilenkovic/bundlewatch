# Contributing to Bundle Watch

Thanks for your interest in contributing to Bundle Watch! 🎉

## Development Setup

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/bundle-watch.git
cd bundle-watch
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Build all packages:**

```bash
pnpm build
```

## Project Structure

```
bundle-watch/
├── packages/
│   ├── core/              # Core engine (framework-agnostic)
│   ├── vite-plugin/       # Vite plugin
│   └── cli/               # CLI tool
├── examples/
│   └── vite-app/          # Example Vite application
└── docs/                  # Documentation
```

## Development Workflow

### Working on Core Package

```bash
cd packages/core
pnpm dev  # Watch mode
```

### Working on Vite Plugin

```bash
cd packages/vite-plugin
pnpm dev  # Watch mode
```

### Testing Changes

Use the example app to test your changes:

```bash
# Build all packages first
pnpm build

# Run example
pnpm --filter example-vite build
```

## Making Changes

1. **Create a feature branch:**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** with clear, focused commits

3. **Test your changes** in the example app

4. **Update documentation** if needed

5. **Submit a pull request**

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions small and focused

## Testing

Currently, we're building out the test infrastructure. For now:

1. Build the packages: `pnpm build`
2. Test with the example app: `pnpm --filter example-vite build`
3. Verify the output looks correct

## Documentation

When adding new features:

1. Update the relevant package README
2. Add examples to the main README
3. Update API documentation if needed

## Pull Request Process

1. Ensure your code builds without errors
2. Update the README with details of changes if applicable
3. Update the version numbers following [SemVer](https://semver.org/)
4. The PR will be merged once you have the sign-off of a maintainer

## Feature Requests

Have an idea? Great! Please:

1. Check existing issues first
2. Open a new issue with the `enhancement` label
3. Describe the use case and expected behavior
4. Wait for feedback before implementing

## Bug Reports

Found a bug? Please:

1. Check existing issues first
2. Open a new issue with the `bug` label
3. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Environment details (OS, Node version, etc.)

## Questions?

Open a [Discussion](https://github.com/yourusername/bundle-watch/discussions) for questions about:

- How to use the library
- Architecture decisions
- Best practices
- General feedback

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🙏

