<template>
  <div class="min-h-screen bg-blue-50 py-12">
    <div class="max-w-4xl mx-auto px-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-8">Blog</h1>
      <div class="space-y-6">
        <article
          v-for="post in posts"
          :key="post.id"
          class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
        >
          <h2 class="text-2xl font-semibold text-gray-900 mb-2">
            {{ post.title }}
          </h2>
          <p class="text-gray-600 text-sm">{{ post.date }}</p>
        </article>
      </div>
      <NuxtLink
        to="/"
        class="inline-block mt-8 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
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

