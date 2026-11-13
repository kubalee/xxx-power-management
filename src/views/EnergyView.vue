<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import AppDialog from '../components/AppDialog.vue'
import ChartView from '../components/ChartView.vue'
import FieldControl from '../components/FieldControl.vue'
import StatusTabs from '../components/StatusTabs.vue'
import { downloadCsv } from '../mock/csv.js'
import { demoPointName, points } from '../mock/platform.js'
import { notify } from '../notifications.js'

const period = ref('日')
const sharePeriod = ref('周')
const day = ref('2026-11-11')
const queriedDay = ref(day.value)
const reportOpen = ref(false)
const reportDate = ref(day.value)
const reportType = ref('月')
const energyPage = ref(null)
const chartTheme = shallowRef(null)

onMounted(() => {
  const styles = getComputedStyle(energyPage.value)
  // Canvas charts need resolved colors from the same theme as the surrounding UI.
  chartTheme.value = {
    primary: styles.getPropertyValue('--color-primary').trim(),
    primarySoft: styles.getPropertyValue('--color-primary-soft').trim(),
    muted: styles.getPropertyValue('--color-muted').trim(),
    border: styles.getPropertyValue('--color-border').trim(),
  }
})

const summary = [
  { current: '今日用电(kwh)', previous: '昨日用电(kwh)', values: ['0.02', '0'], change: '100 %' },
  { current: '本周用电(kwh)', previous: '上周用电(kwh)', values: ['0.66', '0.04'], change: '1584.62 %' },
  { current: '本月用电(kwh)', previous: '上月用电(kwh)', values: ['2.12', '2.22'], change: '-4.55 %' },
]
const pointName = computed(() => points[0]?.name ?? demoPointName)
const shareValue = computed(() => sharePeriod.value === '周' ? 1.9 : 2.12)
const trend = computed(() => {
  const { primary, primarySoft, muted, border } = chartTheme.value
  const daily = period.value === '日'
  const monthly = period.value === '月'
  const size = daily ? 24 : monthly ? 30 : 12
  const labels = Array.from({ length: size }, (_, index) => daily ? String(index).padStart(2, '0') + ':00' : String(index + 1) + (monthly ? '日' : '月'))
  const peak = queriedDay.value === '2026-11-11' ? 8 : Number(queriedDay.value.slice(-2)) % 24
  const values = labels.map((_, index) => daily ? (index === peak ? .02 : 0) : Math.round((index * 13 % 11 + 3) * (monthly ? 1 : 5)) / 100)
  return {
    animation: false,
    textStyle: { color: muted },
    tooltip: { trigger: 'axis', confine: true },
    grid: { left: 52, right: 20, top: 16, bottom: 32, outerBoundsMode: 'none' },
    xAxis: {
      type: 'category', data: labels, axisLine: { lineStyle: { color: border } },
      axisTick: { show: false }, axisLabel: { color: muted, hideOverlap: true },
    },
    yAxis: { type: 'value', axisLabel: { color: muted }, splitLine: { lineStyle: { color: border } } },
    series: [{
      name: '用电量(kwh)', type: 'line', data: values, smooth: true, showSymbol: false,
      itemStyle: { color: primary }, lineStyle: { color: primary, width: 2 },
      areaStyle: { color: primarySoft, opacity: .85 },
    }],
    media: [{ query: { maxWidth: 500 }, option: { grid: { left: 38, right: 16 }, xAxis: { axisLabel: { interval: 3 } } } }],
  }
})
const share = computed(() => ({
  animation: false,
  tooltip: { trigger: 'item', confine: true, formatter: '{b}：{d}%' },
  series: [{
    type: 'pie', radius: ['56%', '78%'], label: { show: false },
    data: [{ value: shareValue.value, name: pointName.value, itemStyle: { color: chartTheme.value.primary } }],
  }],
}))

function query() {
  if (!day.value) {
    notify('请选择查询日期', 'warning')
    return
  }
  queriedDay.value = day.value
  notify('查询完成')
}

function makeReport() {
  if (!reportDate.value) {
    notify('请选择报表日期', 'warning')
    return
  }
  const data = summary.map((item) => [item.current, item.values[0], item.previous, item.values[1]])
  downloadCsv('用电' + reportType.value + '报-' + reportDate.value + '.csv', ['统计项', '用电(kwh)', '对比项', '用电(kwh)'], data)
  reportOpen.value = false
  notify('报表已生成')
}
</script>

