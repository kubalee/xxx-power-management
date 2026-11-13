<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  minWidth: { type: String, default: '860px' },
  label: { type: String, default: '数据表' },
  empty: { type: String, default: '暂无数据' },
  pinActions: Boolean,
})
</script>

<template>
  <div class="mg-table-scroll" tabindex="0" :aria-label="label">
    <table class="mg-table" :class="{ 'pin-actions': pinActions }" :style="{ minWidth }">
      <colgroup>
        <col v-for="column in columns" :key="column.key" :style="{ width: column.width }" />
      </colgroup>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key" scope="col" :class="'col-' + column.key">
            <slot :name="'head-' + column.key">{{ column.label }}</slot>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td
            v-for="column in columns"
            :key="column.key"
            :class="['col-' + column.key, { ellipsis: column.ellipsis }]"
            :title="column.ellipsis ? String(row[column.key] ?? '') : undefined"
          >
            <slot :name="'cell-' + column.key" :row="row" :value="row[column.key]">{{ row[column.key] }}</slot>
          </td>
        </tr>
        <tr v-if="!rows.length"><td class="table-empty" :colspan="columns.length">{{ empty }}</td></tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.mg-table-scroll {
  overflow: auto;
  min-width: 0;
  max-width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 11px;
  scrollbar-width: thin;
  scrollbar-color: #b5c4d7 var(--color-surface-alt);
}
.mg-table { table-layout: fixed; width: 100%; border-collapse: separate; border-spacing: 0; }
.mg-table th, .mg-table td { text-align: left; padding: 11px 12px; border-bottom: 1px solid var(--color-border); }
.mg-table th { color: #3b5069; background: var(--color-surface-alt); font-size: 13px; font-weight: 650; min-height: 44px; }
.mg-table td { color: var(--color-text); background: var(--color-surface); line-height: 1.55; font-size: 14px; }
.mg-table tbody tr:last-child td { border-bottom: 0; }
.mg-table tbody tr:hover td { background: #f8fbff; }
.mg-table .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mg-table td.table-empty { padding: 38px 16px; text-align: center; color: var(--color-muted); }
.mg-table :is(.col-select, .col-count, .col-value, .col-circuits, .col-index) { text-align: center; }
.mg-table .col-actions { white-space: nowrap; }
.mg-table .col-actions button { margin-inline: 3px; }
@media (min-width: 1440px) {
  .mg-table.pin-actions .col-actions { position: sticky; right: 0; box-shadow: -1px 0 0 var(--color-border); z-index: 1; }
}

@media (max-width: 1023px) {
  .mg-table .col-actions button { min-height: 44px; padding-inline: 3px; }
}
</style>
