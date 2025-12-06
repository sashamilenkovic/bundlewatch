import { bundleWatch } from '@milencode/bundlewatch-vite-plugin';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit(),
    bundleWatch({
      enabled: true,
      printReport: true,
      saveToGit: false,
      generateDashboard: true,
      dashboardPath: './bundle-report',
    }),
  ],
});
