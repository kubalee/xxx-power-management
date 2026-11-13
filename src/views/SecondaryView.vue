<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppDialog from '../components/AppDialog.vue'
import ConfigWorkspace from '../components/ConfigWorkspace.vue'
import DataTable from '../components/DataTable.vue'
import FieldControl from '../components/FieldControl.vue'
import PagePagination from '../components/PagePagination.vue'
import StatusTabs from '../components/StatusTabs.vue'
import { demoUnit, includesText } from '../mock/platform.js'
import { deviceLogs, hazardAlerts, operationLogs, reportDateRange } from '../mock/secondary.js'
import { notify } from '../notifications.js'

const route = useRoute()
const screen = route.name
const title = route.meta.title
const report = screen === 'reports'
const environment = screen === 'environment-alarms'
const hazard = screen === 'hazard-alerts'
const logs = screen === 'logs'
const useTable = report || environment || hazard || logs
const defaultFilters = () => ({
  start: '', end: '', type: '', name: '', status: '', unit: '', level: '', imei: '',
  ...(report ? reportDateRange() : {}),
})
const filters = reactive(defaultFilters())
const applied = ref(defaultFilters())
const hazardStatus = ref('全部')
const logTab = ref('操作日志')
const page = ref(1)
const detail = ref(null)
const detailOpen = ref(false)
const pageSize = 10

const column = (key, label, width) => ({ key, label, width })
const reportColumns = [
  column('id', '报告id'), column('name', '报告名称'), column('type', '报告类型'),
  column('time', '报告生产时间'), column('actions', '操作'),
]
const environmentColumns = [
  column('unit', '单位名称'), column('type', '事件类型'), column('device', '报警设备', '10.25%'),
  column('time', '开始时间'), column('status', '处置状态'), column('comment', '处置意见'),
  column('actions', '操作'),
]
const hazardColumns = [
  column('unit', '单位名称'), { ...column('point', '监测点名称', '14%'), ellipsis: true },
  column('level', '隐患等级'), column('type', '隐患类型'), column('status', '处置状态'),
  column('time', '开始时间', '14%'), column('overdue', '逾期处置'), column('actions', '操作', '20%'),
]
const operationColumns = [
  column('operator', '操作用户', '11.5%'), column('platform', '操作平台', '14.1%'),
  column('content', '操作内容'), column('time', '操作时间', '14.1%'),
]
const deviceLogColumns = [
  column('operator', '操作用户', '11.5%'), column('imei', '操作设备', '14.1%'),
  column('content', '操作内容'), column('time', '操作时间', '14.1%'),
]
const columns = computed(() => {
  if (report) return reportColumns
  if (environment) return environmentColumns
  if (hazard) return hazardColumns
  return logTab.value === '操作日志' ? operationColumns : deviceLogColumns
})

const filtered = computed(() => {
  const criteria = report ? applied.value : filters
  const currentLogs = logTab.value === '操作日志' ? operationLogs : deviceLogs
  const source = hazard ? hazardAlerts : logs ? currentLogs : []
  return source.filter(row => {
    const date = row.time.slice(0, 10)
    return (!criteria.start || date >= criteria.start)
      && (!criteria.end || date <= criteria.end)
      && (!criteria.type || row.type === criteria.type)
      && (!criteria.name || includesText(row.name ?? '', criteria.name))
      && (!criteria.imei || logTab.value !== '设备日志' || includesText(row.imei ?? '', criteria.imei))
      && (!criteria.level || row.level === criteria.level)
      && (!criteria.unit || row.unit === criteria.unit)
      && (!criteria.status || row.status === criteria.status)
      && (!hazard || hazardStatus.value === '全部' || row.status === hazardStatus.value)
  })
})
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch([filters, hazardStatus, logTab], () => { page.value = 1 })

function searchReports() {
  applied.value = { ...filters }
  page.value = 1
  notify('查询完成，共 ' + filtered.value.length + ' 条')
}

function reset() {
  Object.assign(filters, defaultFilters())
  applied.value = defaultFilters()
  hazardStatus.value = '全部'
  page.value = 1
}

function inspect(row) {
  detail.value = row
  detailOpen.value = true
}
</script>

