import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { bundleWatch } from "@milencode/bundlewatch-vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  build: {
    sourcemap: true, // Enable source maps for analysis
  },
  plugins: [
    react(),
    bundleWatch({
      enabled: true,
      printReport: true,
      generateDashboard: true, // Enable dashboard generation
      saveToGit: false, // Set to true to test git storage
      compareAgainst: "main",
      failOnSizeIncrease: false,
      sizeIncreaseThreshold: 10,
      analyzeSourceMaps: true, // Enable source map analysis
    }),
    visualizer({
      open: true,
      filename: "stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
