<script setup>
const selected = defineModel({ type: String, required: true })
defineProps({
  label: { type: String, required: true },
  options: { type: Array, required: true },
})
</script>

<template>
  <div class="segment-tabs" role="group" :aria-label="label">
    <button
      v-for="option in options"
      :key="option"
      type="button"
      :aria-pressed="selected === option"
      @click="selected = option"
    >{{ option }}</button>
  </div>
</template>

<style scoped>
.segment-tabs {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 2px;
  padding: 3px;
  border-radius: 9px;
  background: #eff3f8;
}
.segment-tabs button {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 550;
  white-space: nowrap;
}
.segment-tabs button:hover { color: var(--color-primary); }
.segment-tabs button[aria-pressed="true"] {
  color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 1px 3px rgb(25 40 61 / 12%);
}

@media (max-width: 1023px) {
  .segment-tabs button { min-height: 36px; padding-inline: 8px; font-size: 12px; }
}
</style>
