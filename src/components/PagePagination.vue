<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  total: { type: Number, required: true },
  sizes: { type: Array, default: () => [] },
})
const page = defineModel({ type: Number, required: true })
const size = defineModel('size', { type: Number, default: 10 })
const pages = computed(() => Math.max(1, Math.ceil(props.total / size.value)))
const numbered = computed(() => {
  const first = Math.max(1, Math.min(page.value - 2, pages.value - 4))
  return Array.from({ length: Math.min(5, pages.value) }, (_, index) => first + index)
})

watch(pages, (count) => { if (page.value > count) page.value = count })
watch(size, () => { page.value = 1 })

function jump(event) {
  const target = Math.trunc(Number(event.target.value)) || 1
  page.value = Math.min(pages.value, Math.max(1, target))
  event.target.value = page.value
}
</script>

<template>
  <nav class="mg-pagination" aria-label="分页">
    <span>共 {{ total }} 条</span>
    <select v-if="sizes.length" v-model.number="size" aria-label="每页条数">
      <option v-for="option in sizes" :key="option" :value="option">{{ option }}条/页</option>
    </select>
    <button type="button" aria-label="上一页" :disabled="page === 1" @click="page--">‹</button>
    <button
      v-for="number in numbered"
      :key="number"
      type="button"
      :aria-current="page === number ? 'page' : undefined"
      @click="page = number"
    >{{ number }}</button>
    <button type="button" aria-label="下一页" :disabled="page === pages" @click="page++">›</button>
    <label>前往 <input type="number" min="1" :max="pages" :value="page" aria-label="页码" @change="jump" /> 页</label>
  </nav>
</template>

<style scoped>
.mg-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; color: var(--color-muted); font-size: 13px; }
.mg-pagination button {
  width: 34px;
  height: 34px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 650;
}
.mg-pagination button:hover:not(:disabled) { background: var(--color-surface-alt); }
.mg-pagination button[aria-current="page"] { border-color: var(--color-primary); color: #fff; background: var(--color-primary); }
.mg-pagination label { margin-left: 8px; white-space: nowrap; }
.mg-pagination input, .mg-pagination select {
  min-height: 34px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-text);
  text-align: center;
}
.mg-pagination input { width: 50px; appearance: textfield; }
.mg-pagination input::-webkit-inner-spin-button, .mg-pagination input::-webkit-outer-spin-button { appearance: none; }
.mg-pagination select { width: 94px; padding-inline: 5px; }

@media (max-width: 1023px) {
  .mg-pagination { justify-content: flex-start; gap: 6px; }
  .mg-pagination button, .mg-pagination input, .mg-pagination select { min-height: 40px; }
  .mg-pagination label { margin-left: 0; }
}
</style>
