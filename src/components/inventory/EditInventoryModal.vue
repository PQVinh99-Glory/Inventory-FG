<template>
  <Dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)" 
    modal 
    header="Sửa Nhanh Tồn Kho" 
    :style="{ width: '90vw', maxWidth: '400px' }"
    @hide="onHide"
  >
    <div class="space-y-4 pt-2" v-if="target">
      <div>
        <label class="text-[10px] font-extrabold text-slate-400 uppercase">Mã Tag ID</label>
        <InputText 
          v-model="tagId" 
          class="w-full mt-1 p-2.5 font-mono font-bold text-sm bg-white"
        />
      </div>
      <div>
        <label class="text-[10px] font-extrabold text-slate-400 uppercase">Vị trí (Bin)</label>
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
          LƯU THAY ĐỔI
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { InventoryRow } from '@/types'

const props = defineProps<{
  visible: boolean
  target: InventoryRow | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'save', payload: { inventoryId: string; tagId: string; bin: string }): void
  (e: 'cancel'): void
}>()

const tagId = ref('')
const bin = ref('')
const msg = ref('')

watch(() => props.target, (newTarget) => {
  if (newTarget) {
    tagId.value = newTarget.tag_id || ''
    bin.value = newTarget.bin || ''
    msg.value = ''
  }
}, { immediate: true })

const save = () => {
  if (!props.target) return
  
  const cleanTag = tagId.value.trim()
  const cleanBin = bin.value.trim()

  if (!cleanTag) {
    msg.value = 'Mã Tag ID không được để trống!'
    return
  }

  emit('save', {
    inventoryId: props.target.inventory_id,
    tagId: cleanTag,
    bin: cleanBin
  })
  msg.value = 'Đang lưu...'
}

const onHide = () => {
  msg.value = ''
}
</script>
