import { createRouter, createWebHistory } from 'vue-router'
import { hasSession } from './mock/session.js'
import { homeLink, sections } from './navigation.js'

const managementViews = {
  monitor: () => import('./views/MonitorView.vue'),
  'monitor-data': () => import('./views/MonitorView.vue'),
  alarms: () => import('./views/AlarmsView.vue'),
  devices: () => import('./views/DevicesView.vue'),
  maintenance: () => import('./views/DevicesView.vue'),
  settings: () => import('./views/UsersView.vue'),
  'energy-monitoring': () => import('./views/EnergyView.vue'),
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'login' } },
    {
      path: '/newlogin',
      name: 'login',
      component: () => import('./views/LoginView.vue'),
    },
    {
      path: '/',
      component: () => import('./layouts/PlatformLayout.vue'),
      meta: { requiresSession: true },
      children: [
        {
          path: homeLink.path,
          name: homeLink.name,
          component: () => import('./views/HomeView.vue'),
        },
        ...sections.flatMap((section) => section.pages.map((page) => ({
          path: page.path,
          name: page.name,
          meta: { section: section.name, title: page.label },
          component: managementViews[page.name] ?? (() => import('./views/SecondaryView.vue')),
        }))),
        {
          path: '/stationDetail',
          name: 'station-detail',
          meta: { section: 'monitor', nav: 'monitor', title: '监测点详情' },
          component: managementViews.monitor,
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: { name: 'login' } },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  if (to.meta.requiresSession && !hasSession()) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && hasSession()) return { name: 'home' }
})
