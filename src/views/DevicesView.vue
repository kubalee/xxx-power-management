<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppDialog from '../components/AppDialog.vue'
import DataTable from '../components/DataTable.vue'
import FieldControl from '../components/FieldControl.vue'
import PagePagination from '../components/PagePagination.vue'
import DeviceEditor from './DeviceEditor.vue'
import { downloadCsv, readCsv } from '../mock/csv.js'
import { demoUnit, devices, includesText, points } from '../mock/platform.js'
import { notify } from '../notifications.js'

const route = useRoute()
const router = useRouter()
const maintenance = computed(() => route.name === 'maintenance')
const filters = reactive({ model: '', enabled: '', connection: '', online: '', name: '', imei: '', unit: '' })
const selected = ref([])
const page = ref(1)
const size = ref(10)
const editorOpen = ref(false)
const editorTitle = ref('新增主机')
const editing = ref(null)
const active = ref(null)
const detailOpen = ref(false)
const detailTitle = ref('查看设备')
const confirmOpen = ref(false)
const confirmAction = ref('')
const destination = ref('')
const input = ref(null)
const importMode = ref('主机')
const templateOpen = ref(false)
const units = computed(() => [...new Set([demoUnit, ...devices.map((device) => device.unit)])])
const onlineCount = computed(() => devices.filter((device) => device.online === '在线').length)
const offlineCount = computed(() => devices.length - onlineCount.value)
const filtered = computed(() => devices.filter((device) => (
  (!filters.model || filters.model === device.model)
  && (!filters.enabled || filters.enabled === device.enabled)
  && (!filters.connection || filters.connection === device.connection)
  && (!filters.online || filters.online === device.online)
  && (!filters.unit || filters.unit === device.unit)
  && includesText(device.name, filters.name)
  && includesText(device.imei, filters.imei)
)))
const rows = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value))
const allSelected = computed(() => rows.value.length > 0 && rows.value.every((device) => selected.value.includes(device.id)))
const baseColumns = [
  { key: 'name', label: '设备名称', width: '180px', ellipsis: true },
  { key: 'imei', label: '设备imei', width: '180px' },
  { key: 'model', label: '设备类型', width: '95px' },
  { key: 'circuits', label: '回路数', width: '70px' },
  { key: 'circuitType', label: '回路类型', width: '90px' },
  { key: 'unit', label: '所属单位', width: '155px', ellipsis: true },
]
const stateColumns = [
  { key: 'position', label: '位置', width: '130px' },
  { key: 'enabled', label: '启停', width: '80px' },
  { key: 'online', label: '在线', width: '80px' },
  { key: 'connection', label: '连接状态', width: '100px' },
  { key: 'protocol', label: '协议类型', width: '90px' },
  { key: 'updated', label: '更新时间', width: '150px' },
  { key: 'offlineTime', label: '离线时间', width: '141px' },
]
const columns = computed(() => [
  ...(!maintenance.value ? [{ key: 'select', label: '', width: '54px' }] : []),
  ...baseColumns,
  ...(maintenance.value
    ? stateColumns.filter((column) => !['connection', 'protocol'].includes(column.key))
    : stateColumns),
  { key: 'actions', label: '操作', width: maintenance.value ? '370px' : '400px' },
])

watch(filters, () => { page.value = 1 })

function reset() {
  Object.assign(filters, { model: '', enabled: '', connection: '', online: '', name: '', imei: '', unit: '' })
  selected.value = []
}

function selectAll(event) {
  const ids = rows.value.map((device) => device.id)
  selected.value = event.target.checked
    ? [...new Set([...selected.value, ...ids])]
    : selected.value.filter((id) => !ids.includes(id))
}

function currentTime() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium',
  }).format(new Date())
}

function createDevice(fields, model = 'B1') {
  devices.push({
    id: crypto.randomUUID(), model, circuits: 1, circuitType: 'L型',
    position: '--', connection: '未连接', online: '离线', protocol: '2',
    updated: currentTime(), offlineTime: '--', ...fields,
  })
}

function editDevice(title, device = null) {
  editorTitle.value = title
  editing.value = device
  editorOpen.value = true
}

function saveDevice(fields) {
  if (editing.value) Object.assign(editing.value, fields, { updated: currentTime() })
  else createDevice(fields, editorTitle.value === '新增从机' ? '从机' : 'B1')
  notify(editorTitle.value + '成功')
}

function showDetails(device, title) {
  active.value = device
  detailTitle.value = title
  detailOpen.value = true
}

function sync(device) {
  device.updated = currentTime()
  notify('设备同步成功')
}

function selectedDevices() {
  return devices.filter((device) => selected.value.includes(device.id))
}

function requireSelection() {
  if (selectedDevices().length) return true
  notify('请选择设备', 'warning')
  return false
}

