<script setup>
import { computed, ref, watch } from 'vue'
import AppDialog from './AppDialog.vue'
import DataTable from './DataTable.vue'
import FieldControl from './FieldControl.vue'
import StatusTabs from './StatusTabs.vue'
import { includesText } from '../mock/platform.js'
import { organizations, permissionGroups, pushSettings, roles, smsSettings } from '../mock/secondary.js'
import { notify } from '../notifications.js'

const props = defineProps({
  screen: { type: String, required: true },
  title: { type: String, required: true },
})
const isRole = props.screen === 'roles'
const isOrg = props.screen === 'organizations'
const isHazard = props.screen === 'hazard-config'
const isSms = props.screen === 'sms-config'
const isPush = props.screen === 'push-config'
const heading = isPush ? '隐患配置' : props.title
const filter = ref('')
const roleId = ref('')
const orgId = ref(isOrg ? '' : organizations[0]?.id ?? '')
const visibleRoles = computed(() => roles.filter(role => includesText(role.name, filter.value)))
const visibleOrgs = computed(() => organizations.filter(org => includesText(org.name, filter.value)))
const selectedOrg = computed(() => organizations.find(org => org.id === orgId.value))

const blankRole = () => ({ name: '', type: '', remark: '', permissions: [] })
const roleDraft = ref(blankRole())
const editingRole = ref(false)
const roleTypes = ['单位角色', '平台角色']

function viewRole(role) {
  roleId.value = role?.id ?? ''
  roleDraft.value = role ? { ...role, permissions: [...role.permissions] } : blankRole()
  editingRole.value = false
}

function editRole(role) {
  viewRole(role)
  editingRole.value = true
}

function saveRole() {
  const draft = roleDraft.value
  const name = draft.name.trim()
  if (!name) {
    notify('请输入角色名称', 'warning')
    return
  }
  if (roles.some(role => role.name === name && role.id !== roleId.value)) {
    notify('角色名称已存在', 'warning')
    return
  }
  const current = roles.find(role => role.id === roleId.value)
  const saved = { ...draft, id: current?.id ?? crypto.randomUUID(), name }
  if (current) Object.assign(current, saved)
  else roles.push(saved)
  viewRole(saved)
  notify('保存成功')
}

function groupKeys(group) {
  return [group.label, ...(group.children ?? []).map(child => group.label + '/' + child)]
}

function groupChecked(group) {
  return groupKeys(group).every(key => roleDraft.value.permissions.includes(key))
}

function toggleGroup(group, checked) {
  const keys = groupKeys(group)
  const remaining = roleDraft.value.permissions.filter(permission => !keys.includes(permission))
  roleDraft.value.permissions = checked ? [...remaining, ...keys] : remaining
}

const hazards = [
  { key: 'index', label: '序号', width: '80px' },
  { key: 'level', label: '隐患等级' },
  { key: 'type', label: '隐患类型' },
  { key: 'time', label: '编辑时间' },
  { key: 'actions', label: '操作' },
]
const smsTab = ref('推送配置')
const smsDraft = ref({ unitManager: false, pointManager: false, recipients: [] })
const pushDraft = ref([])
const editingPush = ref(false)
const pushGroups = [
  { title: '隐患', options: ['隐患预警'] },
  { title: '告警', options: ['用电告警', '环境告警'] },
]

function resetSms() {
  const settings = smsSettings[orgId.value]
  smsDraft.value = {
    unitManager: settings?.unitManager ?? false,
    pointManager: settings?.pointManager ?? false,
    recipients: [...(settings?.recipients ?? [])],
  }
}

function resetPush() {
  pushDraft.value = [...(pushSettings[orgId.value] ?? [])]
  editingPush.value = false
}

watch(orgId, () => { resetSms(); resetPush() }, { immediate: true })

function saveSms() {
  if (!selectedOrg.value) return notify('请选择组织', 'warning')
  smsSettings[orgId.value] = { ...smsDraft.value, recipients: [...smsDraft.value.recipients] }
  notify('保存成功')
}

function savePush() {
  if (!selectedOrg.value) return notify('请选择组织', 'warning')
  pushSettings[orgId.value] = [...pushDraft.value]
  editingPush.value = false
  notify('保存成功')
}

const dialog = ref(false)
const dialogKind = ref('')
const deleteTarget = ref(null)
const newOrg = ref({ name: '', remark: '' })
const newRecipient = ref('')
const dialogTitle = computed(() => {
  if (dialogKind.value === 'org') return '新增组织'
  if (dialogKind.value === 'recipient') return '新增接收人员'
  return '删除确认'
})

