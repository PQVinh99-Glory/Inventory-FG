<template>
  <Dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)" 
    modal 
    header="Xác Nhận Xuất Nhanh" 
    :style="{ width: '90vw', maxWidth: '400px' }"
  >
    <div class="space-y-4 pt-2 text-center" v-if="target">
      <div class="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      
      <p class="text-xs text-slate-500 leading-relaxed">
        Bạn có chắc chắn muốn xuất nhanh sản phẩm này khỏi kho?
      </p>

      <div class="bg-slate-50 p-4 rounded-xl text-left text-xs font-bold text-slate-600 space-y-2 border border-slate-100">
        <div class="flex justify-between">
          <span class="text-slate-400">Tag ID:</span>
          <span class="font-mono text-indigo-600">{{ target.tag_id }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Vị trí (Bin):</span>
          <span class="font-mono">{{ target.bin || 'N/A' }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">Stock Code:</span>
          <span>{{ target.lp_no }}</span>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button 
          @click="$emit('cancel')" 
          class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
        >
          HỦY
        </button>
        <button 
          @click="$emit('confirm', target)" 
          class="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
        >
          XÁC NHẬN XUẤT
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { InventoryRow } from '@/types'

defineProps<{
  visible: boolean
  target: InventoryRow | null
}>()

defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'confirm', row: InventoryRow): void
  (e: 'cancel'): void
}>()
</script>
