<template>
  <div class="container">
    <h1>📦 Bundle Watch + Nuxt</h1>
    <p class="time">{{ formattedTime }}</p>
    <p class="description">{{ data }}</p>
    <div class="card">
      <p>This Nuxt app uses Bundle Watch via the Vite plugin!</p>
      <p>Check <code>bundle-report/index.html</code> after building.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { format } from 'date-fns';
import axios from 'axios';

const time = ref(new Date());
const data = ref('Loading...');

const formattedTime = computed(() => format(time.value, 'PPpp'));

onMounted(() => {
  setInterval(() => {
    time.value = new Date();
  }, 1000);

  axios.get('https://api.github.com/repos/anthropics/claude-code')
    .then(res => data.value = res.data.description)
    .catch(() => data.value = 'Bundle Watch + Nuxt Example');
});
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #0f172a;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

h1 {
  font-size: 3rem;
  margin: 0 0 1rem;
}

.time {
  font-size: 1.5rem;
  margin: 0 0 2rem;
  color: #94a3b8;
}

.description {
  font-size: 1.1rem;
  color: #cbd5e1;
  margin-bottom: 2rem;
}

.card {
  background: #1e293b;
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #334155;
  max-width: 600px;
  text-align: center;
}

code {
  background: #0f172a;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}
</style>
