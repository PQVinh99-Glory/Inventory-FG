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

  // Dữ liệu cho vòng trong (Nhóm rủi ro)
  const innerData = [
    {
      name: 'Lệch cao (>=5%)',
      value: highRiskTotalDiff,
      itemStyle: { color: '#f43f5e' } // Rose
    },
    {
      name: 'Lệch thấp (<5%)',
      value: lowRiskTotalDiff,
      itemStyle: { color: '#fbbf24' } // Amber/Yellow
    }
  ].filter(d => d.value > 0) // Loại bỏ nhóm có tổng lệch = 0

  // Dữ liệu cho vòng ngoài (Chi tiết các Feature)
  // Đặt màu cho các feature thuộc nhóm lệch cao là các tông màu đỏ/hồng, lệch thấp là các tông màu vàng/cam
  const outerData = [
    ...highRiskFeatures.map((item, idx) => ({
      ...item,
      itemStyle: {
        color: `hsl(350, 85%, ${65 - (idx * 5) % 25}%)` // Tông đỏ nhạt dần
      }
    })),
    ...lowRiskFeatures.map((item, idx) => ({
      ...item,
      itemStyle: {
        color: `hsl(45, 90%, ${60 - (idx * 5) % 20}%)` // Tông vàng nhạt dần
      }
    }))
  ]

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
        radius: [0, '40%'],
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
        radius: ['50%', '70%'],
        labelLine: {
          length: 15,
          length2: 10,
          lineStyle: {
            color: '#cbd5e1'
          }
        },
        label: {
          formatter: '{b}',
          color: '#475569',
          fontSize: 11,
          fontWeight: 'medium'
        },
        data: outerData
      }
    ]
  }
})
</script>
