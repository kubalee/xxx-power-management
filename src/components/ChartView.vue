<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { init, use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GraphicComponent, GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, PieChart, GraphicComponent, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  option: { type: Object, required: true },
  label: { type: String, required: true },
})
const element = ref(null)
let chart
let observer

onMounted(() => {
  chart = init(element.value)
  chart.setOption(props.option)
  observer = new ResizeObserver(() => {
    chart.resize()
    if (props.option.media) chart.setOption(props.option, { notMerge: true })
  })
  observer.observe(element.value)
})

watch(() => props.option, (option) => chart?.setOption(option, { notMerge: true }))

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
})
</script>

<template>
  <div ref="element" class="chart" role="img" :aria-label="label"></div>
</template>

<style scoped>
.chart { width: 100%; height: 100%; min-width: 0; min-height: 0; }
</style>