function startAddOrg() {
  newOrg.value = { name: '', remark: '' }
  dialogKind.value = 'org'
  dialog.value = true
}

function addOrg() {
  const name = newOrg.value.name.trim()
  if (!name) return notify('请输入组织名称', 'warning')
  if (organizations.some(org => org.name === name)) return notify('组织名称已存在', 'warning')
  const org = { id: crypto.randomUUID(), name, remark: newOrg.value.remark }
  organizations.push(org)
  orgId.value = org.id
  filter.value = ''
  dialog.value = false
  notify('新增成功')
}

function askDelete(target) {
  if (!target) return notify('请选择组织', 'warning')
  dialogKind.value = 'delete'
  deleteTarget.value = target
  dialog.value = true
}

function removeEntry() {
  const target = deleteTarget.value
  const list = isRole ? roles : organizations
  const index = list.findIndex(row => row.id === target.id)
  if (index >= 0) list.splice(index, 1)
  if (isRole && roleId.value === target.id) viewRole(null)
  if (isOrg) {
    delete smsSettings[target.id]
    delete pushSettings[target.id]
    if (orgId.value === target.id) orgId.value = ''
  }
  dialog.value = false
  notify('删除成功')
}

function startAddRecipient() {
  if (smsDraft.value.recipients.length >= 10) return notify('最多可新增 10 个接收人员', 'warning')
  newRecipient.value = ''
  dialogKind.value = 'recipient'
  dialog.value = true
}

function addRecipient() {
  const phone = newRecipient.value.trim()
  if (!/^\+?[\d\s-]{5,18}$/.test(phone)) return notify('请输入有效的手机号', 'warning')
  if (smsDraft.value.recipients.includes(phone)) return notify('该接收人员已存在', 'warning')
  smsDraft.value.recipients.push(phone)
  dialog.value = false
}
</script>

