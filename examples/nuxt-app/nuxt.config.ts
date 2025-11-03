import { bundleWatch } from '@bundlewatch/vite-plugin';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: ['@nuxtjs/tailwindcss'],
  
  vite: {
    plugins: [
      bundleWatch({
        enabled: true,
        printReport: true,
        saveToGit: false,
      }),
    ],
  },
});

