<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isDashboard = computed(() => route.name === 'home')
const isLogin = computed(() => route.name === 'login')
const viewport = ref(readViewport())
let observer

function readViewport() {
  return {
    width: document.documentElement.clientWidth,
    windowWidth: window.innerWidth,
    height: window.innerHeight,
  }
}

function updateViewport() {
  viewport.value = readViewport()
}

onMounted(() => {
  observer = new ResizeObserver(updateViewport)
  observer.observe(document.documentElement)
  window.addEventListener('resize', updateViewport)
})
onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('resize', updateViewport)
})

const stageStyle = computed(() => {
  const { width, windowWidth, height } = viewport.value
  if (windowWidth < 1024 || (!isDashboard.value && !isLogin.value)) return {}

  const scale = Math.min(width / 1920, Math.max(height, 576) / 1080)
  return {
    '--desktop-scale': scale,
    '--stage-width': (isDashboard.value ? width / scale : 1920) + 'px',
    '--stage-height': (isDashboard.value ? Math.max(1080, height / scale) : 1080) + 'px',
  }
})
</script>

<template>
  <div :class="{ 'login-viewport': isLogin }">
    <div class="app-stage" :style="stageStyle">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {
  .login-viewport {
    display: grid;
    min-height: 100svh;
    place-items: center;
  }
}
</style>
