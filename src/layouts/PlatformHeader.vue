<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppDialog from '../components/AppDialog.vue'
import { brandName } from '../branding.js'
import { homeLink, sections } from '../navigation.js'
import { demoAccount, demoUser, signOut } from '../mock/session.js'
import { demoUnit } from '../mock/platform.js'
import brandMark from '../assets/brand-mark.png'

defineProps({ dashboard: Boolean })
const route = useRoute()
const router = useRouter()
const profileOpen = ref(false)
const logoutOpen = ref(false)
const menu = ref(null)
const mainLinks = [homeLink, ...sections]

function closeMenu() {
  if (menu.value) menu.value.open = false
}

watch(() => route.fullPath, closeMenu)

function openProfile() {
  closeMenu()
  profileOpen.value = true
}

function confirmLogout() {
  closeMenu()
  logoutOpen.value = true
}

function leave() {
  logoutOpen.value = false
  signOut()
  router.replace({ name: 'login' })
}
</script>

<template>
  <header :class="['platform-header', dashboard ? 'dashboard-header' : 'management-header']">
    <RouterLink :to="{ name: 'home' }" class="platform-brand" :aria-label="brandName + '首页'">
      <img :src="brandMark" alt="" />
      <span>{{ brandName }}</span>
    </RouterLink>
    <nav class="platform-nav" aria-label="主导航">
      <RouterLink
        v-for="item in mainLinks"
        :key="item.name"
        :to="{ name: item.name }"
        :class="{ 'active-section': route.name === item.name || route.meta.section === item.name }"
      >{{ item.label }}</RouterLink>
    </nav>
    <details ref="menu" class="platform-account" @keydown.esc="closeMenu">
      <summary aria-label="用户菜单">
        <span class="account-avatar" aria-hidden="true">{{ demoUser }}</span>
        <span class="account-name">{{ demoAccount }}</span>
      </summary>
      <div class="account-dropdown">
        <button type="button" @click="openProfile">个人中心</button>
        <button type="button" @click="confirmLogout">退出登录</button>
      </div>
    </details>
  </header>

  <AppDialog v-model="profileOpen" title="个人中心" width="430px" light>
    <dl class="profile-fields">
      <div><dt>用户名</dt><dd>{{ demoAccount }}</dd></div>
      <div><dt>使用人</dt><dd>{{ demoUser }}</dd></div>
      <div><dt>所属组织</dt><dd>{{ demoUnit }}</dd></div>
    </dl>
  </AppDialog>
  <AppDialog v-model="logoutOpen" title="退出登录" width="420px" light>
    <p class="logout-text">确定退出登录？</p>
    <template #actions>
      <button type="button" class="mg-button" @click="logoutOpen = false">取消</button>
      <button type="button" class="mg-button primary" @click="leave">确定</button>
    </template>
  </AppDialog>
</template>

<style scoped>
.platform-header {
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: clamp(22px, 3vw, 52px);
  min-height: var(--platform-header-height);
  padding: 0 28px;
  background: var(--color-nav);
  color: #f7faff;
}
.dashboard-header { padding-inline: 36px; }
.platform-brand {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
  border-radius: var(--radius-control);
  font-size: 17px;
  font-weight: 700;
  white-space: nowrap;
}
.platform-brand img { width: 33px; height: 33px; }
.dashboard-header .platform-brand { font-size: 19px; }
.dashboard-header .platform-brand img { width: 38px; height: 38px; }
.platform-nav { display: flex; align-items: center; gap: 5px; }
.platform-nav a {
  display: grid;
  place-items: center;
  min-height: 40px;
  padding: 0 15px;
  border-radius: var(--radius-control);
  color: var(--color-nav-muted);
  font-size: 14px;
  font-weight: 550;
  white-space: nowrap;
}
.dashboard-header .platform-nav a { font-size: 16px; min-height: 42px; padding-inline: 18px; }
.platform-nav a:hover { color: #fff; background: rgb(255 255 255 / 7%); }
.platform-nav a.active-section { color: #fff; background: #283c57; }
.platform-header :is(a, summary):focus-visible { outline-color: #91b4ff; }
.platform-account { position: relative; margin-left: auto; }
.platform-account summary {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 0 7px;
  border-radius: var(--radius-control);
  list-style: none;
  cursor: pointer;
}
.platform-account summary:hover, .platform-account[open] summary { background: rgb(255 255 255 / 7%); }
.platform-account summary::-webkit-details-marker { display: none; }
.platform-account summary::after {
  content: '';
  width: 6px;
  height: 6px;
  margin: -3px 3px 0 2px;
  border: solid var(--color-nav-muted);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}
.account-avatar {
  display: grid;
  place-items: center;
  width: 31px;
  height: 31px;
  border-radius: 50%;
  background: #304b6b;
  color: #e8f2ff;
  font-size: 13px;
  font-weight: 650;
}
.account-name { font-family: var(--font-numbers); font-size: 14px; }
.account-dropdown {
  position: absolute;
  top: calc(100% + 7px);
  right: 0;
  min-width: 135px;
  padding: 5px;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-overlay);
}
.account-dropdown button { display: block; width: 100%; min-height: 40px; padding: 8px 12px; border-radius: 7px; text-align: left; }
.account-dropdown button:hover { color: var(--color-primary); background: var(--color-primary-soft); }
.profile-fields { padding: 24px; display: grid; gap: 16px; }
.profile-fields div { display: grid; grid-template-columns: 90px 1fr; }
.profile-fields dt { color: var(--color-muted); }
.logout-text { padding: 22px 24px; }

@media (max-width: 1023px) {
  .platform-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 8px; min-height: 0; padding: 7px 12px 9px; }
  .platform-header .platform-brand { font-size: 16px; gap: 7px; }
  .platform-header .platform-brand img { width: 29px; height: 29px; }
  .platform-nav { grid-column: 1 / -1; grid-row: 2; gap: 2px; }
  .platform-header .platform-nav a { flex: 1 1 auto; min-width: 0; min-height: 43px; padding: 0 5px; font-size: 13px; }
  .platform-account { grid-row: 1; grid-column: 2; }
  .account-name { display: none; }
}

@media (max-width: 359px) {
  .platform-header .platform-nav a { font-size: 12px; padding-inline: 3px; }
}
</style>
