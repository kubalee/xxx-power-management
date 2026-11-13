<script setup>
const selected = defineModel({ type: String, required: true })
defineProps({ options: { type: Array, required: true }, label: { type: String, default: '状态筛选' } })
</script>

<template>
  <div class="mg-tabs" role="group" :aria-label="label">
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
.mg-tabs { display: flex; flex-wrap: wrap; gap: 4px; padding-bottom: 10px; }
.mg-tabs button {
  min-height: 35px;
  padding: 0 13px;
  border-radius: var(--radius-control);
  color: var(--color-muted);
  font-size: 13px;
  font-weight: 550;
  white-space: nowrap;
}
.mg-tabs button:hover { background: var(--color-surface-alt); }
.mg-tabs button[aria-pressed="true"] { color: var(--color-primary); background: var(--color-primary-soft); }

@media (max-width: 1023px) {
  .mg-tabs button { min-height: 42px; padding-inline: 9px; }
}
</style>
