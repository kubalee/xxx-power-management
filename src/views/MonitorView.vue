<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AppDialog from '../components/AppDialog.vue'
import FieldControl from '../components/FieldControl.vue'
import PagePagination from '../components/PagePagination.vue'
import { demoUnit, deviceById, includesText, pointById, points } from '../mock/platform.js'
import { notify } from '../notifications.js'
import { icons } from '../icons.js'

const route = useRoute()
const router = useRouter()
const detail = computed(() => route.name === 'station-detail')
const readOnly = computed(() => route.name === 'monitor-data')
const point = computed(() => typeof route.query.point === 'string' ? pointById(route.query.point) : points[0])
const listRoute = ref(route.name === 'monitor-data' || route.query.from === 'monitor-data' ? 'monitor-data' : 'monitor')
const listOpen = ref(true)
const detailIds = ref([])
const detailTabs = computed(() => detailIds.value.map(pointById).filter(Boolean))
const tabMenuOpen = ref(false)
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const query = ref(keyword.value)
const hazard = ref(typeof route.query.hazard === 'string' ? route.query.hazard : '')
const category = ref(typeof route.query.category === 'string' ? route.query.category : '')
const unit = ref(typeof route.query.unit === 'string' ? route.query.unit : '')
const selected = ref([])
const page = ref(1)
const size = ref(9)
const action = ref('')
const editing = ref(false)
const draft = reactive({ name: '', category: '', unit: '' })
const results = computed(() => points.filter((item) => includesText(item.name, query.value)
  && (!hazard.value || item.hazard === hazard.value)
  && (!category.value || item.category === category.value)
  && (!unit.value || item.unit === unit.value)))
const visiblePoints = computed(() => results.value.slice((page.value - 1) * size.value, page.value * size.value))
const allSelected = computed(() => visiblePoints.value.length > 0
  && visiblePoints.value.every((item) => selected.value.includes(item.id)))
const units = computed(() => [...new Set([demoUnit, ...points.map((item) => item.unit)])])
const categories = computed(() => [...new Set(['默认', ...points.map((item) => item.category)])])

const listLink = computed(() => ({
  name: listRoute.value,
  query: { q: query.value || undefined, category: category.value || undefined, hazard: hazard.value || undefined, unit: unit.value || undefined },
}))
const returnTo = computed(() => ['devices', 'maintenance'].includes(route.query.from)
  ? { name: route.query.from }
  : listLink.value)

watch(() => route.name, (name) => {
  if (name === 'monitor' || name === 'monitor-data') {
    listRoute.value = name
    listOpen.value = true
  }
})
watch(() => detail.value ? point.value?.id : undefined, (id) => {
  if (id && !detailIds.value.includes(id)) detailIds.value.push(id)
}, { immediate: true })

function search() {
  query.value = keyword.value
  page.value = 1
}

function reset() {
  keyword.value = ''
  query.value = ''
  hazard.value = ''
  category.value = ''
  unit.value = ''
  selected.value = []
  page.value = 1
}

function detailLink(item) {
  return {
    name: 'station-detail',
    query: {
      point: item.id, from: listRoute.value, q: query.value || undefined,
      category: category.value || undefined, hazard: hazard.value || undefined, unit: unit.value || undefined,
    },
  }
}

function closeList() {
  if (!detailTabs.value.length) return
  listOpen.value = false
  if (!detail.value) router.push(detailLink(detailTabs.value[0]))
}

function closeDetail(id) {
  detailIds.value = detailIds.value.filter((item) => item !== id)
  if (!detail.value || point.value?.id !== id) return

  if (listOpen.value || !detailTabs.value.length) {
    listOpen.value = true
    router.push(listLink.value)
  } else {
    router.push(detailLink(detailTabs.value[0]))
  }
}

function closeAllTabs() {
  tabMenuOpen.value = false
  listOpen.value = true
  detailIds.value = []
  router.push(listLink.value)
}

function closeOtherTabs() {
  tabMenuOpen.value = false
  const id = detail.value ? point.value?.id : undefined
  listOpen.value = !id
  detailIds.value = id ? [id] : []
}

function closeMenuOnBlur(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) tabMenuOpen.value = false
}

function selectAll(event) {
  const ids = visiblePoints.value.map((item) => item.id)
  selected.value = event.target.checked
    ? [...new Set([...selected.value, ...ids])]
    : selected.value.filter((id) => !ids.includes(id))
}

function openAction(label) {
  const items = points.filter((item) => selected.value.includes(item.id))
  if (!items.length || (label === '编辑' && items.length !== 1)) {
    notify(label === '编辑' ? '请选择一个监测点' : '请选择监测点', 'warning')
    return
  }
  action.value = label
  Object.assign(draft, { name: items[0].name, category: items[0].category, unit: items[0].unit })
  editing.value = true
}

