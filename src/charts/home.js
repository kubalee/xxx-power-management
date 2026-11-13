import { graphic } from 'echarts/core'

const chartText = { fontFamily: 'Inter, Segoe UI, Microsoft YaHei, sans-serif', color: '#586b82' }
const gridLine = { lineStyle: { color: '#e4ebf3', width: 1 } }
const tooltip = { trigger: 'axis', confine: true, renderMode: 'richText', textStyle: { color: '#19283d' } }
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0') + ':00')
const days = Array.from({ length: 30 }, (_, index) => String(index + 1) + '日')
const months = Array.from({ length: 11 }, (_, index) => '2026-' + String(index + 1).padStart(2, '0'))
const previousDaily = { 20: .0005, 21: .006, 22: .14, 23: .001 }
const primary = '#255acb'
const positive = '#087c70'
const emptyColor = '#eaf0f7'

export const alarmColors = ['#bd6540', '#d79d39', '#4773ca', '#7a61b6', '#289187']

function line(name, data, color, area) {
  return {
    name,
    type: 'line',
    data,
    smooth: true,
    showSymbol: false,
    lineStyle: { color, width: 2 },
    itemStyle: { color },
    areaStyle: {
      color: new graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: area }, { offset: 1, color: 'transparent' },
      ]),
    },
  }
}

export function energyHistory(monthly) {
  const labels = monthly ? days : hours
  const current = labels.map((_, index) => monthly ? (index * 13 % 9 + 3) / 100 : Number(index === 8) * .02)
  const previous = labels.map((_, index) => monthly ? (index * 17 % 11 + 2) / 100 : (previousDaily[index] ?? 0))
  return {
    animation: false,
    textStyle: chartText,
    tooltip,
    grid: { left: 48, right: 18, top: 12, bottom: 30 },
    xAxis: {
      type: 'category', boundaryGap: false, data: labels,
      axisLine: { lineStyle: { color: '#dce6ef' } },
      axisTick: { show: false },
      axisLabel: { ...chartText, fontSize: 13, interval: monthly ? 3 : 2, hideOverlap: true },
    },
    yAxis: {
      type: 'value', min: 0, max: .15, interval: .03,
      axisLabel: { ...chartText, fontSize: 13 }, splitLine: gridLine,
    },
    series: [
      line('本期', current, primary, 'rgba(37, 90, 203, .16)'),
      line('上期', previous, positive, 'rgba(8, 124, 112, .18)'),
    ],
    media: [
      { query: { maxWidth: 530 }, option: { grid: { left: 41, right: 12 }, xAxis: { axisLabel: { interval: 4, fontSize: 11 } } } },
    ],
  }
}

export const hazardHistory = {
  animation: false,
  textStyle: chartText,
  tooltip,
  grid: { left: 30, right: 15, top: 15, bottom: 29 },
  xAxis: {
    type: 'category', boundaryGap: false, data: months,
    axisLine: { lineStyle: { color: '#dce6ef' } },
    axisTick: { show: false },
    axisLabel: { ...chartText, formatter: value => Number(value.slice(5)) + '月', interval: 1, hideOverlap: true },
  },
  yAxis: {
    type: 'value', min: 0, max: 4, interval: 1,
    axisLabel: chartText, splitLine: gridLine,
  },
  series: [line('隐患统计', months.map(() => 0), positive, 'rgba(8, 124, 112, .12)')],
}

function donut(data, showTooltip) {
  return {
    animation: false,
    tooltip: { show: showTooltip, trigger: 'item', confine: true, renderMode: 'richText', formatter: '{b}：{d}%' },
    series: [{
      type: 'pie',
      radius: ['66%', '84%'],
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scale: false },
      data,
    }],
  }
}

export function energyShare(sevenDays, pointName) {
  const value = pointName ? (sevenDays ? .66 : 2.12) : 1
  return donut([{
    name: pointName,
    value,
    itemStyle: { color: pointName ? positive : emptyColor },
  }], Boolean(pointName))
}

export function abnormalRing(types, counts) {
  const data = types.map((name, index) => ({
    name, value: counts[index], itemStyle: { color: alarmColors[index] },
  })).filter(item => item.value > 0)
  return data.length ? donut(data, true) : donut([{ value: 1, itemStyle: { color: emptyColor } }], false)
}
