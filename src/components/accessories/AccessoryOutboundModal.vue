<template>
  <Dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)" 
    modal 
    header="Xuất Kho Phụ Kiện" 
    :style="{ width: '90vw', maxWidth: '400px' }"
    @hide="onHide"
  >
    <div class="space-y-4 pt-2" v-if="target">
      <p class="text-xs text-slate-500 leading-relaxed">
        Bạn muốn xuất mã phụ kiện <span class="text-violet-600 font-bold">{{ target.code }}</span> tại vị trí <span class="text-violet-600 font-bold">{{ target.bin || 'N/A' }}</span>?
      </p>

      <div class="grid grid-cols-2 gap-3 pt-2">
        <button 
          @click="outAll"
          class="bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          XUẤT HẾT ({{ target.qty }})
        </button>
        <button 
          @click="showPartialInput = true" 
          class="bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
        >
          XUẤT 1 PHẦN
        </button>
      </div>

      <!-- Phần nhập số lượng xuất 1 phần -->
      <div v-if="showPartialInput" class="border-t border-slate-100 pt-4 mt-4 space-y-3">
        <div>
          <label class="text-xs font-bold text-slate-400">Số lượng muốn xuất (Tồn: {{ target.qty }})</label>
          <InputText 
            v-model="outQtyStr" 
            type="number"
            class="w-full mt-1 p-2.5 font-bold text-sm bg-white"
            placeholder="Nhập số lượng xuất..."
          />
        </div>
        <button 
          @click="submitPartial" 
          :disabled="loading"
          class="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
        >
          XÁC NHẬN XUẤT 1 PHẦN
        </button>
      </div>

      <p v-if="msg" class="text-xs font-bold text-center h-4 text-rose-600">{{ msg }}</p>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { HangPhuKienRow } from '@/types'

const props = defineProps<{
  visible: boolean
  target: HangPhuKienRow | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'outbound-all', id: string): void
  (e: 'outbound-partial', id: string, currentQty: number, outQty: number): void
  (e: 'cancel'): void
}>()

const showPartialInput = ref(false)
const outQtyStr = ref('')
const msg = ref('')

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    showPartialInput.value = false
    outQtyStr.value = ''
    msg.value = ''
  }
})

const outAll = () => {
  if (!props.target) return
  emit('outbound-all', props.target.id)
}

const submitPartial = () => {
  if (!props.target) return
  
  const numOutQty = Number(outQtyStr.value)
  const currentQty = Number(props.target.qty) || 0

  if (!outQtyStr.value || numOutQty <= 0) {
    msg.value = 'Số lượng xuất phải lớn hơn 0!'
    return
  }
  if (numOutQty > currentQty) {
    msg.value = 'Số lượng xuất không được lớn hơn số lượng tồn!'
    return
  }

  emit('outbound-partial', props.target.id, currentQty, numOutQty)
}

const onHide = () => {
  showPartialInput.value = false
  outQtyStr.value = ''
  msg.value = ''
}
</script>
