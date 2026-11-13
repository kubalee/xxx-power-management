import { icons } from './icons.js'

export const homeLink = { name: 'home', label: '首页', path: '/singlehome' }

export const sections = [
  {
    name: 'monitor', label: '监测中心',
    pages: [
      { name: 'monitor', label: '监测管理', path: '/stationList', icon: icons.monitor },
      { name: 'reports', label: '评估报告', path: '/reportList', icon: icons.report },
      { name: 'monitor-data', label: '数据详情', path: '/datalist', icon: icons.data },
      { name: 'energy-monitoring', label: '能源监测', path: '/powerWatch', icon: icons.energy },
    ],
  },
  {
    name: 'alarms', label: '异常中心',
    pages: [
      { name: 'alarms', label: '用电告警', path: '/electricWarn', icon: icons.alarm },
      { name: 'environment-alarms', label: '环境告警', path: '/environmentWarn', icon: icons.environment },
      { name: 'hazard-alerts', label: '隐患预警', path: '/hiddenWarn', icon: icons.hazard },
    ],
  },
  {
    name: 'devices', label: '设备中心',
    pages: [
      { name: 'devices', label: '设备管理', path: '/deviceManger', icon: icons.device },
      { name: 'maintenance', label: '设备运维', path: '/deviceOps', icon: icons.maintenance },
    ],
  },
  {
    name: 'settings', label: '配置管理',
    pages: [
      { name: 'settings', label: '用户管理', path: '/userManage', icon: icons.user },
      { name: 'roles', label: '角色管理', path: '/roleManage', icon: icons.role },
      { name: 'organizations', label: '组织管理', path: '/orgManage', icon: icons.organization },
      { name: 'hazard-config', label: '隐患配置', path: '/hiddenManage', icon: icons.hazard },
      { name: 'sms-config', label: '短信配置', path: '/noteManage', icon: icons.message },
      { name: 'push-config', label: '推送配置', path: '/sendManger', icon: icons.notification },
      { name: 'logs', label: '日志管理', path: '/logManage', icon: icons.logs },
    ],
  },
]
