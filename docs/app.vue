<script setup lang="ts">
const { data: navigation } = await useAsyncData('content-navigation', () => fetchContentNavigation());
const route = useRoute();
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <div class="topbar__inner">
        <NuxtLink to="/" class="logo">
          <span aria-hidden="true">📦</span>
          <div>
            <p class="logo__title">BundleWatch Docs</p>
            <p class="logo__subtitle">Track bundles over time</p>
          </div>
        </NuxtLink>

        <nav class="topbar__nav">
          <NuxtLink to="/getting-started">Getting Started</NuxtLink>
          <NuxtLink to="/storage">Git Storage</NuxtLink>
          <NuxtLink to="/examples">Examples</NuxtLink>
          <a href="https://github.com/sashamilenkovic/bundlewatch" target="_blank" rel="noreferrer">GitHub ↗</a>
        </nav>
      </div>
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
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  display: flex;
  flex-direction: column;
}

.topbar {
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.topbar__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.logo span {
  font-size: 1.5rem;
}

.logo__title {
  font-weight: 600;
  font-size: 1.1rem;
}

.logo__subtitle {
  font-size: 0.85rem;
  color: #475569;
}

.topbar__nav {
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
}

.topbar__nav a {
  color: inherit;
  text-decoration: none;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  transition: background 0.2s;
}

.topbar__nav a:hover,
.topbar__nav a:focus-visible {
  background: rgba(99, 102, 241, 0.12);
}

.layout__body {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  padding: 2rem clamp(1rem, 4vw, 3rem);
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.sidebar {
  border-right: 1px solid #e2e8f0;
  padding-right: 1.5rem;
}

.sidebar__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
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
  border-color: rgba(148, 163, 184, 0.5);
  background: rgba(148, 163, 184, 0.08);
}

.sidebar__link.is-active {
  border-color: rgba(99, 102, 241, 0.6);
  background: rgba(99, 102, 241, 0.1);
}

.sidebar__title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.sidebar__description {
  font-size: 0.85rem;
  color: #64748b;
}

.content {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  box-shadow: 0 20px 40px -24px rgba(15, 23, 42, 0.2);
  min-height: calc(100vh - 200px);
  width: min(100%, 900px);
  margin-inline: auto;
}

@media (max-width: 1024px) {
  .layout__body {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 1.5rem;
  }

  .topbar__inner {
    flex-direction: column;
    gap: 1rem;
  }

  .topbar__nav {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
