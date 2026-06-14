<template>
  <Dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)" 
    modal 
    header="Chỉnh Sửa Phụ Kiện" 
    :style="{ width: '90vw', maxWidth: '400px' }"
    @hide="onHide"
  >
    <div class="space-y-4 pt-2" v-if="target">
      <div>
        <label class="text-xs font-bold text-slate-400">Mã Phụ Kiện (Code)</label>
        <InputText 
          v-model="code" 
          class="w-full mt-1 p-2.5 font-bold text-sm bg-white"
        />
      </div>
      
      <div>
        <label class="text-xs font-bold text-slate-400">Số lượng (Qty)</label>
        <InputText 
          v-model="qtyStr" 
          type="number"
          class="w-full mt-1 p-2.5 font-bold text-sm bg-white"
        />
      </div>

      <div>
        <label class="text-xs font-bold text-slate-400">Vị trí (Bin)</label>
        <InputText 
          v-model="bin" 
          class="w-full mt-1 p-2.5 font-mono font-bold text-sm bg-white"
        />
      </div>

      <p v-if="msg" class="text-xs font-bold text-center h-4 text-emerald-600">{{ msg }}</p>

      <div class="flex gap-3 pt-2">
        <button 
          @click="$emit('cancel')" 
          class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
        >
          HỦY
        </button>
        <button 
          @click="save" 
          :disabled="loading"
          class="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          CẬP NHẬT
        </button>
      </div>
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
  (e: 'save', payload: { id: string; code: string; qty: number; bin: string }): void
  (e: 'cancel'): void
}>()

const code = ref('')
const qtyStr = ref('0')
const bin = ref('')
const msg = ref('')

watch(() => props.target, (newTarget) => {
  if (newTarget) {
    code.value = newTarget.code || ''
    qtyStr.value = String(newTarget.qty || 0)
    bin.value = newTarget.bin || ''
    msg.value = ''
  }
}, { immediate: true })

const save = () => {
  if (!props.target) return
  
  const cleanCode = code.value.trim()
  const cleanBin = bin.value.trim()
  const numQty = Number(qtyStr.value)

  if (!cleanCode) {
    msg.value = 'Mã phụ kiện không được để trống!'
    return
  }
  if (isNaN(numQty) || numQty < 0) {
    msg.value = 'Số lượng không được nhỏ hơn 0!'
    return
  }
  if (!cleanBin) {
    msg.value = 'Vị trí (Bin) không được để trống!'
    return
  }

  emit('save', {
    id: props.target.id,
    code: cleanCode,
    qty: numQty,
    bin: cleanBin
  })
  msg.value = 'Đang cập nhật...'
}

const onHide = () => {
  msg.value = ''
}
</script>