function saveAction() {
  if (action.value === '删除') {
    for (let index = points.length - 1; index >= 0; index--) {
      if (selected.value.includes(points[index].id)) points.splice(index, 1)
    }
    selected.value = []
  } else {
    const key = { 挪动: 'unit', 分类: 'category', 编辑: 'name' }[action.value]
    for (const item of points) {
      if (selected.value.includes(item.id)) item[key] = draft[key].trim()
    }
  }
  notify(action.value + '成功')
  editing.value = false
}
</script>

<template>
  <nav class="monitor-tabs" aria-label="监测页签">
    <div v-if="listOpen" :class="['monitor-tab', 'monitor-list-tab', { selected: !detail }]">
      <RouterLink :to="listLink">监测点列表</RouterLink>
      <button type="button" class="monitor-tab-close" aria-label="关闭监测点列表" :disabled="!detailTabs.length" @click="closeList">×</button>
    </div>
    <div
      v-for="item in detailTabs"
      :key="item.id"
      :class="['monitor-tab', { selected: detail && point?.id === item.id }]"
    >
      <RouterLink :to="detailLink(item)" :title="item.name">{{ item.name }}</RouterLink>
      <button type="button" class="monitor-tab-close" :aria-label="'关闭监测点详情 ' + item.name" @click="closeDetail(item.id)">×</button>
    </div>
    <div
      class="monitor-tab-menu"
      @mouseenter="tabMenuOpen = true"
      @mouseleave="tabMenuOpen = false"
      @keydown.esc="tabMenuOpen = false"
      @focusout="closeMenuOnBlur"
    >
      <button type="button" class="monitor-tab-manage" :aria-expanded="tabMenuOpen" aria-label="页签管理" @click="tabMenuOpen = true">
        <span class="element-icon" aria-hidden="true">{{ icons.more }}</span>
      </button>
      <div v-if="tabMenuOpen" class="monitor-tab-actions">
        <button type="button" @click="closeAllTabs">关闭所有</button>
        <button type="button" @click="closeOtherTabs">关闭其他标签</button>
      </div>
    </div>
  </nav>
  <nav class="mg-breadcrumb" aria-label="当前位置">
    <span>监测中心</span><span>/</span><span>{{ readOnly ? '数据详情' : '监测管理' }}</span><span>/</span>
    {{ detail ? '监测点详情' : '监测点列表' }}
  </nav>

  <section v-if="detail && point" class="mg-card point-detail">
    <h1 class="mg-card-title">{{ point.name }}<span class="point-state" :class="{ attention: point.status !== '运行正常' }">{{ point.status }}</span></h1>
    <div class="mg-card-body">
      <dl class="point-properties">
        <div><dt>所属单位</dt><dd>{{ point.unit }}</dd></div>
        <div><dt>回路ID</dt><dd>{{ point.circuit }}</dd></div>
        <div><dt>设备Imei</dt><dd>{{ deviceById(point.deviceId)?.imei || '—' }}</dd></div>
        <div><dt>分类</dt><dd>{{ point.category }}</dd></div>
        <div><dt>运行状态</dt><dd>{{ point.status }}</dd></div>
        <div><dt>信号强度</dt><dd>{{ point.signal }}</dd></div>
      </dl>
      <RouterLink class="mg-button" :to="returnTo">返回列表</RouterLink>
    </div>
  </section>
  <section v-else-if="detail" class="mg-card point-detail"><p class="mg-empty">暂无数据</p></section>

  <div v-else class="monitor-grid">
    <aside class="mg-card monitor-tree">
      <p>查询结果</p>
      <button
        v-for="item in units"
        :key="item"
        type="button"
        :aria-pressed="unit === item"
        @click="unit = unit === item ? '' : item; page = 1"
      >{{ item }}</button>
    </aside>
    <section class="mg-card monitor-card">
      <form class="mg-controls monitor-controls" @submit.prevent="search">
        <div class="monitor-search">
          <label>
            <span>监测点名称</span>
            <input v-model="keyword" aria-label="监测点名称" placeholder="监测点名称" />
          </label>
          <button type="submit" class="mg-button primary">
            <span class="element-icon" aria-hidden="true">{{ icons.search }}</span>查询
          </button>
        </div>
        <div class="hazard-control">
          <span>隐患类型</span>
          <FieldControl v-model="hazard" type="select" placeholder="选择隐患类型" :options="['一般隐患', '重大隐患']" width="150px" @update:model-value="page = 1" />
        </div>
        <FieldControl v-model="category" type="select" placeholder="选择分类" :options="categories" width="150px" @update:model-value="page = 1" />
        <button type="button" class="mg-button" @click="reset">重置</button>
        <div v-if="!readOnly" class="mg-toolbar monitor-actions">
          <button v-for="label in ['挪动', '分类', '编辑', '删除']" :key="label" type="button" class="mg-button" @click="openAction(label)">{{ label }}</button>
        </div>
      </form>

      <h1 v-if="!readOnly && results.length" class="monitor-unit">{{ unit || demoUnit }}</h1>
      <div class="monitor-points" :class="{ 'data-points': readOnly }">
        <article v-for="item in visiblePoints" :key="item.id" class="point-card">
          <input v-if="!readOnly" v-model="selected" class="mg-selection" type="checkbox" :value="item.id" :aria-label="'选中' + item.name" />
          <RouterLink :to="detailLink(item)" class="point-link">
            <div class="point-info">
              <h2>{{ item.name }}</h2>
              <p>{{ item.group }} / {{ item.category }}</p>
              <p>{{ item.unit === demoUnit ? '默认' : item.unit }}</p>
              <p>信号强度<span class="element-icon signal-bars" :class="{ weak: item.signal === 0 }" aria-hidden="true">{{ icons.signal }}</span></p>
              <p>回路ID {{ item.circuit }}</p>
              <p>设备Imei {{ deviceById(item.deviceId)?.imei || '—' }}</p>
            </div>
            <div class="point-indicator">
              <span class="point-symbol element-icon" aria-hidden="true">{{ icons.device }}</span>
              <span class="point-state" :class="{ attention: item.status !== '运行正常' }">{{ item.status }}</span>
            </div>
          </RouterLink>
        </article>
        <p v-if="!visiblePoints.length" class="mg-empty">暂无数据</p>
      </div>
      <div class="monitor-pagination">
        <label v-if="!readOnly"><input class="mg-selection" type="checkbox" :checked="allSelected" @change="selectAll" /> 全选</label>
        <PagePagination v-model="page" v-model:size="size" :total="results.length" :sizes="[9, 18, 27]" />
      </div>
    </section>
  </div>

  <AppDialog v-model="editing" :title="action" width="576px" light>
    <form id="monitor-edit" class="mg-form" @submit.prevent="saveAction">
      <FieldControl v-if="action === '编辑'" v-model="draft.name" label="监测点名称" required />
      <FieldControl v-else-if="action === '分类'" v-model="draft.category" label="分类" required />
      <FieldControl v-else-if="action === '挪动'" v-model="draft.unit" label="所属单位" required />
      <p v-else class="mg-confirm">确定删除所选监测点？</p>
    </form>
    <template #actions>
      <button type="submit" form="monitor-edit" class="mg-button primary">确定</button>
      <button type="button" class="mg-button" @click="editing = false">取消</button>
    </template>
  </AppDialog>
