import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/examples/**', '**/e2e/**'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    server: {
      deps: {
        inline: [/@bundlewatch/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['packages/core/src/**/*.ts'],
      exclude: [
        'packages/*/src/**/*.d.ts',
        'packages/*/src/**/*.test.ts',
        'packages/*/src/**/*.spec.ts',
        'packages/*/src/index.ts',
        'packages/*/src/types.ts',
        'packages/core/src/storage.ts', // Requires complex git mocking - tested separately
        '**/node_modules/**',
        '**/dist/**',
        '**/examples/**',
        '**/.{idea,git,cache,output,temp}/**',
      ],
      all: true,
      thresholds: {
        lines: 85,
        functions: 75,
        branches: 85,
        statements: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@bundlewatch/core': '/Users/sashamilenkovic/Projects/bundle-watch/packages/core/src/index.ts',
    },
  },
});
