<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppDialog from '../components/AppDialog.vue'
import DataTable from '../components/DataTable.vue'
import FieldControl from '../components/FieldControl.vue'
import PagePagination from '../components/PagePagination.vue'
import StatusTabs from '../components/StatusTabs.vue'
import { alarms, demoUnit, deviceById, pointById } from '../mock/platform.js'
import { notify } from '../notifications.js'

const route = useRoute()
const router = useRouter()
const filters = reactive({ start: '', end: '', type: '', unit: '' })
const status = ref('全部')
const page = ref(1)
const historyPage = ref(1)
const active = ref(null)
const historyOpen = ref(false)
const processOpen = ref(false)
const draft = reactive({ status: '', mark: '', remark: '' })
const statuses = ['全部', '未处理', '已处理', '处理中', '已排查']
const types = ['欠压故障', '过压故障', '过流故障', '温度报警', '剩余电流故障']
const columns = [
  { key: 'unit', label: '单位名称', width: '8.2%' },
  { key: 'point', label: '监测点名称', width: '8.5%', ellipsis: true },
  { key: 'type', label: '事件类型', width: '8%' },
  { key: 'name', label: '事件名称', width: '10.5%' },
  { key: 'imei', label: '告警设备imei', width: '8%', ellipsis: true },
  { key: 'value', label: '告警值', width: '5.4%' },
  { key: 'time', label: '最新告警时间', width: '8%' },
  { key: 'status', label: '事件状态', width: '8%' },
  { key: 'count', label: '事件总数', width: '7.5%' },
  { key: 'mark', label: '事件标记', width: '8%' },
  { key: 'actions', label: '操作' },
]
const historyColumns = [{ key: 'time', label: '告警时间' }, { key: 'value', label: '告警值' }]
const records = computed(() => alarms
  .map((alarm) => ({
    ...alarm,
    unit: pointById(alarm.pointId)?.unit ?? demoUnit,
    point: pointById(alarm.pointId)?.name ?? alarm.pointName,
    imei: deviceById(alarm.deviceId)?.imei ?? alarm.imei,
  }))
  .filter((alarm) => {
    const day = alarm.time.slice(0, 10)
    return (status.value === '全部' || alarm.status === status.value)
      && (!filters.type || filters.type === alarm.type)
      && (!filters.unit || filters.unit === alarm.unit)
      && (!filters.start || day >= filters.start)
      && (!filters.end || day <= filters.end)
  }))
const rows = computed(() => records.value.slice((page.value - 1) * 10, page.value * 10))
const history = computed(() => active.value?.history ?? [])

watch([filters, status], () => { page.value = 1 })
watch(() => route.query.record, (id) => {
  const alarm = alarms.find((item) => item.id === id)
  if (alarm) viewHistory(alarm)
}, { immediate: true })
watch(historyOpen, (open) => {
  if (!open && route.query.record) router.replace({ name: 'alarms' })
})

function reset() {
  Object.assign(filters, { start: '', end: '', type: '', unit: '' })
  status.value = '全部'
  page.value = 1
}

function viewHistory(row) {
  active.value = alarms.find((alarm) => alarm.id === row.id)
  historyPage.value = 1
  historyOpen.value = true
}

function openProcess(row) {
  active.value = alarms.find((alarm) => alarm.id === row.id)
  Object.assign(draft, { status: active.value.status, mark: active.value.mark, remark: active.value.remark })
  processOpen.value = true
}

function saveProcess() {
  Object.assign(active.value, draft, { dispositionSaved: true })
  processOpen.value = false
  notify('处置已保存')
}

function sync(row) {
  const alarm = alarms.find((item) => item.id === row.id)
  alarm.history = [{ id: alarm.id, time: alarm.time, value: alarm.value }]
  notify('告警同步成功')
}
</script>

