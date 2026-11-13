<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import PlatformHeader from './PlatformHeader.vue'
import { sections } from '../navigation.js'
import { notification } from '../notifications.js'
import '../styles/management.css'

const route = useRoute()
const section = computed(() => sections.find((item) => item.name === route.meta.section))
const viewKey = computed(() => ['monitor', 'monitor-data', 'station-detail'].includes(route.name)
  ? 'monitor-workspace'
  : route.name)
const workspace = ref(null)

watch(() => route.name, () => workspace.value?.scrollTo({ top: 0 }), { flush: 'post' })
</script>

<template>
  <div :class="section ? 'management' : 'dashboard'">
    <PlatformHeader :dashboard="!section" />
    <div v-if="section" ref="workspace" class="management-layout">
      <nav class="management-sidebar" :aria-label="section.label + '菜单'">
        <RouterLink
          v-for="item in section.pages"
          :key="item.name"
          :to="{ name: item.name }"
          :class="{ 'router-link-exact-active': route.meta.nav === item.name }"
        >
          <span class="element-icon" aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <main class="management-main"><RouterView :key="viewKey" /></main>
    </div>
    <RouterView v-else />
    <div v-if="notification" class="platform-notification" :data-tone="notification.tone" role="status">
      {{ notification.message }}
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  --platform-header-height: 72px;
  min-height: var(--stage-height);
  background: var(--color-canvas);
}
.management { min-height: var(--stage-height); background: var(--color-canvas); }
.management-layout {
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  min-height: calc(var(--stage-height) - var(--platform-header-height));
}
.management-sidebar {
  padding: 18px 12px;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface);
}
.management-sidebar a {
  display: flex;
  min-height: 45px;
  align-items: center;
  gap: 10px;
  padding: 7px 12px;
  border-radius: var(--radius-control);
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 550;
}
.management-sidebar a + a { margin-top: 3px; }
.management-sidebar .element-icon { flex: none; font-size: 17px; opacity: .7; }
.management-sidebar a.router-link-exact-active { background: var(--color-primary-soft); color: var(--color-primary); font-weight: 650; }
.management-sidebar a.router-link-exact-active .element-icon { opacity: 1; }
.management-sidebar a:hover:not(.router-link-exact-active) { background: var(--color-surface-alt); color: var(--color-text); }
.management-main { padding: 24px 26px 30px; min-width: 0; }
.platform-notification {
  position: fixed;
  z-index: 25;
  top: 16px;
  right: 20px;
  width: min(350px, calc(100% - 40px));
  padding: 14px 16px;
  border: 1px solid #cce8df;
  border-radius: 12px;
  color: var(--color-positive);
  background: var(--color-positive-soft);
  box-shadow: var(--shadow-overlay);
}
.platform-notification[data-tone="warning"] { color: var(--color-warning); background: var(--color-warning-soft); border-color: #f4ddc6; }

@media (min-width: 1024px) {
  .management-layout {
    height: calc(var(--stage-height) - var(--platform-header-height));
    overflow: auto;
    scrollbar-width: thin;
    scrollbar-color: #b5c4d7 var(--color-canvas);
  }
  .management-sidebar {
    position: sticky;
    top: 0;
    align-self: start;
    min-height: calc(var(--stage-height) - var(--platform-header-height));
  }
}
@media (max-width: 1023px) {
  .management-layout { display: flex; flex-direction: column; min-height: auto; }
  .management-sidebar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 7px 12px;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
  .management-sidebar a { flex: 1 1 auto; justify-content: center; gap: 6px; min-height: 42px; padding: 5px 7px; font-size: 13px; }
  .management-sidebar a + a { margin-top: 0; }
  .management-sidebar .element-icon { font-size: 14px; }
  .management-main { padding: 13px 12px 24px; }
}
</style>
