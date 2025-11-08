import { defineConfig } from "@solidjs/start/config";
import { bundleWatch } from '@milencode/bundlewatch-vite-plugin';

export default defineConfig({
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
