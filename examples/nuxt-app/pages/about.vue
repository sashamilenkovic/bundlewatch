<template>
  <div class="min-h-screen flex items-center justify-center bg-green-50">
    <div class="max-w-2xl p-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        About Bundle Watch
      </h1>
      <p class="text-lg text-gray-700 mb-4">
        Bundle Watch tracks your build metrics over time, helping you:
      </p>
      <ul class="list-disc list-inside space-y-2 text-gray-700">
        <li>Monitor bundle sizes</li>
        <li>Track performance trends</li>
        <li>Detect regressions early</li>
        <li>Optimize your builds</li>
      </ul>
      <NuxtLink
        to="/"
        class="inline-block mt-8 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        ← Back Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'About - Bundle Watch',
});
</script>

