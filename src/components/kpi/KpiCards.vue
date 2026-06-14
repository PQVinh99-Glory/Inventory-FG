<template>
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-6">
    <!-- KPI 1: Tổng tồn thực tế -->
    <div class="glass-card-light p-6 border-b-4 border-indigo-500 flex flex-col justify-between">
      <div>
        <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2 tracking-wider">Tổng Tồn Thực Tế</p>
        <h3 class="text-2xl sm:text-3xl font-black text-slate-800">{{ formatNumber(kpi.totalActual) }}</h3>
      </div>
      <p class="text-[9px] text-slate-500 mt-2 uppercase font-bold">PCS (Actual)</p>
    </div>

    <!-- KPI 2: Chênh lệch hệ thống -->
    <div :class="['glass-card-light p-6 border-b-4 flex flex-col justify-between', diffCardStyle.border]">
      <div>
        <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2 tracking-wider">Chênh Lệch Hệ Thống</p>
        <div class="flex flex-wrap items-baseline gap-2">
          <h3 :class="['text-2xl sm:text-3xl font-black', diffCardStyle.text]">
            {{ (kpi.diff > 0 ? '+' : '') + formatNumber(kpi.diff) }}
          </h3>
          <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full', diffCardStyle.badge]">
            {{ kpi.diffPercent }}
          </span>
        </div>
      </div>
      <p class="text-[9px] text-slate-500 mt-2 uppercase font-bold">vs iScala</p>
    </div>

    <!-- KPI 3: TagID Không khớp -->
    <div class="glass-card-light p-6 border-b-4 border-rose-500 flex flex-col justify-between">
      <div>
        <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2 tracking-wider">TagID Không khớp</p>
        <h3 class="text-2xl sm:text-3xl font-black text-rose-500">{{ kpi.noData }}</h3>
      </div>
      <p class="text-[9px] text-rose-400 mt-2 uppercase font-bold">No Data in System</p>
    </div>

    <!-- KPI 4: Cần chuyển kho -->
    <div class="glass-card-light p-6 border-b-4 border-amber-500 flex flex-col justify-between">
      <div>
        <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2 tracking-wider">Cần Chuyển Kho</p>
        <h3 class="text-2xl sm:text-3xl font-black text-amber-500">{{ kpi.move }}</h3>
      </div>
      <p class="text-[9px] text-amber-400 mt-2 font-bold">(WH 50 & 62)</p>
    </div>

    <!-- KPI 5: Trùng TagID -->
    <div class="glass-card-light p-6 border-b-4 border-red-600 flex flex-col justify-between">
      <div>
        <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2 tracking-wider">Trùng TagID</p>
        <h3 class="text-2xl sm:text-3xl font-black text-red-500">{{ kpi.duplicates }}</h3>
      </div>
      <p class="text-[9px] text-red-400 mt-2 uppercase font-bold">Verify required</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KpiState } from '@/types'
import { formatNumber } from '@/utils/format'

const props = defineProps<{
  kpi: KpiState
}>()

const diffCardStyle = computed(() => {
  const percent = parseFloat(props.kpi.diffPercent)
  const diffVal = props.kpi.diff
  
  if (diffVal === 0) {
    return {
      border: 'border-emerald-500',
      text: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-600'
    }
  } else if (Math.abs(percent) < 5) {
    return {
      border: 'border-amber-500',
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-600'
    }
  } else {
    return {
      border: 'border-rose-500',
      text: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-600'
    }
  }
})
</script>