<template>
  <section class="config-workspace" :class="screen">
    <div class="mg-card">
      <h1 class="mg-card-title">{{ heading }}</h1>
      <div v-if="isSms" class="sms-tab"><StatusTabs v-model="smsTab" :options="['推送配置']" label="短信设置" /></div>
    </div>

    <div class="config-columns">
      <aside class="mg-card config-list">
        <div class="config-list-title">
          <h2>{{ isRole ? '角色列表' : '组织列表' }}</h2>
          <div v-if="isRole || isOrg" class="list-actions">
            <button v-if="isOrg" type="button" class="mg-link" @click="askDelete(selectedOrg)">- 删除</button>
            <button type="button" class="mg-link" @click="isRole ? editRole(null) : startAddOrg()">+ 新建</button>
          </div>
        </div>
        <FieldControl
          v-if="isRole || isOrg" v-model="filter" width="100%"
          :placeholder="isRole ? '请输入关键字' : '输入关键字进行过滤'"
          class="config-filter"
        />
        <ul v-if="isRole" class="role-list">
          <li v-for="role in visibleRoles" :key="role.id" :class="{ selected: role.id === roleId }">
            <button type="button" class="list-entry" :aria-pressed="role.id === roleId" @click="viewRole(role)">{{ role.name }}</button>
            <button type="button" class="icon-action edit-icon" :aria-label="'编辑' + role.name" @click="editRole(role)"></button>
            <button type="button" class="icon-action delete-icon" :aria-label="'删除' + role.name" @click="askDelete(role)"></button>
          </li>
        </ul>
        <ul v-else class="org-list">
          <li v-for="org in visibleOrgs" :key="org.id" :class="{ selected: org.id === orgId }">
            <button type="button" class="list-entry" :aria-pressed="org.id === orgId" @click="orgId = org.id">{{ org.name }}</button>
          </li>
        </ul>
        <p v-if="!(isRole ? visibleRoles.length : visibleOrgs.length)" class="mg-empty">暂无数据</p>
      </aside>

      <div class="mg-card config-content">
        <form v-if="isRole" class="role-form" @submit.prevent="saveRole">
          <h2 class="subheading">角色信息</h2>
          <div class="role-fields">
            <FieldControl v-model="roleDraft.name" label="角色名称" width="100%" :disabled="!editingRole" required />
            <FieldControl v-model="roleDraft.type" label="角色类型" type="select" width="100%" placeholder="请选择" :options="roleTypes" :disabled="!editingRole" required />
            <FieldControl v-model="roleDraft.remark" label="角色备注" width="100%" :disabled="!editingRole" />
          </div>
          <h2 class="subheading">角色权限</h2>
          <div class="permission-scroll">
            <div class="permission-grid">
              <section v-for="group in permissionGroups" :key="group.label" class="permission-group">
                <label class="permission-heading">
                  <input type="checkbox" :checked="groupChecked(group)" :disabled="!editingRole" @change="toggleGroup(group, $event.target.checked)" />
                  {{ group.label }}
                </label>
                <label v-for="item in group.children" :key="item">
                  <input v-model="roleDraft.permissions" type="checkbox" :value="group.label + '/' + item" :disabled="!editingRole" />
                  {{ item }}
                </label>
              </section>
            </div>
          </div>
          <div v-if="editingRole" class="mg-toolbar form-actions">
            <button type="submit" class="mg-button primary">保存</button>
            <button type="button" class="mg-button" @click="viewRole(roles.find(role => role.id === roleId))">取消</button>
          </div>
        </form>

        <template v-if="isOrg && selectedOrg">
          <h2 class="subheading">组织信息</h2>
          <dl class="organization-details">
            <dt>组织名称</dt><dd>{{ selectedOrg.name }}</dd>
            <dt>备注</dt><dd>{{ selectedOrg.remark || '—' }}</dd>
          </dl>
        </template>

        <template v-if="isHazard">
          <h2 class="subheading">隐患列表</h2>
          <DataTable :columns="hazards" :rows="[]" min-width="620px" label="隐患列表" class="hazard-list" />
        </template>

        <div v-if="isSms" class="sms-form">
          <h2 class="subheading">隐患选择</h2>
          <h2 class="subheading">告警选择</h2>
          <h2 class="subheading">其它</h2>
          <h2 class="subheading">推送配置</h2>
          <p class="sms-recipient-title">接收人员</p>
          <div class="sms-recipients">
            <label><input v-model="smsDraft.unitManager" type="checkbox" />单位负责人</label>
            <label><input v-model="smsDraft.pointManager" type="checkbox" />监测点负责人</label>
            <button type="button" class="mg-link" @click="startAddRecipient">⊕ 新增其他（注：新增上限最多十个）</button>
          </div>
          <ul v-if="smsDraft.recipients.length" class="recipient-list">
            <li v-for="(phone, index) in smsDraft.recipients" :key="phone">
              {{ phone }}
              <button type="button" class="mg-link" :aria-label="'移除' + phone" @click="smsDraft.recipients.splice(index, 1)">移除</button>
            </li>
          </ul>
          <div class="mg-toolbar form-actions">
            <button type="button" class="mg-button primary" @click="saveSms">保存</button>
            <button type="button" class="mg-button" @click="resetSms">取消</button>
          </div>
          <p class="sms-quota">您的短信剩余额度/短信总额度：0/0</p>
        </div>

        <template v-if="isPush">
          <h2 class="subheading">免责申明</h2>
          <p class="push-notice">隐患和告警请根据单位实际情况谨慎配置，关闭得隐患和告警将不会上报至平台，如有因自行配置导致的隐患和告警没有上报，出现的安全事故问题请自行承担后果！</p>
          <div class="push-groups">
            <section v-for="group in pushGroups" :key="group.title" class="push-group">
              <h3>{{ group.title }}</h3>
              <label
                v-for="option in group.options.filter(item => editingPush || pushDraft.includes(item))" :key="option"
              >
                <input v-model="pushDraft" type="checkbox" :value="option" :disabled="!editingPush" />{{ option }}
              </label>
            </section>
          </div>
          <div class="mg-toolbar push-actions">
            <template v-if="editingPush">
              <button type="button" class="mg-button primary" @click="savePush">保存</button>
              <button type="button" class="mg-button" @click="resetPush">取消</button>
            </template>
            <button v-else type="button" class="mg-button primary" @click="editingPush = true">修改</button>
          </div>
        </template>
      </div>
    </div>

    <AppDialog v-model="dialog" :title="dialogTitle" width="520px" light>
      <form v-if="dialogKind === 'org'" id="config-entry-form" class="mg-form" @submit.prevent="addOrg">
        <FieldControl v-model="newOrg.name" label="组织名称" placeholder="请输入组织名称" required />
        <FieldControl v-model="newOrg.remark" label="备注" type="textarea" placeholder="请输入备注" />
      </form>
      <form v-else-if="dialogKind === 'recipient'" id="config-entry-form" class="mg-form" @submit.prevent="addRecipient">
        <FieldControl v-model="newRecipient" label="手机号" type="tel" placeholder="请输入手机号" required />
      </form>
      <p v-else class="mg-confirm">确认删除「{{ deleteTarget?.name }}」？</p>
      <template #actions>
        <button v-if="dialogKind === 'delete'" type="button" class="mg-button primary" @click="removeEntry">确定</button>
        <button v-else type="submit" class="mg-button primary" form="config-entry-form">确定</button>
        <button type="button" class="mg-button" @click="dialog = false">取消</button>
      </template>
    </AppDialog>
  </section>
