<template>
  <div class="w-full h-[400px]">
    <v-chart class="w-full h-full" :option="chartOption" :autoresize="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SummaryAnalysisRow } from '@/types'

const props = defineProps<{
  data: SummaryAnalysisRow[]
}>()

const chartOption = computed(() => {
  // Sắp xếp features theo thứ tự chữ cái
  const sortedData = [...props.data].sort((a, b) => a.feature.localeCompare(b.feature))
  
  const features = sortedData.map(d => d.feature)
  const actuals = sortedData.map(d => d.actual)
  const iscalas = sortedData.map(d => d.iscala)
  const diffs = sortedData.map(d => d.diff_percent)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#1e293b'
      }
    },
    legend: {
      data: ['Actual', 'iScala', 'Diff %'],
      top: 0,
      textStyle: {
        color: '#64748b',
        fontWeight: 'bold'
      }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '15%',
      top: '12%',
      containLabel: true
    },
    // zoom mượt trên Mobile/PDA bằng dataZoom
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        start: 0,
        end: 100
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        start: 0,
        end: 100,
        bottom: 5,
        height: 20,
        borderColor: 'transparent',
        fillerColor: 'rgba(99, 102, 241, 0.15)',
        textStyle: {
          color: '#94a3b8'
        }
      }
    ],
    xAxis: {
      type: 'category',
      data: features,
      axisLabel: {
        interval: 0,
        rotate: 45,
        color: '#64748b',
        fontWeight: 'bold'
      },
      axisLine: {
        lineStyle: {
          color: '#cbd5e1'
        }
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'PCS',
        nameTextStyle: {
          color: '#94a3b8',
          fontWeight: 'bold'
        },
        axisLabel: {
          color: '#64748b'
        },
        splitLine: {
          lineStyle: {
            type: 'dashed',
            color: '#f1f5f9'
          }
        }
      },
      {
        type: 'value',
        name: 'Diff %',
        nameTextStyle: {
          color: '#94a3b8',
          fontWeight: 'bold'
        },
        axisLabel: {
          formatter: '{value}%',
          color: '#64748b'
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: 'Actual',
        type: 'bar',
        data: actuals,
        itemStyle: {
          color: '#6366f1',
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 24
      },
      {
        name: 'iScala',
        type: 'bar',
        data: iscalas,
        itemStyle: {
          color: '#10b981',
          borderRadius: [4, 4, 0, 0]
        },
        barMaxWidth: 24
      },
      {
        name: 'Diff %',
        type: 'line',
        yAxisIndex: 1,
        data: diffs,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#f43f5e'
        },
        itemStyle: {
          color: '#f43f5e'
        }
      }
    ]
  }
})
</script>
