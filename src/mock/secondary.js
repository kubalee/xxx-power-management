import { reactive } from 'vue'
import { demoAccount } from './session.js'
import { demoImei, demoPointName, demoUnit } from './platform.js'

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function reportDateRange() {
  const today = new Date()
  return {
    start: dateFormatter.format(today.getTime() - 30 * 86_400_000),
    end: dateFormatter.format(today),
  }
}

export const hazardAlerts = [
  {
    id: 'hazard-1', unit: demoUnit, point: demoPointName, level: '早期风险',
    type: '早期隐患', status: '已处理', time: '2025-04-17 10:56:12', overdue: '1060天',
  },
  {
    id: 'hazard-2', unit: demoUnit, point: demoPointName, level: '一般风险',
    type: '设备故障隐患', status: '已处理', time: '2025-04-17 10:56:09', overdue: '1060天',
  },
]

const logDay = dateFormatter.format(new Date())
export const operationLogs = ['10:21:43', '10:18:48', '09:52:41', '09:43:55', '09:39:27']
  .map((time, index) => ({
    id: 'log-' + index,
    operator: demoAccount,
    platform: 'Web',
    content: '用户登录【终端地址: 192.0.2.' + (10 + index) + '】',
    time: logDay + ' ' + time,
  }))

export const deviceLogs = Array.from({ length: 10 }, (_, index) => ({
  id: 'device-log-' + index,
  operator: demoAccount,
  imei: demoImei,
  content: index % 2 === 0 ? '读取设备状态' : '设备数据同步',
  time: logDay + ' 09:' + (59 - index * 3) + ':12',
}))

export const permissionGroups = [
  { label: '首页' },
  { label: '监测管理', children: ['分组', '编辑', '删除'] },
  { label: '安全报告' },
  { label: '数据详情' },
  { label: '用电告警', children: ['处置'] },
  { label: '环境告警', children: ['处置'] },
  { label: '隐患预警', children: ['处置'] },
  { label: '设备管理', children: ['编辑'] },
  { label: '设备运维', children: ['查看'] },
  { label: '组织管理', children: ['编辑'] },
  { label: '用户管理', children: ['编辑'] },
  { label: '角色管理', children: ['编辑'] },
]

export const roles = reactive(['单位负责人', '单位安全员', '单位电工', '普通用户'].map((name, index) => ({
  id: 'role-' + index,
  name,
  type: '单位角色',
  remark: '',
  permissions: permissionGroups.slice(0, index === 0 ? permissionGroups.length : 4).map(group => group.label),
})))

export const organizations = reactive([{ id: 'demo-org', name: demoUnit, remark: '' }])
export const smsSettings = reactive({})
export const pushSettings = reactive({})