</template>

<style scoped>
.config-workspace > .mg-card > .mg-card-title:only-child { border-bottom: 0; }
.config-columns {
  display: grid;
  grid-template-columns: clamp(204px, 16vw, 256px) minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  margin-top: 12px;
}
.config-list { padding: 14px; }
.config-list-title { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.config-list-title h2, .subheading { font-size: 15px; font-weight: 600; color: var(--color-text); }
.list-actions { display: flex; align-items: center; gap: 8px; }
.list-actions button { min-height: 32px; }
.config-filter { display: flex; }
.config-filter :deep(.mg-control) { font-size: 14px; }
.role-list, .org-list { display: grid; gap: 4px; margin-top: 10px; }
.role-list li, .org-list li {
  display: flex;
  align-items: center;
  min-width: 0;
  border-radius: var(--radius-control);
  color: var(--color-muted);
}
.role-list .selected, .org-list .selected { background: var(--color-primary-soft); color: var(--color-primary); }
.list-entry {
  flex: 1;
  min-width: 0;
  min-height: 36px;
  text-align: left;
  padding-inline: 8px;
  border-radius: var(--radius-control);
  overflow-wrap: anywhere;
}
.list-entry:hover, .icon-action:hover { background: var(--color-primary-soft); color: var(--color-primary); }
.icon-action {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-control);
  color: var(--color-muted);
  font: 16px "Element Icons";
}
.role-list .selected .icon-action { color: var(--color-primary); }
.edit-icon::before { content: '\e78c'; }
.delete-icon::before { content: '\e6d7'; }
.config-columns > .config-content { margin-top: 0; padding: 16px; }
.subheading { line-height: 22px; }
.role-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 10px 0 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}
.role-fields :deep(.mg-field) { display: grid; gap: 6px; }
.role-fields :deep(.mg-field-label) { font-size: 14px; }
.role-fields :deep(.mg-control:disabled) { background: var(--color-canvas); color: var(--color-muted); cursor: default; }
.permission-scroll { margin-top: 10px; }
.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 148px), 1fr));
  align-items: start;
  gap: 10px;
}
.permission-group {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
}
.permission-group label, .sms-recipients label, .push-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 6px 10px;
  overflow-wrap: anywhere;
}
.permission-group .permission-heading {
  border-bottom: 1px solid var(--color-border);
  border-radius: calc(var(--radius-control) - 1px) calc(var(--radius-control) - 1px) 0 0;
  background: var(--color-canvas);
  font-weight: 600;
}
.permission-group .permission-heading:only-child { border-bottom: 0; border-radius: inherit; }
.permission-group label:not(.permission-heading):has(input:disabled) { color: var(--color-muted); }
.config-content input[type='checkbox'] { margin: 0; width: 16px; height: 16px; flex: none; accent-color: var(--color-primary); }
.organization-details { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 10px 18px; margin-top: 12px; }
.organization-details dt { color: var(--color-muted); }
.organization-details dd { overflow-wrap: anywhere; }
.hazard-list { margin-top: 12px; }
.sms-tab { padding: 4px 16px 8px; }
.sms-form .subheading { margin-bottom: 12px; }
.sms-recipient-title { margin-bottom: 6px; color: var(--color-muted); }
.sms-recipients { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; }
.sms-recipients label { padding-inline: 0; }
.sms-recipients .mg-link { text-align: left; overflow-wrap: anywhere; }
.recipient-list li { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
.form-actions { margin-top: 14px; justify-content: flex-start; }
.sms-quota { margin-top: 14px; color: var(--color-muted); }
.push-notice {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-control);
  background: var(--color-warning-soft);
  color: var(--color-warning);
  line-height: 1.6;
}
.push-groups { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.push-group { padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-control); }
.push-group h3 { font-size: 14px; font-weight: 600; }
.push-group label { padding-inline: 0; }
.push-actions { margin-top: 14px; }

@media (max-width: 1023px) {
  .config-columns { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .config-list, .config-columns > .config-content { padding: 12px; }
  .list-entry, .icon-action, .list-actions button { min-height: 44px; }
  .icon-action { width: 44px; }
  .role-fields { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .permission-group label, .sms-recipients label, .push-group label { min-height: 44px; }
  .sms-tab { padding: 0 12px 6px; }
  .sms-recipients .mg-link { min-height: 44px; }
}
</style>
