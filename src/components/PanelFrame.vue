<script setup>
defineProps({ title: { type: String, required: true } })
</script>

<template>
  <section class="panel-frame">
    <header class="panel-heading">
      <h2>{{ title }}</h2>
      <slot name="tools" />
    </header>
    <div class="panel-content"><slot /></div>
  </section>
</template>

<style scoped>
.panel-frame {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}
.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 20px 10px;
  min-height: 60px;
}
.panel-heading h2 { font: 650 18px/1.4 var(--title-font); }
.panel-content { flex: 1; min-width: 0; min-height: 0; padding: 0 20px 18px; }

@media (max-width: 1023px) {
  .panel-heading { padding: 12px 14px 8px; min-height: 54px; gap: 8px; }
  .panel-heading h2 { font-size: 15px; }
  .panel-content { padding: 0 14px 14px; }
}
</style>
