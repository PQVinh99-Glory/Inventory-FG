<template>
  <Dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)" 
    modal 
    header="Cập Nhật Dữ Liệu Nguồn (MASTER DATA)" 
    :style="{ width: '90vw', maxWidth: '550px' }"
    @hide="onHide"
  >
    <div class="space-y-4 pt-2">
      <div class="p-5 border-2 border-dashed border-indigo-100 rounded-2xl bg-indigo-50/20 text-center">
        <label class="block text-xs font-bold text-indigo-600 mb-3 uppercase tracking-wider">
          Tải lên file: Stock Balance With Batch.csv
        </label>
        
        <input 
          type="file" 
          ref="fileInput" 
          accept=".csv" 
          @change="handleFileChange"
          class="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer text-slate-500 mx-auto"
        />

        <p class="text-[10px] text-slate-400 mt-3 font-medium">
          Lưu ý: Hành động này sẽ XÓA toàn bộ dữ liệu nguồn cũ và thay thế bằng dữ liệu mới.
        </p>
      </div>

      <!-- Tin nhắn trạng thái -->
      <p v-if="statusMsg" :class="['text-xs font-bold text-center h-4', statusClass]">{{ statusMsg }}</p>

      <!-- CSV Preview -->
      <div v-if="previewRows.length > 0" class="p-4 border border-indigo-100 rounded-xl bg-white space-y-3">
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xem trước file tải lên</p>
        <div class="p-2 bg-slate-50 rounded-lg text-xs font-bold text-center">
          Tổng số dòng đọc được: <span class="text-indigo-600 text-sm font-black">{{ totalCount }}</span>
        </div>

        <!-- Preview Table -->
        <div class="max-h-40 overflow-y-auto border border-slate-100 rounded-lg text-[9px]">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-50 sticky top-0 font-bold text-slate-500">
              <tr>
                <th class="p-2">Batch/Tag</th>
                <th class="p-2">Stock Code</th>
                <th class="p-2 text-right">Qty</th>
                <th class="p-2">WH</th>
                <th class="p-2">Create Date</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-600 font-mono">
              <tr v-for="(row, idx) in previewRows" :key="idx" class="hover:bg-slate-50/50">
                <td class="p-2 font-bold text-indigo-600">{{ row.batch }}</td>
                <td class="p-2">{{ row.stock_code }}</td>
                <td class="p-2 text-right font-sans font-bold text-slate-800">{{ row.qty }}</td>
                <td class="p-2">{{ row.warehouse }}</td>
                <td class="p-2">{{ row.create_date }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button 
          @click="submit" 
          :disabled="loading"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          {{ loading ? 'ĐANG LƯU HỆ THỐNG...' : `CẬP NHẬT LÊN SUPABASE (${totalCount} dòng)` }}
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Dialog from 'primevue/dialog'
import Papa from 'papaparse'
import { normalizeCsvData } from '@/services/csvNormalizer'

const props = defineProps<{
  visible: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'upload', payload: any[]): void
}>()

const fileInput = ref<any>(null)
const previewRows = ref<any[]>([])
const totalCount = ref(0)
const statusMsg = ref('')
const isError = ref(false)

let finalPayload: any[] = []

const statusClass = computed(() => isError.value ? 'text-rose-600' : 'text-indigo-600')

const handleFileChange = (event: any) => {
  const file = event.target.files[0]
  if (!file) return

  statusMsg.value = 'Đang đọc file...'
  isError.value = false
  previewRows.value = []

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      try {
        const rawRows = results.data as Record<string, any>[]
        const normalized = normalizeCsvData(rawRows, 'master_data')
        
        // Lọc các dòng hợp lệ phải có batch/tag_id
        finalPayload = normalized.filter(row => row.batch)

        if (finalPayload.length === 0) {
          statusMsg.value = 'File không có dữ liệu Batch/Tag ID hợp lệ!'
          isError.value = true
          return
        }

        totalCount.value = finalPayload.length
        previewRows.value = finalPayload.slice(0, 8)
        statusMsg.value = 'Đọc file hoàn tất. Vui lòng kiểm tra bản xem trước.'
      } catch (e: any) {
        statusMsg.value = 'Lỗi xử lý file: ' + e.message
        isError.value = true
      }
    },
    error: (err) => {
      statusMsg.value = 'Lỗi parse CSV: ' + err.message
      isError.value = true
    }
  })
}

const submit = () => {
  if (finalPayload.length === 0) return
  emit('upload', finalPayload)
}

const onHide = () => {
  previewRows.value = []
  totalCount.value = 0
  statusMsg.value = ''
  isError.value = false
  finalPayload = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>