<template>
  <section class="mg-card alarm-card">
    <h1 class="mg-card-title">用电告警</h1>
    <div class="mg-card-body alarm-body">
      <div class="mg-controls alarm-filters">
        <div class="date-range">
          <span class="mg-field-label">起止时间</span>
          <FieldControl v-model="filters.start" type="date" placeholder="开始时间" width="218px" />
          <span aria-hidden="true">-</span>
          <FieldControl v-model="filters.end" type="date" placeholder="结束时间" width="219px" />
        </div>
        <FieldControl v-model="filters.type" type="select" label="事件类型" :options="types" width="205px" />
        <FieldControl v-model="filters.unit" type="select" label="单位" placeholder="请选择" :options="[demoUnit]" width="238px" />
        <button type="button" class="mg-button reset" @click="reset">重置</button>
      </div>
      <StatusTabs v-model="status" :options="statuses" />
      <DataTable :columns="columns" :rows="rows" label="用电告警列表" min-width="1100px">
        <template #cell-time="{ value }"><time>{{ value.slice(0, 14) }}<br />{{ value.slice(14) }}</time></template>
        <template #cell-status="{ value }">
          <span :class="['alarm-status', { pending: value === '未处理', complete: value === '已处理' || value === '已排查' }]">{{ value }}</span>
        </template>
        <template #cell-actions="{ row }">
          <button type="button" class="mg-link" @click="viewHistory(row)">查看列表</button>
          <button type="button" class="mg-link" @click="openProcess(row)">处理</button>
          <button type="button" class="mg-link" @click="sync(row)">同步</button>
        </template>
      </DataTable>
      <PagePagination v-model="page" :total="records.length" />
    </div>
  </section>

  <AppDialog v-model="historyOpen" title="事件列表" width="960px" light class="history-dialog">
    <div v-if="active" class="alarm-history">
      <p><span>事件名称:{{ active.name }}</span><span>事件总数:{{ active.count }}</span></p>
      <DataTable :columns="historyColumns" :rows="history" min-width="0" label="告警事件记录" />
      <PagePagination v-model="historyPage" :total="history.length" />
    </div>
  </AppDialog>

  <AppDialog v-model="processOpen" title="告警处理" width="576px" light>
    <form v-if="active" id="alarm-process" class="mg-form process-form" @submit.prevent="saveProcess">
      <p>{{ active.name }}</p>
      <FieldControl v-model="draft.status" type="select" label="事件状态" :options="statuses.slice(1)" required />
      <FieldControl v-model="draft.mark" type="select" label="事件标记" placeholder="请选择" :options="['存在误报源', '现场异常']" />
      <FieldControl v-model="draft.remark" type="textarea" label="处置意见" placeholder="请输入处置意见" />
    </form>
    <template #actions>
      <button type="submit" form="alarm-process" class="mg-button primary">确定</button>
      <button type="button" class="mg-button" @click="processOpen = false">取消</button>
    </template>
  </AppDialog>
</template>

<style scoped>
.alarm-body { display: flex; flex-direction: column; gap: 12px; }
.date-range { display: flex; align-items: center; gap: 5px; }
.date-range > .mg-field-label { margin-right: 7px; }
.date-range > span[aria-hidden] { color: var(--color-muted); }
.alarm-body :deep(.col-time) { padding-inline: 6px; }
.alarm-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-control);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.alarm-status.pending { background: var(--color-warning-soft); color: var(--color-warning); }
.alarm-status.complete { background: var(--color-positive-soft); color: var(--color-positive); }
.history-dialog :deep(.dialog-header) { justify-content: flex-start; padding-left: 20px; }
.alarm-history { display: flex; flex-direction: column; gap: 12px; padding: 14px 20px 18px; }
.alarm-history p { display: flex; flex-wrap: wrap; gap: 6px 16px; color: var(--color-muted); }
.alarm-history > .mg-table-scroll { max-height: 320px; }
.process-form > p { margin-bottom: 12px; color: var(--color-text); font-weight: 600; }

@media (max-width: 1023px) {
  .date-range { display: grid; width: 100%; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }
  .date-range > .mg-field-label { grid-column: 1 / -1; }
  .alarm-history { padding-inline: 14px; }
}
</style>
