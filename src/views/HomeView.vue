<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import PanelFrame from '../components/PanelFrame.vue'
import SegmentTabs from '../components/SegmentTabs.vue'
import ChartView from '../components/ChartView.vue'
import { abnormalRing, alarmColors, energyHistory, energyShare, hazardHistory } from '../charts/home.js'
import { alarms, devices, pointById, points } from '../mock/platform.js'
import { icons } from '../icons.js'

const router = useRouter()
const abnormalPeriod = ref('当日')
const sharePeriod = ref('近30天')
const energyPeriod = ref('当日')
const types = ['欠压故障', '过流故障', '过压故障', '温度报警', '剩余电流故障']
const overviewDate = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Shanghai',
}).format(new Date())
const formatNumber = new Intl.NumberFormat('zh-CN').format

const alarmCounts = computed(() => types.map(type => {
  if (abnormalPeriod.value !== '全部') return 0
  return alarms.filter(alarm => alarm.type === type).reduce((total, alarm) => total + alarm.count, 0)
}))
const total = computed(() => alarmCounts.value.reduce((sum, value) => sum + value, 0))
const pending = computed(() => alarms.filter(alarm => alarm.home && alarm.status !== '已处理'))
const summaries = computed(() => [
  {
    title: '隐患统计', tone: 'warning', icon: icons.hazard, unit: '个',
    values: [0, 0], descriptions: ['待处理', '当日新增'],
  },
  {
    title: '告警统计', tone: 'danger', icon: icons.alarm, unit: '个',
    values: [alarms.reduce((sum, alarm) => sum + (alarm.dispositionSaved && alarm.status === '已处理' ? 0 : alarm.count), 0), 0],
    descriptions: ['待处理', '当日新增'],
  },
  {
    title: '能耗统计', tone: 'positive', icon: icons.energy, unit: '度',
    values: ['0.66', '2.12'], descriptions: ['本周用电 1584.62%', '本月用电 -4.55%'],
  },
  {
    title: '设备统计', tone: 'primary', icon: icons.device, unit: '台',
    values: [devices.filter(device => device.online === '在线').length, devices.filter(device => device.online === '离线').length],
    descriptions: ['在线设备', '离线设备'],
  },
])

const shareName = computed(() => points[0]?.name || '')
const ring = computed(() => abnormalRing(types, alarmCounts.value))
const share = computed(() => energyShare(sharePeriod.value === '近7天', shareName.value))
const usage = computed(() => energyHistory(energyPeriod.value === '当月'))
const energyTotals = computed(() => energyPeriod.value === '当月' ? ['2.12', '2.22'] : ['0.02', '0.14'])

function viewAlarm(alarm) {
  router.push({ name: 'alarms', query: { record: alarm.id } })
}
</script>