function generatePoints() {
  if (!requireSelection()) return
  let added = 0
  for (const device of selectedDevices()) {
    if (points.some((point) => point.deviceId === device.id)) continue
    points.push({
      id: crypto.randomUUID(), deviceId: device.id, unit: device.unit, name: device.name + '第1回路',
      group: '默认', category: '默认', hazard: '', circuit: device.imei + '-1',
      status: device.online === '在线' ? '运行正常' : '离线', signal: device.online === '在线' ? 3 : 0,
    })
    added++
  }
  notify(added ? '已生成 ' + added + ' 个监测点' : '所选设备已有监测点', added ? 'success' : 'warning')
}

function confirm(title) {
  if (!requireSelection()) return
  confirmAction.value = title
  destination.value = ''
  confirmOpen.value = true
}

function applySelection() {
  if (confirmAction.value === '删除') {
    for (let index = points.length - 1; index >= 0; index--) {
      if (selected.value.includes(points[index].deviceId)) points.splice(index, 1)
    }
    for (let index = devices.length - 1; index >= 0; index--) {
      if (selected.value.includes(devices[index].id)) devices.splice(index, 1)
    }
  } else {
    const unit = destination.value.trim()
    if (!unit) return
    for (const device of selectedDevices()) device.unit = unit
    for (const point of points) {
      if (selected.value.includes(point.deviceId)) point.unit = unit
    }
  }
  selected.value = []
  confirmOpen.value = false
  notify(confirmAction.value + '成功')
}

function exportDevices(template = false) {
  const headings = ['设备名称', '设备imei', '所属单位']
  const content = template ? [] : filtered.value.map((device) => [device.name, device.imei, device.unit])
  downloadCsv(template ? '设备导入模板.csv' : '设备列表.csv', headings, content)
  templateOpen.value = false
}

function chooseImport(mode) {
  importMode.value = mode
  input.value.click()
}

async function importDevices(event) {
  const file = event.target.files[0]
  event.target.value = ''
  if (!file) return
  const mode = importMode.value
  try {
    const [heading, ...records] = readCsv(await file.text())
    if (heading?.[0] !== '设备名称' || !records.length) throw new Error('请使用设备导入模板填写数据')
    const used = new Set(devices.map((device) => device.imei.toLowerCase()))
    const incoming = records.map(([name, imei, unit = demoUnit]) => {
      if (!name || !imei || used.has(imei.toLowerCase())) throw new Error('请检查设备名称和重复的设备imei')
      used.add(imei.toLowerCase())
      return { name, imei, unit, enabled: '启用' }
    })
    for (const record of incoming) createDevice(record, mode === '主机' ? 'B1' : '从机')
    notify('已导入 ' + incoming.length + ' 台设备')
  } catch (error) {
    notify(error.message, 'warning')
  }
}

function viewPoint() {
  const point = points.find((item) => item.deviceId === active.value.id)
  if (!point) {
    notify('请先生成监测点', 'warning')
    detailOpen.value = false
    return
  }
  router.push({ name: 'station-detail', query: { point: point.id, from: route.name } })
}

function toggleDevice() {
  active.value.enabled = active.value.enabled === '启用' ? '停用' : '启用'
  active.value.updated = currentTime()
  detailOpen.value = false
  notify('设备状态已更新')
}
</script>

