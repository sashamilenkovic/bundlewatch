import { withSentryConfig } from '@sentry/nextjs';
import { withBundleWatch } from '@milencode/bundlewatch-nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Needed for monaco-editor
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

// Wrap with Sentry first, then BundleWatch
const withSentry = withSentryConfig(nextConfig, {
  // Sentry options
  silent: true,
  disableLogger: true,
});

export default withBundleWatch(withSentry, {
  enabled: true,
  verbose: true,
  printReport: true,
  saveToGit: false,
  extractModules: true,
  buildDependencyGraph: true,
  generateRecommendations: true,
  generateDashboard: true,
  dashboardPath: './bundle-report',
});
