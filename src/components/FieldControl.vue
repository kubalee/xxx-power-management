<script setup>
const model = defineModel({ default: '' })
defineProps({
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  width: { type: String, default: '200px' },
  required: Boolean,
  disabled: Boolean,
})

function openDatePicker(event) {
  if (event.isTrusted) event.currentTarget.showPicker?.()
}
</script>

<template>
  <label class="mg-field" :style="{ '--field-width': width }">
    <span v-if="label" class="mg-field-label">{{ label }}</span>
    <select
      v-if="type === 'select'"
      v-model="model"
      class="mg-control mg-select"
      :class="{ 'empty-select': model === '', 'with-placeholder': placeholder }"
      :aria-label="label || placeholder"
      :required="required"
      :disabled="disabled"
    >
      <option value="">{{ placeholder || '全部' }}</option>
      <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
    </select>
    <span v-else-if="type === 'date'" class="mg-control date-control">
      <span v-if="!model" class="date-placeholder" aria-hidden="true">{{ placeholder }}</span>
      <input v-model="model" type="date" :required="required" :disabled="disabled" :class="{ 'empty-date': !model }" :aria-label="label || placeholder" @click="openDatePicker" />
    </span>
    <textarea
      v-else-if="type === 'textarea'"
      v-model="model"
      class="mg-control"
      :aria-label="label || placeholder"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
    ></textarea>
    <input
      v-else
      v-model="model"
      class="mg-control"
      :type="type"
      :aria-label="label || placeholder"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      autocomplete="off"
    />
  </label>
</template>

<style>
.mg-field { display: inline-flex; align-items: center; gap: 9px; min-width: 0; max-width: 100%; }
.mg-field-label { flex: none; color: var(--color-text); white-space: nowrap; font-size: 13px; font-weight: 550; }
.mg-control {
  width: var(--field-width);
  max-width: 100%;
  min-width: 0;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  padding: 0 12px;
  color: var(--color-text);
  background: var(--color-surface);
  font: 400 14px/1.4 var(--font-body);
}
.mg-control::placeholder { color: var(--color-placeholder); opacity: 1; }
.mg-control:hover:not(:disabled) { border-color: #b8c7da; }
.mg-control:focus, .mg-control:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
  outline: none;
}
.mg-control:disabled { background-color: var(--color-surface-alt); color: var(--color-muted); cursor: default; }
.mg-select {
  appearance: none;
  padding-right: 30px;
  cursor: pointer;
  background-image: linear-gradient(45deg, transparent 46%, #647891 47% 64%, transparent 65%),
    linear-gradient(-45deg, transparent 46%, #647891 47% 64%, transparent 65%);
  background-size: 5px 6px;
  background-position: right 17px center, right 12px center;
  background-repeat: no-repeat;
}
.mg-select.empty-select { color: var(--color-muted); }
.mg-select.with-placeholder.empty-select { color: var(--color-placeholder); }
.mg-select option { color: var(--color-text); }
textarea.mg-control { padding-block: 9px; height: 70px; min-height: 64px; resize: vertical; }
.date-control { position: relative; display: flex; padding: 0 10px 0 33px; }
.date-control::before {
  content: '\e78e';
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  font: 15px "Element Icons";
}
.date-control input { position: relative; width: 100%; min-width: 0; border: 0; background: transparent; outline: 0; }
.date-control input::-webkit-calendar-picker-indicator { opacity: 0; cursor: pointer; }
.date-control input.empty-date { color: transparent; }
.date-control input.empty-date:focus { color: var(--color-text); }
.date-placeholder { position: absolute; top: 50%; transform: translateY(-50%); left: 33px; color: var(--color-placeholder); pointer-events: none; }
.date-control:focus-within .date-placeholder { display: none; }

@media (max-width: 1023px) {
  .mg-controls .mg-field { width: 100%; }
  .mg-controls .mg-field-label { width: 74px; }
  .mg-control { flex: 1; min-height: 44px; }
}
</style>
