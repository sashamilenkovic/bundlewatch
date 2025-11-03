<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        📦 Bundle Watch
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Nuxt 3 + Bundle Watch Example
      </p>
      <div class="flex gap-4 justify-center">
        <NuxtLink
          to="/about"
          class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
        >
          About Page
        </NuxtLink>
        <NuxtLink
          to="/blog"
          class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Blog
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Nuxt + Bundle Watch',
  meta: [
    { name: 'description', content: 'Example Nuxt app with Bundle Watch' },
  ],
});
</script>

<style scoped>
/* Tailwind classes work via Nuxt's built-in Tailwind support */
</style>

