import { bundleWatchPlugin } from '@milencode/bundlewatch-webpack-plugin';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Only run on client bundle
    if (!isServer) {
      config.plugins.push(
        bundleWatchPlugin({
          enabled: true,
          printReport: true,
          saveToGit: false,
          extractModules: true,
          buildDependencyGraph: true,
          generateRecommendations: true,
          generateDashboard: true,
          dashboardPath: './bundle-report',
        })
      );
    }
    return config;
  },
};

export default nextConfig;