<template>
  <section class="mg-card devices-card">
    <h1 class="mg-card-title">
      {{ maintenance ? '设备运维' : '设备管理' }}
      <span v-if="!maintenance" class="device-counts">
        <span class="device-count online">在线设备 <b>{{ onlineCount }}</b></span>
        <span class="device-count">离线设备 <b>{{ offlineCount }}</b></span>
      </span>
    </h1>
    <div class="mg-card-body devices-body">
      <div class="mg-controls device-filters">
        <FieldControl v-if="maintenance" v-model="filters.unit" class="device-filter-wide" type="select" label="单位" placeholder="请选择" :options="units" width="180px" />
        <template v-else>
          <FieldControl v-model="filters.model" type="select" label="设备型号" :options="['B1', '从机']" width="180px" />
          <FieldControl v-model="filters.enabled" type="select" label="启用状态" :options="['启用', '停用']" width="100px" />
          <FieldControl v-model="filters.connection" type="select" label="连接状态" :options="['已连接', '未连接']" width="100px" />
          <FieldControl v-model="filters.online" type="select" label="在线状态" :options="['在线', '离线']" width="100px" />
        </template>
        <FieldControl v-model="filters.name" class="device-filter-wide" label="设备名称" placeholder="请输入设备名称" width="160px" />
        <FieldControl v-model="filters.imei" class="device-filter-wide" label="设备imel" placeholder="请输入设备imel" width="160px" />
        <button type="button" class="mg-button reset" @click="reset">重置</button>
      </div>

      <div v-if="!maintenance" class="device-toolbars">
        <div class="mg-toolbar import-tools">
          <input ref="input" type="file" accept=".csv,text/csv" hidden @change="importDevices" />
          <button type="button" class="mg-link tool-link" @click="chooseImport('主机')">导入主机</button>
          <button type="button" class="mg-link tool-link" @click="chooseImport('从机')">导入从机</button>
          <button type="button" class="mg-link tool-link" @click="exportDevices()">导出</button>
          <div class="device-template-control">
            <button type="button" class="mg-link tool-link" :aria-expanded="templateOpen" @click="templateOpen = !templateOpen">导入模板下载 ﹀</button>
            <div v-if="templateOpen" class="device-template-menu">
              <button type="button" @click="exportDevices(true)">主机模板</button>
              <button type="button" @click="exportDevices(true)">从机模板</button>
            </div>
          </div>
        </div>
        <div class="mg-toolbar device-actions">
          <button type="button" class="mg-button primary" @click="editDevice('新增主机')">添加主机</button>
          <button type="button" class="mg-button" @click="generatePoints">生成监测点</button>
          <button type="button" class="mg-button" @click="confirm('删除')">删除</button>
          <button type="button" class="mg-button" @click="confirm('挪动')">挪动</button>
        </div>
      </div>

      <div :class="['device-list', { maintenance }]">
        <aside v-if="!maintenance" class="device-tree">
          <h2>组织结构</h2>
          <button
            v-for="unit in units"
            :key="unit"
            type="button"
            :aria-pressed="filters.unit === unit"
            @click="filters.unit = filters.unit === unit ? '' : unit"
          >{{ unit }}</button>
        </aside>
        <DataTable
          :columns="columns"
          :rows="rows"
          :label="maintenance ? '设备运维列表' : '设备管理列表'"
          :min-width="maintenance ? '1721px' : '1995px'"
          pin-actions
        >
          <template #head-select><input class="mg-selection" type="checkbox" aria-label="全选设备" :checked="allSelected" @change="selectAll" /></template>
          <template #cell-select="{ row }"><input v-model="selected" class="mg-selection" type="checkbox" :aria-label="'选中' + row.name" :value="row.id" /></template>
          <template #cell-online="{ value }">
            <span class="device-status" :class="{ online: value === '在线' }">{{ value }}</span>
          </template>
          <template #cell-actions="{ row }">
            <div v-if="maintenance" class="device-row-actions">
              <button type="button" class="mg-link" @click="showDetails(row, '查看设备')">查看设备</button>
              <button type="button" class="mg-link" @click="showDetails(row, '设备控制')">设备控制</button>
              <button type="button" class="mg-link" @click="sync(row)">获取数据</button>
              <button type="button" class="mg-link" @click="showDetails(row, '设置参数')">设置参数</button>
              <button type="button" class="mg-link" @click="showDetails(row, '查看回路')">查看回路</button>
              <button type="button" class="mg-link" @click="downloadCsv('设备帧.csv', ['设备imei', '状态'], [[row.imei, row.online]])">下载帧</button>
            </div>
            <div v-else class="device-row-actions">
              <button type="button" class="mg-link" @click="showDetails(row, '查看设备')">查看 ﹀</button>
              <button type="button" class="mg-link" @click="editDevice('编辑设备', row)">编辑</button>
              <button type="button" class="mg-link" @click="sync(row)">设备同步</button>
              <button type="button" class="mg-link" @click="editDevice('新增从机')">新增从机</button>
              <button type="button" class="mg-link" @click="showDetails(row, '外接设备')">外接设备</button>
              <button type="button" class="mg-link" @click="editDevice('更换设备', row)">更换设备</button>
            </div>
          </template>
        </DataTable>
      </div>
      <PagePagination v-model="page" v-model:size="size" :total="filtered.length" :sizes="[10, 20, 50]" />
    </div>
  </section>

  <DeviceEditor v-model="editorOpen" :title="editorTitle" :device="editing" @save="saveDevice" />
  <AppDialog v-model="detailOpen" :title="detailTitle" width="576px" light>
    <div v-if="active" class="device-detail">
      <p v-if="detailTitle === '外接设备'" class="mg-empty">暂无数据</p>
      <dl v-else>
        <div><dt>设备名称</dt><dd>{{ active.name }}</dd></div>
        <div><dt>设备imei</dt><dd>{{ active.imei }}</dd></div>
        <div><dt>设备型号</dt><dd>{{ active.model }}</dd></div>
        <div><dt>所属单位</dt><dd>{{ active.unit }}</dd></div>
        <div><dt>启停状态</dt><dd>{{ active.enabled }}</dd></div>
        <div><dt>在线状态</dt><dd>{{ active.online }}</dd></div>
        <div><dt>回路数</dt><dd>{{ active.circuits }}</dd></div>
      </dl>
      <FieldControl
        v-if="detailTitle === '设置参数'"
        :model-value="active.circuitType"
        type="select"
        label="回路类型"
        :options="['L型', '其他']"
        @update:model-value="value => { if (value) active.circuitType = value }"
      />
    </div>
    <template #actions>
      <button v-if="detailTitle === '设备控制'" type="button" class="mg-button primary" @click="toggleDevice">
        {{ active?.enabled === '启用' ? '停用' : '启用' }}
      </button>
      <button v-else-if="['查看设备', '查看回路'].includes(detailTitle)" type="button" class="mg-button primary" @click="viewPoint">查看回路</button>
      <button type="button" class="mg-button" @click="detailOpen = false">关闭</button>
    </template>
  </AppDialog>
  <AppDialog v-model="confirmOpen" :title="confirmAction" width="460px" light>
    <form id="device-selection" class="mg-form" @submit.prevent="applySelection">
      <p v-if="confirmAction === '删除'" class="mg-confirm">确定删除所选设备？</p>
      <FieldControl v-else v-model="destination" label="所属单位" required />
    </form>
    <template #actions>
      <button type="submit" form="device-selection" class="mg-button primary">确定</button>
      <button type="button" class="mg-button" @click="confirmOpen = false">取消</button>
    </template>
  </AppDialog>
