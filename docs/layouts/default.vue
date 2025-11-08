<script setup lang="ts">
const { data: navigation } = await useAsyncData('content-navigation', () => fetchContentNavigation());
const route = useRoute();
</script>

<template>
  <div class="layout">
    <header class="layout__header">
      <div class="brand">
        <span aria-hidden="true">📦</span>
        <div>
          <p class="brand__title">BundleWatch</p>
          <p class="brand__subtitle">Docs &amp; Guides</p>
        </div>
      </div>
      <nav class="header-nav">
        <NuxtLink to="/getting-started">Getting Started</NuxtLink>
        <NuxtLink to="/storage">Git Storage</NuxtLink>
        <a href="https://github.com/sashamilenkovic/bundlewatch" target="_blank" rel="noreferrer">GitHub ↗</a>
      </nav>
    </header>

    <div class="layout__body">
      <aside class="sidebar">
        <p class="sidebar__label">Documentation</p>
        <ul class="sidebar__list">
          <li v-for="section in navigation" :key="section._path">
            <NuxtLink
              :to="section._path"
              class="sidebar__link"
              :class="{ 'is-active': route.path === section._path }"
            >
              <div>
                <p class="sidebar__title">{{ section.title }}</p>
                <p v-if="section.description" class="sidebar__description">{{ section.description }}</p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </aside>

      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background: radial-gradient(circle at top, rgba(14, 165, 233, 0.15), transparent 45%), #020617;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
}

.layout__header {
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  backdrop-filter: blur(8px);
  background: rgba(2, 6, 23, 0.9);
  z-index: 10;
}

.brand {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.brand span {
  font-size: 1.5rem;
}

.brand__title {
  font-weight: 600;
  font-size: 1.1rem;
}

.brand__subtitle {
  font-size: 0.85rem;
  color: #94a3b8;
}

.header-nav {
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
}

.header-nav a {
  color: inherit;
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  transition: background 0.2s;
}

.header-nav a:hover {
  background: rgba(14, 165, 233, 0.2);
}

.layout__body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  padding: 2rem;
  flex: 1;
}

.sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding-right: 1.5rem;
}

.sidebar__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-bottom: 1rem;
}

.sidebar__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar__link {
  display: block;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  text-decoration: none;
  color: inherit;
  border: 1px solid transparent;
  transition: border 0.2s, background 0.2s;
}

.sidebar__link:hover {
  border-color: rgba(148, 163, 184, 0.4);
}

.sidebar__link.is-active {
  border-color: rgba(14, 165, 233, 0.6);
  background: rgba(14, 165, 233, 0.08);
}

.sidebar__title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.sidebar__description {
  font-size: 0.85rem;
  color: #94a3b8;
}

.content {
  background: rgba(2, 6, 23, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 20px 40px -24px rgba(2, 6, 23, 1);
}

@media (max-width: 1024px) {
  .layout__body {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    padding-bottom: 1.5rem;
  }
}
</style>