</template>

<style scoped>
.monitor-tabs { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; }
.monitor-tab {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  padding: 0 4px 0 12px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  color: var(--color-muted);
}
.monitor-tab a { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 36px; }
.monitor-tabs .selected { color: var(--color-primary); background: var(--color-primary-soft); font-weight: 600; }
.monitor-tab-close { flex: none; width: 28px; min-height: 28px; margin-left: 2px; border-radius: var(--radius-control); }
.monitor-tab-close:hover:enabled { background: var(--color-surface); }
.monitor-tab-menu { position: relative; margin-left: auto; z-index: 3; }
.monitor-tab-manage {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
}
.monitor-tab-manage:hover, .monitor-tab-manage[aria-expanded="true"] { background: var(--color-primary-soft); }
.monitor-tab-manage .element-icon { font-size: 16px; }
.monitor-tab-actions {
  position: absolute;
  top: 100%;
  right: 0;
  display: grid;
  min-width: 136px;
  padding: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  box-shadow: var(--shadow-panel);
}
.monitor-tab-actions button { min-height: 36px; padding: 0 12px; text-align: left; border-radius: var(--radius-control); }
.monitor-tab-actions button:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.monitor-grid {
  display: grid;
  grid-template-columns: clamp(170px, 15vw, 216px) minmax(0, 1fr);
  gap: 12px;
  margin-top: 12px;
  align-items: start;
}
.monitor-tree { display: grid; gap: 6px; padding: 14px; }
.monitor-tree p { margin: 0 8px 4px; font-weight: 600; }
.monitor-tree button {
  min-height: 36px;
  padding: 6px 8px;
  color: var(--color-muted);
  border-radius: var(--radius-control);
  text-align: left;
  overflow-wrap: anywhere;
}
.monitor-tree button:hover, .monitor-tree button[aria-pressed="true"] { background: var(--color-primary-soft); color: var(--color-primary); }
.monitor-card { margin-top: 0; padding: 16px; }
.monitor-controls { gap: 10px; padding-bottom: 14px; border-bottom: 1px solid var(--color-border); }
.monitor-search, .hazard-control { display: flex; align-items: center; min-width: 0; }
.monitor-search { gap: 6px; }
.monitor-search label, .hazard-control {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding-inline: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-muted);
}
.monitor-search label:focus-within, .hazard-control:focus-within { border-color: var(--color-primary); }
.monitor-search span, .hazard-control > span { white-space: nowrap; }
.monitor-search input {
  width: 126px;
  min-width: 0;
  height: 28px;
  border: 0;
  border-left: 1px solid var(--color-border);
  padding-left: 8px;
  background: transparent;
  color: var(--color-text);
}
.monitor-search input:focus { outline: none; }
.monitor-search input::placeholder { color: var(--color-muted); }
.monitor-search .mg-button { padding-inline: 12px; gap: 4px; }
.monitor-search .mg-button .element-icon { font-size: 14px; }
.hazard-control { width: 222px; padding-right: 4px; }
.hazard-control .mg-field { flex: 1; }
.hazard-control :deep(.mg-control) {
  width: 100%;
  min-height: 28px;
  border: 0;
  border-left: 1px solid var(--color-border);
  border-radius: 0;
  padding-left: 8px;
}
.monitor-actions { margin-left: auto; gap: 6px; }
.monitor-unit { margin-top: 14px; font: 600 17px/24px var(--title-font); color: var(--color-text); }
.monitor-points { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 306px), 1fr)); gap: 12px; margin-top: 12px; }
.monitor-points > .mg-empty { grid-column: 1 / -1; }
.point-card {
  position: relative;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-panel);
  background: var(--color-surface);
}
.point-card:hover, .point-card:has(> input:checked) { border-color: var(--color-primary); }
.point-card > input { position: absolute; top: 16px; left: 12px; z-index: 1; }
.point-link {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 14px 14px 14px 38px;
  border-radius: inherit;
}
.data-points .point-link { padding-left: 14px; }
.point-state {
  padding: 4px 8px;
  border-radius: var(--radius-control);
  background: var(--color-positive-soft);
  color: var(--color-positive);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.point-state.attention { background: var(--color-warning-soft); color: var(--color-warning); }
.point-info { min-width: 0; align-self: start; color: var(--color-muted); }
.point-info h2 { font: 600 16px/22px var(--title-font); color: var(--color-text); margin-bottom: 6px; overflow-wrap: anywhere; }
.point-info p { font-size: 13px; line-height: 20px; overflow-wrap: anywhere; }
.signal-bars { display: inline-block; font-size: 14px; vertical-align: -1px; margin-left: 3px; color: var(--color-primary); }
.signal-bars.weak { opacity: .25; }
.point-indicator { display: grid; justify-items: center; gap: 4px; }
.point-symbol {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-block: 9px;
  border: 2px solid currentColor;
  border-radius: 50%;
  color: var(--color-primary);
  background: var(--color-primary-soft);
  font-size: 26px;
}
.monitor-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  color: var(--color-muted);
}
.monitor-pagination nav { margin-left: auto; }
.point-detail { margin-top: 12px; }
.point-detail .mg-card-title { overflow-wrap: anywhere; }
.point-properties { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
.point-properties > div { padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-control); overflow-wrap: anywhere; }
.point-properties dt { color: var(--color-muted); margin-bottom: 4px; }

@media (max-width: 1023px) {
  .monitor-tab { padding-inline: 10px 2px; font-size: 13px; }
  .monitor-tab a { max-width: 152px; }
  .monitor-tab-close, .monitor-tab-manage { width: 44px; min-height: 44px; }
  .monitor-tab-actions button { min-height: 44px; }
  .monitor-grid { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .monitor-tree { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 6px; }
  .monitor-tree p { margin: 0 6px; }
  .monitor-tree button { min-height: 44px; }
  .monitor-card { padding: 12px; }
  .monitor-search, .hazard-control { width: 100%; }
  .monitor-search label, .hazard-control { min-height: 44px; }
  .monitor-search label { flex: 1; min-width: 0; }
  .monitor-search input { flex: 1; width: 0; }
  .monitor-actions { margin-left: 0; }
  .point-card > input { width: 20px; height: 20px; }
  .point-link { gap: 6px; padding-right: 10px; }
  .point-info h2 { font-size: 15px; }
  .point-symbol { width: 42px; height: 42px; margin-block: 7px; font-size: 24px; }
  .monitor-pagination nav { margin-left: 0; }
  .point-properties { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
}
</style>
