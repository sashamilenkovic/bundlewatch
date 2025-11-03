import type { NextConfig } from 'next';
import { withBundleWatch } from '@bundlewatch/next-plugin';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withBundleWatch(nextConfig, {
  enabled: true,
  printReport: true,
  saveToGit: false,
  perRoute: true,
  budgets: {
    '/': {
      maxSize: 500 * 1024, // 500 KB
      maxGzipSize: 200 * 1024, // 200 KB
    },
  },
});

