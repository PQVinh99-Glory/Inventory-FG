<template>
  <div class="w-full h-[400px] flex flex-col justify-center items-center">
    <div v-if="sortedData.length === 0" class="text-slate-400 text-xs italic text-center py-20">
      Không có dữ liệu lệch (Hệ thống khớp hoàn toàn).
    </div>
    <v-chart v-else class="w-full h-full" :option="chartOption" :autoresize="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SummaryAnalysisRow } from '@/types'

const props = defineProps<{
  data: SummaryAnalysisRow[]
}>()

const sortedData = computed(() => {
  return props.data.filter(d => d.actual !== d.iscala)
})

const chartOption = computed(() => {
  const diffData = sortedData.value

  // Phân loại dữ liệu
  const highRiskFeatures: any[] = []
  const lowRiskFeatures: any[] = []
  
  let highRiskTotalDiff = 0
  let lowRiskTotalDiff = 0

  diffData.forEach(d => {
    const absDiff = Math.abs(d.diff)
    const absPercent = Math.abs(d.diff_percent)
    
    const item = {
      name: `${d.feature} (Lệch ${absDiff} PCS)`,
      value: absDiff
    }

    if (absPercent >= 5) {
      highRiskFeatures.push(item)
      highRiskTotalDiff += absDiff
    } else {
      lowRiskFeatures.push(item)
      lowRiskTotalDiff += absDiff
    }
  })

  // Distinct vivid colors for better visual reference
  const highRiskColors = ['#ef4444', '#f97316', '#f43f5e', '#ec4899', '#d946ef', '#db2777', '#dc2626']
  const lowRiskColors = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#14b8a6', '#6366f1', '#0ea5e9']

  // Dữ liệu cho vòng ngoài (Chi tiết các Feature)
  const outerData = [
    ...highRiskFeatures.map((item, idx) => ({
      ...item,
      itemStyle: {
        color: highRiskColors[idx % highRiskColors.length]
      }
    })),
    ...lowRiskFeatures.map((item, idx) => ({
      ...item,
      itemStyle: {
        color: lowRiskColors[idx % lowRiskColors.length]
      }
    }))
  ]

  // Dữ liệu cho vòng trong (Nhóm rủi ro)
  const innerData = [
    {
      name: 'Lệch cao (>=5%)',
      value: highRiskTotalDiff,
      itemStyle: { color: '#be123c' } // Dark Rose
    },
    {
      name: 'Lệch thấp (<5%)',
      value: lowRiskTotalDiff,
      itemStyle: { color: '#1d4ed8' } // Dark Blue
    }
  ].filter(d => d.value > 0)

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} PCS ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#1e293b'
      }
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      textStyle: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold'
      },
      type: 'scroll'
    },
    series: [
      // Vòng trong: Nhóm rủi ro
      {
        name: 'Nhóm Rủi Ro',
        type: 'pie',
        selectedMode: 'single',
        radius: ['10%', '35%'],
        label: {
          position: 'inner',
          fontSize: 10,
          color: '#fff',
          fontWeight: 'bold',
          formatter: '{b}'
        },
        labelLine: {
          show: false
        },
        data: innerData
      },
      // Vòng ngoài: Chi tiết các Feature
      {
        name: 'Chi tiết Feature',
        type: 'pie',
        radius: ['45%', '75%'],
        labelLine: {
          length: 10,
          length2: 5,
          lineStyle: {
            color: '#cbd5e1'
          }
        },
        label: {
          formatter: '{b}',
          color: '#475569',
          fontSize: 11,
          fontWeight: 'bold'
        },
        data: outerData
      }
    ]
  }
})
</script>
