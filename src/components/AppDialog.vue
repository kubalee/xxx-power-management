<script setup>
import { onMounted, ref, watch } from 'vue'

const open = defineModel({ type: Boolean, required: true })
defineProps({
  title: { type: String, required: true },
  width: { type: String, default: '600px' },
  lightBackdrop: Boolean,
  light: Boolean,
})

const dialog = ref(null)

function syncDialog() {
  if (open.value && !dialog.value.open) dialog.value.showModal()
  if (!open.value && dialog.value.open) dialog.value.close()
}

onMounted(syncDialog)
watch(open, syncDialog, { flush: 'post' })
</script>

<template>
  <dialog
    ref="dialog"
    class="app-dialog"
    :class="{ 'light-backdrop': lightBackdrop, 'light-dialog': light }"
    :style="{ '--dialog-width': width }"
    :aria-label="title"
    @close="open = false"
    @click.self="open = false"
  >
    <div class="dialog-inner">
      <header class="dialog-header">
        <h2>{{ title }}</h2>
        <button type="button" class="dialog-close" aria-label="关闭" @click="open = false">
          <span aria-hidden="true"></span>
        </button>
      </header>
      <div class="dialog-body"><slot /></div>
      <footer v-if="$slots.actions" class="dialog-actions"><slot name="actions" /></footer>
    </div>
  </dialog>
</template>

<style scoped>
.app-dialog {
  width: min(var(--dialog-width), calc(100% - 32px));
  max-height: calc(100% - 32px);
  margin: auto;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 0;
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-overlay);
  overflow: auto;
  overscroll-behavior: contain;
}
.app-dialog::backdrop { background: rgb(17 34 56 / 52%); }
.app-dialog.light-backdrop::backdrop { background: rgb(17 34 56 / 42%); }
.dialog-header {
  position: sticky;
  top: 0;
  z-index: 2;
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 18px 10px 24px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.dialog-header h2 { font: 650 18px/1.4 var(--title-font); }
.dialog-close {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-control);
  color: var(--color-muted);
}
.dialog-close:hover { background: var(--color-surface-alt); color: var(--color-text); }
.dialog-close span::before { content: '\e6db'; font: 18px "Element Icons"; }
.dialog-actions {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  padding: 13px 22px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

@media (max-width: 1023px) {
  .app-dialog { width: min(var(--dialog-width), calc(100% - 24px)); max-height: calc(100% - 24px); }
  .dialog-header { padding-inline: 16px 9px; min-height: 54px; }
  .dialog-close { width: 44px; height: 44px; }
  .dialog-actions { padding-inline: 16px; }
}
</style>
