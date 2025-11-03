<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0fdf4;">
    <div style="max-width: 42rem; padding: 2rem;">
      <h1 style="font-size: 2.5rem; font-weight: bold; color: #111827; margin-bottom: 1rem;">
        About Bundle Watch
      </h1>
      <p style="font-size: 1.125rem; color: #374151; margin-bottom: 1rem;">
        Bundle Watch tracks your build metrics over time, helping you:
      </p>
      <ul style="list-style: disc; padding-left: 2rem; margin-bottom: 2rem; color: #374151;">
        <li>Monitor bundle sizes</li>
        <li>Track performance trends</li>
        <li>Detect regressions early</li>
        <li>Optimize your builds</li>
      </ul>
      <NuxtLink
        to="/"
        style="display: inline-block; margin-top: 2rem; padding: 0.75rem 1.5rem; background: #10b981; color: white; border-radius: 0.5rem; text-decoration: none; transition: all 0.2s;"
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