<template>
  <main class="home-grid">
    <header class="overview-heading">
      <h1>用电概览</h1>
      <time>{{ overviewDate }}</time>
    </header>

    <section class="summary-grid" aria-label="平台概况">
      <article v-for="card in summaries" :key="card.title" class="summary-card" :data-tone="card.tone">
        <header class="summary-heading">
          <span class="summary-icon element-icon" aria-hidden="true">{{ card.icon }}</span>
          <h2>{{ card.title }}</h2>
        </header>
        <div class="summary-metrics">
          <div v-for="(value, index) in card.values" :key="card.descriptions[index]" class="summary-metric">
            <p class="summary-value">{{ typeof value === 'number' ? formatNumber(value) : value }}<span>{{ card.unit }}</span></p>
            <p class="summary-description">{{ card.descriptions[index] }}</p>
          </div>
        </div>
      </article>
    </section>

    <div class="primary-grid">
      <PanelFrame class="usage-panel" title="能耗趋势">
        <template #tools>
          <SegmentTabs v-model="energyPeriod" label="能耗统计时间段" :options="['当日', '当月']" />
        </template>
        <div class="energy-content">
          <div class="energy-totals">
            <div v-for="(value, index) in energyTotals" :key="index" class="energy-total">
              <span class="chart-key" aria-hidden="true"></span>
              <p>{{ index === 0 ? '本期总耗能' : '上期总耗能' }} <strong>{{ value }}</strong><span class="energy-unit">度</span></p>
            </div>
          </div>
          <ChartView :option="usage" label="本期和上期能耗折线图" />
        </div>
      </PanelFrame>

      <div class="incident-grid">
        <PanelFrame title="报警待处置">
          <template #tools><span v-if="pending.length" class="pending-count" :aria-label="pending.length + ' 条待处置告警'">{{ pending.length }} 条</span></template>
          <div class="pending-list">
            <p v-if="!pending.length" class="pending-empty">暂无待处置告警</p>
            <button v-for="alarm in pending" :key="alarm.id" type="button" class="alarm-row" @click="viewAlarm(alarm)">
              <span class="alarm-dot" aria-hidden="true"></span>
              <span class="alarm-description">
                <strong>{{ alarm.name }}</strong>
                <span>{{ pointById(alarm.pointId)?.name ?? alarm.pointName }}</span>
              </span>
              <time>{{ alarm.time }}</time>
            </button>
          </div>
        </PanelFrame>
        <PanelFrame title="隐患待处置">
          <p class="pending-empty">暂无待处置隐患</p>
        </PanelFrame>
      </div>
    </div>

    <div class="detail-grid">
      <PanelFrame class="abnormal-panel" title="异常统计">
        <template #tools>
          <SegmentTabs v-model="abnormalPeriod" label="异常统计时间段" :options="['当日', '近七天', '全部']" />
        </template>
        <div class="abnormal-content">
          <div class="donut">
            <ChartView :option="ring" :label="'异常总数 ' + total" />
            <div class="donut-label" aria-hidden="true"><strong>{{ formatNumber(total) }}</strong><span>异常总数</span></div>
          </div>
          <ul class="abnormal-list">
            <li v-for="(type, index) in types" :key="type">
              <span class="chart-key" :style="{ background: alarmColors[index] }" aria-hidden="true"></span>
              <span>{{ type }}</span>
              <strong>{{ formatNumber(alarmCounts[index]) }}</strong>
            </li>
          </ul>
        </div>
      </PanelFrame>

      <PanelFrame class="share-panel" title="能耗占比">
        <template #tools>
          <SegmentTabs v-model="sharePeriod" label="能耗占比时间段" :options="['近7天', '近30天']" />
        </template>
        <div class="share-content">
          <div class="donut">
            <ChartView :option="share" :label="shareName ? shareName + '能耗占比 100%' : '暂无能耗数据'" />
            <div class="donut-label" aria-hidden="true">
              <strong>{{ shareName ? '100%' : '—' }}</strong>
              <span>用电占比</span>
            </div>
          </div>
          <p class="share-caption"><span v-if="shareName" class="chart-key" aria-hidden="true"></span>{{ shareName || '暂无能耗数据' }}</p>
        </div>
      </PanelFrame>

      <PanelFrame class="hazard-panel" title="隐患趋势">
        <ChartView :option="hazardHistory" label="隐患统计折线图" />
      </PanelFrame>
    </div>
  </main>
</template>

<style scoped>
.home-grid {
  display: grid;
  grid-template-rows: auto 137px minmax(0, 1.13fr) minmax(0, 1fr);
  gap: 20px;
  height: calc(var(--stage-height) - var(--platform-header-height));
  padding: 25px 36px 30px;
}
.overview-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.overview-heading h1 { font-size: 32px; font-weight: 700; line-height: 1.4; }
.overview-heading time { color: var(--color-muted); font-size: 15px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
.summary-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 13px 18px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}
.summary-heading { display: flex; align-items: center; gap: 9px; margin-bottom: 10px; }
.summary-heading h2 { color: var(--color-text); font-size: 16px; font-weight: 650; }
.summary-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 17px;
}
[data-tone="warning"] .summary-icon { color: var(--color-warning); background: var(--color-warning-soft); }
[data-tone="danger"] .summary-icon { color: var(--color-danger); background: var(--color-danger-soft); }
[data-tone="positive"] .summary-icon { color: var(--color-positive); background: var(--color-positive-soft); }
.summary-metrics { display: grid; grid-template-columns: 1.12fr 1fr; gap: 13px; }
.summary-metric { min-width: 0; }
.summary-metric + .summary-metric { padding-left: 12px; border-left: 1px solid var(--color-border); }
.summary-value { color: var(--color-text); font: 650 31px/1.17 var(--font-numbers); font-variant-numeric: tabular-nums; white-space: nowrap; }
.summary-value span { margin-left: 5px; color: var(--color-muted); font: 500 13px var(--font-body); }
.summary-description { margin-top: 4px; color: var(--color-muted); font-size: 13px; line-height: 1.4; }
.primary-grid, .detail-grid, .incident-grid { display: grid; gap: 18px; min-width: 0; min-height: 0; }
.primary-grid { grid-template-columns: minmax(0, 1.72fr) minmax(0, 1fr); }
.incident-grid { grid-template-rows: minmax(0, 1.62fr) minmax(0, 1fr); }
.detail-grid { grid-template-columns: minmax(0, 1.15fr) repeat(2, minmax(0, 1fr)); }
.energy-content { display: grid; grid-template-rows: auto minmax(0, 1fr); height: 100%; gap: 11px; }
.energy-totals { display: flex; flex-wrap: wrap; gap: 8px 24px; padding: 5px 4px 0; }
.energy-total { display: flex; align-items: center; gap: 7px; color: var(--color-muted); font-size: 13px; }
.energy-total strong { margin-left: 5px; color: var(--color-text); font: 650 18px var(--font-numbers); }
.energy-unit { margin-left: 3px; }
.chart-key { width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: var(--color-primary); }
.energy-total:nth-child(2) .chart-key, .share-caption .chart-key { background: var(--color-positive); }
.pending-count { padding: 4px 9px; border-radius: 6px; background: var(--color-warning-soft); color: var(--color-warning); font-size: 12px; }
.pending-list { height: 100%; overflow: auto; scrollbar-width: thin; scrollbar-color: #b5c4d7 var(--color-surface); }
.alarm-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  width: 100%;
  min-height: 57px;
  padding: 8px 9px 8px 1px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}