</template>

<style scoped>
.device-counts { display: flex; align-items: center; gap: 8px; font-size: 13px; white-space: nowrap; }
.device-count, .device-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: var(--radius-control);
  background: var(--color-canvas);
  color: var(--color-muted);
  font-weight: 500;
}
.device-count.online, .device-status.online { background: var(--color-positive-soft); color: var(--color-positive); }
.device-count b { font-weight: 700; }
.device-status { padding: 2px 8px; font-size: 12px; }
.device-filters { gap: 10px 14px; }
.device-toolbars {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
.import-tools { justify-content: flex-start; gap: 2px 6px; }
.device-actions { gap: 6px; }
.tool-link { min-height: 36px; padding-inline: 7px; white-space: nowrap; }
.device-template-control { position: relative; }
.device-template-menu {
  position: absolute;
  z-index: 2;
  top: 100%;
  right: 0;
  display: grid;
  min-width: 116px;
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  box-shadow: var(--shadow-panel);
}
.device-template-menu button { min-height: 36px; padding-inline: 10px; border-radius: var(--radius-control); text-align: left; }
.device-template-menu button:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.device-list {
  display: grid;
  grid-template-columns: clamp(156px, 13vw, 204px) minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  margin: 12px 0 14px;
}
.device-list.maintenance { display: block; }
.device-tree {
  min-width: 0;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
}
.device-tree h2 { padding: 2px 6px 8px; font-size: 14px; font-weight: 600; }
.device-tree button {
  display: block;
  width: 100%;
  min-height: 36px;
  padding: 6px;
  border-radius: var(--radius-control);
  color: var(--color-muted);
  text-align: left;
  overflow-wrap: anywhere;
}
.device-tree button:hover, .device-tree button[aria-pressed="true"] { background: var(--color-primary-soft); color: var(--color-primary); }
.device-list .mg-table-scroll { max-height: min(520px, 60vh); }
.device-row-actions { display: flex; justify-content: center; gap: 8px; }
.device-list :deep(.mg-table .col-actions button) { font-size: 12px; margin-inline: 0; }
.device-detail { padding: 10px 20px 16px; }
.device-detail dl > div { display: grid; grid-template-columns: 92px minmax(0, 1fr); gap: 8px; padding: 8px 0; overflow-wrap: anywhere; }
.device-detail dl > div + div { border-top: 1px solid var(--color-border); }
.device-detail dt { color: var(--color-muted); }
.device-detail .mg-field { margin-top: 12px; }

@media (max-width: 1023px) {
  .devices-card > .mg-card-title { flex-wrap: wrap; gap: 6px 8px; }
  .device-counts { font-size: 11px; gap: 4px; }
  .device-count { padding-inline: 6px; }
  .device-filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .device-filters > .mg-field:not(.device-filter-wide) { display: grid; gap: 4px; }
  .device-filters :deep(.mg-control) { width: 100%; }
  .device-filter-wide { grid-column: 1 / -1; }
  .device-filters .reset { justify-self: start; }
  .device-toolbars .mg-toolbar { justify-content: flex-start; }
  .tool-link, .device-template-menu button { min-height: 44px; }
  .device-list { grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .device-tree { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; padding: 5px; }
  .device-tree h2 { padding-block: 0; }
  .device-tree button { width: auto; min-height: 44px; }
  .device-list .mg-table-scroll { max-height: none; }
  .device-detail { padding-inline: 14px; }
}
</style>