<template>
  <ConfigWorkspace v-if="!useTable" :screen="screen" :title="title" />

  <div v-else class="secondary-data" :class="screen">
    <section class="mg-card">
      <h1 class="mg-card-title">{{ title }}</h1>
      <div class="mg-card-body">
        <StatusTabs v-if="logs" v-model="logTab" :options="['操作日志', '设备日志']" label="日志类型" />

        <form class="mg-controls secondary-filters" @submit.prevent="report && searchReports()">
          <div class="date-range" :class="{ 'compact-range': hazard }">
            <span class="range-label">{{ report ? '起止时间：' : '起止时间' }}</span>
            <FieldControl v-model="filters.start" type="date" placeholder="开始时间" :width="hazard ? '175px' : '220px'" />
            <span class="range-separator" aria-hidden="true">-</span>
            <FieldControl v-model="filters.end" type="date" placeholder="结束时间" :width="hazard ? '175px' : '220px'" />
          </div>
          <template v-if="report">
            <FieldControl v-model="filters.type" label="报告类型：" type="select" :options="['安全评估报告']" />
            <FieldControl v-model="filters.name" label="报告名称：" placeholder="请输入报告名称" />
          </template>
          <template v-if="environment">
            <FieldControl v-model="filters.status" label="处置状态" type="select" :options="['已处置', '未处置']" />
            <FieldControl v-model="filters.type" label="事件类型" type="select" :options="['温度报警', '烟雾报警', '水浸报警']" />
            <FieldControl v-model="filters.unit" label="单位" type="select" placeholder="请选择" :options="[demoUnit]" width="236px" />
          </template>
          <template v-if="hazard">
            <FieldControl v-model="filters.level" label="隐患等级" type="select" :options="['早期风险', '一般风险']" width="158px" />
            <FieldControl v-model="filters.type" label="隐患类型" type="select" :options="['早期隐患', '设备故障隐患']" width="158px" />
          </template>
          <FieldControl
            v-if="logs && logTab === '设备日志'"
            v-model="filters.imei" label="设备IMEI" placeholder="请输入设备IMEI" width="220px"
          />
          <div v-if="!logs" class="filter-actions">
            <button v-if="report" type="submit" class="mg-button primary">查询</button>
            <button type="button" class="mg-button" @click="reset">重置</button>
          </div>
        </form>

        <p v-if="report" class="report-caption">监测点安全数据</p>
        <div v-if="environment" class="environment-caption">
          <p>查询结果</p>
          <ul aria-label="告警计数">
            <li>事件总数 <strong>{{ filtered.length }}</strong></li>
            <li>已处置 <strong>{{ filtered.filter(row => row.status === '已处置').length }}</strong></li>
            <li>未处置 <strong>{{ filtered.filter(row => row.status === '未处置').length }}</strong></li>
          </ul>
        </div>
        <StatusTabs
          v-if="hazard" v-model="hazardStatus" class="hazard-tabs"
          :options="['全部', '未处理', '已处理', '处理中']"
        />

        <div class="secondary-table">
          <DataTable :columns="columns" :rows="pageRows" :label="title" :min-width="report ? '680px' : '820px'">
            <template #cell-actions="{ row }">
              <template v-if="hazard">
                <button type="button" class="mg-link" @click="notify('同步成功')">同步</button>
                <button type="button" class="mg-link" @click="inspect(row)">查看</button>
              </template>
            </template>
          </DataTable>
        </div>
        <PagePagination v-model="page" :total="filtered.length" />
      </div>
    </section>

    <AppDialog v-model="detailOpen" title="隐患详情" light>
      <dl v-if="detail" class="hazard-detail">
        <template v-for="item in hazardColumns.slice(0, -1)" :key="item.key">
          <dt>{{ item.label }}</dt>
          <dd>{{ detail[item.key] }}</dd>
        </template>
      </dl>
      <template #actions><button class="mg-button" @click="detailOpen = false">关闭</button></template>
    </AppDialog>
  </div>
</template>

<style scoped>
.secondary-filters { gap: 10px 14px; }
.filter-actions { margin-left: auto; display: flex; flex-wrap: wrap; gap: 8px; }
.date-range { display: flex; align-items: center; gap: 6px; min-width: 0; }
.range-label { margin-right: 4px; color: var(--color-text); white-space: nowrap; }
.range-separator { color: var(--color-muted); }
.report-caption, .environment-caption { margin-top: 14px; }
.report-caption, .environment-caption > p { color: var(--color-text); font-weight: 600; }
.environment-caption ul { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.environment-caption li {
  padding: 4px 8px;
  border-radius: var(--radius-control);
  background: var(--color-canvas);
  color: var(--color-muted);
}
.environment-caption strong { margin-left: 4px; color: var(--color-primary); }
.environment-caption li:nth-child(2) { background: var(--color-positive-soft); color: var(--color-positive); }
.environment-caption li:nth-child(3) { background: var(--color-warning-soft); color: var(--color-warning); }
.environment-caption li:nth-child(n + 2) strong { color: inherit; }
.hazard-tabs, .logs .secondary-filters { margin-top: 14px; }
.secondary-table { margin: 12px 0; }
.logs :deep(.col-content) { text-align: left; }
.hazard-detail { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 10px 18px; padding: 12px 20px 18px; }
.hazard-detail dt { color: var(--color-muted); }
.hazard-detail dd { overflow-wrap: anywhere; }

@media (max-width: 1023px) {
  .secondary-filters { gap: 10px; }
  .date-range { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }
  .range-label { grid-column: 1 / -1; }
  .date-range :deep(.mg-control) { width: 100%; }
  .filter-actions { margin-left: 0; }
  .hazard-detail { padding-inline: 16px; gap: 12px; }
}
</style>
