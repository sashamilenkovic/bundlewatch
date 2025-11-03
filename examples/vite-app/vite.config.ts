import { defineConfig } from "vite";
import { bundleWatch } from "@milencode/bundlewatch-vite-plugin";

export default defineConfig({
  plugins: [
    bundleWatch({
      enabled: true,
      printReport: true,
      saveToGit: false, // Set to true to test git storage
      compareAgainst: "main",
      failOnSizeIncrease: false,
      sizeIncreaseThreshold: 10,
    }),
  ],
});