<template>
  <div ref="energyPage" class="energy-page">
    <nav class="mg-breadcrumb energy-crumb" aria-label="当前位置">
      <span>监测中心</span><span>/</span>能源监测
      <button type="button" class="mg-button primary" @click="reportOpen = true">生成报表</button>
    </nav>
    <section class="mg-card">
      <h1 class="mg-card-title">用电统计</h1>
      <div class="mg-card-body energy-summaries">
        <div v-for="item in summary" :key="item.current" class="energy-summary">
          <div>
            <p>{{ item.current }}</p>
            <div class="energy-value">
              <strong>{{ item.values[0] }}</strong>
              <small :class="{ down: item.change.startsWith('-') }">{{ item.change }}</small>
            </div>
          </div>
          <div><p>{{ item.previous }}</p><strong>{{ item.values[1] }}</strong></div>
        </div>
      </div>
    </section>
    <section class="mg-card">
      <h2 class="mg-card-title">用电趋势</h2>
      <div class="mg-card-body">
        <form class="energy-controls" @submit.prevent="query">
          <StatusTabs v-model="period" :options="['日', '月', '年']" label="用电趋势周期" />
          <FieldControl v-model="day" type="date" placeholder="查询日期" width="220px" />
          <button type="submit" class="mg-button primary">查询</button>
        </form>
        <ChartView v-if="chartTheme" class="energy-trend" :option="trend" label="用电趋势折线图" />
      </div>
    </section>
    <section class="mg-card">
      <h2 class="mg-card-title">用电占比</h2>
      <div class="mg-card-body">
        <StatusTabs v-model="sharePeriod" class="share-tabs" :options="['周', '月']" label="用电占比周期" />
        <div class="energy-pie">
          <ChartView v-if="chartTheme" class="energy-share-chart" :option="share" label="用电占比图" />
          <p class="energy-legend">
            <span class="energy-legend-dot" aria-hidden="true"></span>
            <span>{{ pointName }}</span>
            <strong>100%</strong>
            <span class="energy-legend-value">{{ shareValue }}</span>
          </p>
        </div>
      </div>
    </section>
  </div>

  <AppDialog v-model="reportOpen" title="生成报表" width="500px" light>
    <form id="energy-report" class="mg-form" @submit.prevent="makeReport">
      <FieldControl v-model="reportType" type="select" label="报表周期" :options="['日', '周', '月']" required />
      <FieldControl v-model="reportDate" type="date" label="报表日期" />
    </form>
    <template #actions>
      <button type="submit" form="energy-report" class="mg-button primary">生成</button>
      <button type="button" class="mg-button" @click="reportOpen = false">取消</button>
    </template>
  </AppDialog>
</template>

<style scoped>
.energy-crumb { margin-bottom: 12px; }
.energy-crumb .mg-button { margin-left: auto; }
.energy-summaries { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 246px), 1fr)); gap: 10px; }
.energy-summary {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
}
.energy-summary p { margin-bottom: 4px; color: var(--color-muted); font-size: 13px; }
.energy-value { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; }
.energy-summary strong { color: var(--color-text); font-size: 22px; font-weight: 600; font-variant-numeric: tabular-nums; }
.energy-value strong { color: var(--color-primary); }
.energy-summary small {
  padding: 2px 5px;
  border-radius: var(--radius-control);
  background: var(--color-warning-soft);
  color: var(--color-warning);
  font-size: 11px;
  white-space: nowrap;
}
.energy-summary small.down { background: var(--color-positive-soft); color: var(--color-positive); }
.energy-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.energy-controls .mg-tabs { margin-right: auto; }
.energy-trend { height: 216px; margin-top: 12px; }
.energy-pie { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; }
.energy-pie .energy-share-chart { width: min(220px, 100%); height: 184px; }
.energy-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; color: var(--color-text); overflow-wrap: anywhere; }
.energy-legend-dot { flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--color-primary); }
.energy-legend-value { color: var(--color-muted); }

@media (max-width: 1023px) {
  .energy-controls .mg-tabs { width: 100%; }
  .energy-controls .mg-field { flex: 1; min-width: 0; }
  .energy-controls :deep(.mg-control) { width: 100%; }
  .energy-trend { height: 206px; }
  .energy-pie { flex-direction: column; gap: 4px; }
  .energy-legend { justify-content: center; }
}
</style>
