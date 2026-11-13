import { reactive } from 'vue'
import { demoAccount, demoUser } from './session.js'

export const demoUnit = '平台对接设备'
export const demoDeviceName = '演示楼1层总电箱'
export const demoPointName = '演示楼1层总电箱第1回路'
export const demoImei = '0000000DEMO0066'

export const devices = reactive([
  {
    id: 'device-1', name: demoDeviceName, imei: demoImei, model: 'B1',
    circuits: 1, circuitType: 'L型', unit: demoUnit, enabled: '启用',
    position: '0d00', connection: '已连接', online: '在线', protocol: '2',
    updated: '2026-11-11 09:37:27', offlineTime: '--',
  },
])

export const points = reactive([
  {
    id: 'point-1', deviceId: 'device-1', name: demoPointName,
    unit: demoUnit, circuit: '1001-1', group: '默认', category: '默认',
    hazard: '', status: '运行正常', signal: 3,
  },
])

const alarmTime = '2023-09-06 08:30:54'
export const alarms = reactive([
  {
    id: 'alarm-c', pointId: 'point-1', deviceId: 'device-1', type: '欠压故障',
    name: 'C相电压欠压', value: '0.0', time: alarmTime, status: '已排查',
    count: 1123, mark: '存在误报源', remark: '', home: true, pointName: demoPointName, imei: demoImei,
  },
  {
    id: 'alarm-a', pointId: 'point-1', deviceId: 'device-1', type: '欠压故障',
    name: 'A相电压欠压', value: '0.0', time: alarmTime, status: '已处理',
    count: 1122, mark: '存在误报源', remark: '', home: false, pointName: demoPointName, imei: demoImei,
  },
  {
    id: 'alarm-b', pointId: 'point-1', deviceId: 'device-1', type: '欠压故障',
    name: 'B相电压欠压', value: '0.0', time: alarmTime, status: '未处理',
    count: 1122, mark: '', remark: '', home: true, pointName: demoPointName, imei: demoImei,
  },
])

export const users = reactive([
  {
    id: 'user-1', username: demoAccount, unit: demoUnit, role: '单位负责人',
    name: demoUser, tag: '全部', phone: '', updated: '2026-11-11 09:38:00',
    status: '启用', remark: '',
  },
])

export function deviceById(id) {
  return devices.find((device) => device.id === id)
}

export function pointById(id) {
  return points.find((point) => point.id === id)
}

export function includesText(value, query) {
  return String(value).toLowerCase().includes(query.trim().toLowerCase())
}