.alarm-row:last-child { border-bottom: 0; }
.alarm-row:hover { background: var(--color-surface-alt); }
.alarm-dot { width: 7px; height: 7px; border-radius: 50%; background: #cb7145; }
.alarm-description { display: grid; min-width: 0; gap: 3px; }
.alarm-description strong { font-size: 15px; font-weight: 650; }
.alarm-description span, .alarm-row time { color: var(--color-muted); font-size: 12px; }
.alarm-description span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.alarm-row time { font-family: var(--font-numbers); white-space: nowrap; }
.pending-empty { display: grid; place-items: center; height: 100%; min-height: 35px; color: var(--color-muted); font-size: 14px; }
.abnormal-content { display: grid; grid-template-columns: minmax(0, 1fr) minmax(125px, 1fr); gap: 16px; height: 100%; }
.donut { position: relative; min-width: 0; min-height: 0; }
.donut-label { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 4px; pointer-events: none; }
.donut-label strong { font: 650 30px/1.05 var(--font-numbers); }
.donut-label span { color: var(--color-muted); font-size: 13px; }
.abnormal-list { align-self: center; display: grid; gap: 12px; min-width: 0; }
.abnormal-list li { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; align-items: center; gap: 8px; color: var(--color-muted); font-size: 14px; }
.abnormal-list strong { color: var(--color-text); font: 600 15px var(--font-numbers); font-variant-numeric: tabular-nums; }
.share-content { display: grid; grid-template-rows: minmax(0, 1fr) auto; height: 100%; gap: 8px; }
.share-caption { display: flex; align-items: center; justify-content: center; gap: 7px; color: var(--color-muted); text-align: center; font-size: 13px; }

@media (max-width: 1023px) {
  .home-grid { grid-template-rows: auto; height: auto; gap: 14px; padding: 16px 12px 22px; }
  .overview-heading h1 { font-size: 23px; }
  .overview-heading time { font-size: 12px; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .summary-card { padding: 11px 10px; border-radius: 13px; }
  .summary-heading { gap: 6px; margin-bottom: 8px; }
  .summary-heading h2 { font-size: 13px; }
  .summary-icon { width: 25px; height: 25px; border-radius: 7px; font-size: 14px; }
  .summary-metrics { gap: 6px; }
  .summary-metric + .summary-metric { padding-left: 6px; }
  .summary-value { font-size: clamp(19px, 5.6vw, 27px); }
  .summary-value span { margin-left: 3px; font-size: 10px; }
  .summary-description { font-size: 11px; }
  .primary-grid, .detail-grid, .incident-grid { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto; gap: 13px; }
  .energy-content { height: 248px; gap: 7px; }
  .energy-totals { gap: 4px 13px; padding-left: 0; }
  .energy-total { gap: 4px; font-size: 11px; }
  .energy-total strong { font-size: 14px; margin-left: 2px; }
  .pending-empty { min-height: 54px; }
  .alarm-row { gap: 8px; padding-right: 2px; }
  .alarm-description strong { font-size: 13px; }
  .alarm-row time { max-width: 93px; white-space: normal; text-align: right; }
  .abnormal-content { min-height: 178px; gap: 10px; }
  .abnormal-list { gap: 10px; }
  .abnormal-list li { font-size: 12px; }
  .abnormal-list strong { font-size: 13px; }
  .donut-label strong { font-size: 25px; }
  .donut-label span, .share-caption { font-size: 12px; }
  .share-content { min-height: 230px; }
  .hazard-panel :deep(.panel-content) { min-height: 205px; }
}
</style>
