<template>
  <div class="prose">
    <ContentDoc path="/">
      <template #not-found>
        <div class="not-found">
          <h1>Document not found</h1>
          <p>
            The requested page is missing. Head back to
            <NuxtLink to="/">the docs home</NuxtLink> or pick another topic from the sidebar.
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
