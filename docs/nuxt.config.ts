// Nuxt Content-powered docs site for BundleWatch
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  ssr: true,
  modules: ['@nuxt/content'],
  app: {
    head: {
      title: 'BundleWatch Docs',
      meta: [
        { name: 'description', content: 'Documentation site for BundleWatch build analytics' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
  content: {
    documentDriven: true,
    highlight: {
      theme: 'github-dark',
    },
    navigation: {
      fields: ['description'],
    },
  },
  css: [
    '~/assets/global.css',
  ],
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/getting-started',
        '/storage',
        '/architecture',
        '/vite',
        '/webpack',
        '/next',
        '/cli',
        '/deployment',
        '/framework-recipes',
        '/examples',
      ],
    },
  },
  routeRules: {
    '/**': { prerender: true },
  },
  compatibilityDate: '2024-11-25',
});
