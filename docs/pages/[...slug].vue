<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <div class="prose">
    <ContentDoc :path="route.path">
      <template #not-found>
        <div class="not-found">
          <h1>Document not found</h1>
          <p>
            We couldn't find that page. Try another link from the sidebar or
            <NuxtLink to="/">return to the docs home</NuxtLink>.
          </p>
        </div>
      </template>
    </ContentDoc>
  </div>
</template>

<style scoped>
.not-found {
  padding: 2rem;
  border: 1px dashed rgba(226, 232, 240, 0.4);
  border-radius: 0.75rem;
  background: rgba(15, 23, 42, 0.6);
}
</style>
