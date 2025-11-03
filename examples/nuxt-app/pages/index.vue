<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb;">
    <div style="text-align: center; padding: 2rem;">
      <h1 style="font-size: 2.5rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">
        📦 Bundle Watch
      </h1>
      <p style="font-size: 1.125rem; color: #6b7280; margin-bottom: 2rem;">
        Nuxt 3 + Bundle Watch Example
      </p>
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <NuxtLink
          to="/about"
          style="padding: 0.75rem 1.5rem; background: #10b981; color: white; border-radius: 0.5rem; text-decoration: none; transition: all 0.2s;"
        >
          About Page
        </NuxtLink>
        <NuxtLink
          to="/blog"
          style="padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border-radius: 0.5rem; text-decoration: none; transition: all 0.2s;"
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
