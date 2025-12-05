import { bundleWatch } from '@milencode/bundlewatch-vite-plugin';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  vite: {
    plugins: [
      bundleWatch({
        enabled: true,
        printReport: true,
        saveToGit: false,
        generateDashboard: true,
        dashboardPath: './bundle-report',
      }),
    ],
  },
});
