import type { NextConfig } from 'next';
import { withBundleWatch } from '@milencode/bundlewatch-nextjs';

const nextConfig: NextConfig = {
  // Your existing Next.js config
};

// withBundleWatch automatically detects Webpack vs Turbopack
// - Webpack: injects plugin directly
// - Turbopack: sets up post-build analysis
export default withBundleWatch(nextConfig, {
  enabled: true,
  printReport: true,
  saveToGit: false,
  extractModules: true,
  buildDependencyGraph: true,
  generateRecommendations: true,
  generateDashboard: true,
  dashboardPath: './bundle-report',
});

