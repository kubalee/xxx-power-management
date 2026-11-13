<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppDialog from '../components/AppDialog.vue'
import DataTable from '../components/DataTable.vue'
import FieldControl from '../components/FieldControl.vue'
import PagePagination from '../components/PagePagination.vue'
import { demoUnit, includesText, users } from '../mock/platform.js'
import { demoAccount, updateDemoPassword } from '../mock/session.js'
import { notify } from '../notifications.js'

const keyword = ref('')
const organization = ref('')
const page = ref(1)
const dialogOpen = ref(false)
const mode = ref('')
const current = ref(null)
const error = ref('')
const password = ref('')
const passwordAgain = ref('')
const emptyDraft = { username: '', unit: '', role: '', name: '', tag: '全部', phone: '', status: '启用', remark: '' }
const draft = reactive({ ...emptyDraft })
const columns = [
  { key: 'username', label: '用户名', ellipsis: true },
  { key: 'unit', label: '所属组织', ellipsis: true },
  { key: 'role', label: '角色' },
  { key: 'name', label: '使用人' },
  { key: 'tag', label: '标签' },
  { key: 'phone', label: '联系方式' },
  { key: 'updated', label: '修改时间', ellipsis: true },
  { key: 'status', label: '账号状态' },
  { key: 'remark', label: '备注', ellipsis: true },
  { key: 'actions', label: '操作', width: '180px' },
]
const roles = ['单位负责人', '单位安全员', '单位电工', '普通用户']
const filtered = computed(() => users.filter((item) => includesText(item.username, keyword.value)
  && (!organization.value || organization.value === item.unit)))
const rows = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
watch([keyword, organization], () => { page.value = 1 })

function reset() {
  keyword.value = ''
  organization.value = ''
  page.value = 1
}

function open(label, user = null) {
  mode.value = label
  current.value = user
  Object.assign(draft, emptyDraft, user ?? {})
  password.value = ''
  passwordAgain.value = ''
  error.value = ''
  dialogOpen.value = true
}

function save() {
  error.value = ''
  if (mode.value === '删除') {
    const index = users.findIndex((item) => item.id === current.value.id)
    if (index !== -1) users.splice(index, 1)
  } else if (mode.value === '修改密码') {
    if (password.value.length < 6 || password.value !== passwordAgain.value) {
      error.value = '请输入至少6位且一致的新密码'
      return
    }
    if (current.value.username === demoAccount) updateDemoPassword(password.value)
  } else {
    const username = draft.username.trim()
    if (!username || users.some((item) => item.username === username && item.id !== current.value?.id)) {
      error.value = username ? '用户名已存在' : '请输入用户名'
      return
    }
    const updated = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium',
    }).format(new Date())
    const fields = Object.fromEntries(Object.keys(emptyDraft).map((key) => [key, draft[key]]))
    const values = { ...fields, username, updated }
    if (current.value) Object.assign(current.value, values)
    else users.push({ id: crypto.randomUUID(), ...values })
  }
  dialogOpen.value = false
  notify(mode.value + '成功')
}
</script>

<template>
  <section class="mg-card">
    <h1 class="mg-card-title">用户管理</h1>
    <div class="mg-card-body users-body">
      <div class="mg-controls">
        <FieldControl v-model="keyword" label="用户名" placeholder="请输入用户名" width="221px" />
        <FieldControl v-model="organization" type="select" label="所属组织" placeholder="请选择" :options="[demoUnit]" width="242px" />
        <div class="mg-toolbar user-actions">
          <button type="button" class="mg-button" @click="reset">重置</button>
          <button type="button" class="mg-button primary" @click="open('新增用户')">新增用户</button>
        </div>
      </div>
      <DataTable :columns="columns" :rows="rows" label="用户列表" min-width="1000px">
        <template #cell-status="{ value }">
          <span class="user-status" :class="{ enabled: value === '启用' }">{{ value }}</span>
        </template>
        <template #cell-actions="{ row }">
          <button type="button" class="mg-link" @click="open('修改密码', row)">修改密码</button>
          <button type="button" class="mg-link" @click="open('编辑', row)">编辑</button>
          <button type="button" class="mg-link" @click="open('删除', row)">删除</button>
        </template>
      </DataTable>
      <PagePagination v-model="page" :total="filtered.length" />
    </div>
  </section>

  <AppDialog v-model="dialogOpen" :title="mode" width="576px" light>
    <form id="user-editor" class="mg-form" @submit.prevent="save">
      <p v-if="mode === '删除'" class="mg-confirm">确定删除用户「{{ current?.username }}」？</p>
      <template v-else-if="mode === '修改密码'">
        <FieldControl v-model="password" type="password" label="新密码" required />
        <FieldControl v-model="passwordAgain" type="password" label="确认密码" required />
      </template>
      <template v-else>
        <FieldControl v-model="draft.username" label="用户名" :disabled="current?.username === demoAccount" required />
        <FieldControl v-model="draft.unit" type="select" label="所属组织" placeholder="请选择" :options="[demoUnit]" required />
        <FieldControl v-model="draft.role" type="select" label="角色" placeholder="请选择" :options="roles" required />
        <FieldControl v-model="draft.name" label="使用人" required />
        <FieldControl v-model="draft.tag" label="标签" />
        <FieldControl v-model="draft.phone" label="联系方式" type="tel" />
        <FieldControl v-model="draft.status" type="select" label="账号状态" :options="['启用', '停用']" required />
        <FieldControl v-model="draft.remark" type="textarea" label="备注" />
      </template>
      <p v-if="error" class="mg-error" role="alert">{{ error }}</p>
    </form>
    <template #actions>
      <button type="submit" form="user-editor" class="mg-button primary">确定</button>
      <button type="button" class="mg-button" @click="dialogOpen = false">取消</button>
    </template>
  </AppDialog>
</template>

<style scoped>
.users-body { display: flex; flex-direction: column; gap: 12px; }
.user-actions { margin-left: auto; }
.user-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-control);
  background: var(--color-canvas);
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 600;
}
.user-status.enabled { background: var(--color-positive-soft); color: var(--color-positive); }

@media (max-width: 1023px) {
  .user-actions { margin-left: 0; justify-content: flex-start; }
}
</style>
