<template>
  <div style="min-height: 100vh; background: #eff6ff; padding: 3rem 0;">
    <div style="max-width: 56rem; margin: 0 auto; padding: 0 2rem;">
      <h1 style="font-size: 2.5rem; font-weight: bold; color: #111827; margin-bottom: 2rem;">Blog</h1>
      <div style="display: flex; flex-direction: column; gap: 1.5rem;">
        <article
          v-for="post in posts"
          :key="post.id"
          style="background: white; padding: 1.5rem; border-radius: 0.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
        >
          <h2 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 0.5rem;">
            {{ post.title }}
          </h2>
          <p style="color: #6b7280; font-size: 0.875rem;">{{ post.date }}</p>
        </article>
      </div>
      <NuxtLink
        to="/"
        style="display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; background: #3b82f6; color: white; border-radius: 0.5rem; text-decoration: none; transition: all 0.2s;"
      >
        ← Back Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const posts = [
  { id: 1, title: 'Getting Started with Bundle Watch', date: '2025-11-01' },
  { id: 2, title: 'Optimizing Your Bundle Size', date: '2025-11-02' },
  { id: 3, title: 'Advanced Bundle Analysis', date: '2025-11-03' },
];

useHead({
  title: 'Blog - Bundle Watch',
});
</script>
