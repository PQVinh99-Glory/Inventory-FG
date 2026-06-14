<template>
  <Dialog 
    :visible="visible" 
    @update:visible="$emit('update:visible', $event)" 
    modal 
    header="Nhập Kho Thành Phẩm (INBOUND)" 
    :style="{ width: '90vw', maxWidth: '550px' }"
    :breakpoints="{ '960px': '75vw', '641px': '95vw' }"
  >
    <div class="space-y-6 pt-2">
      <!-- 1. Quét thủ công (Barcode / PDA Scan) -->
      <div class="p-5 border border-emerald-100 rounded-2xl bg-emerald-50/30">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <p class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            QUÉT THỦ CÔNG (BARCODE / PDA)
          </p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-[10px] font-extrabold text-slate-400 uppercase">Vị Trí (Bin)</label>
            <InputText 
              v-model="bin" 
              placeholder="Nhập hoặc quét Bin..." 
              class="w-full mt-1 p-2.5 font-mono font-bold text-sm bg-white"
              @keydown.enter="focusTag"
            />
          </div>
          <div>
            <label class="text-[10px] font-extrabold text-slate-400 uppercase">Tag ID</label>
            <InputText 
              ref="tagInput"
              v-model="tagId" 
              placeholder="Quét Tag ID (Nhấn Enter)..." 
              class="w-full mt-1 p-2.5 font-mono font-bold text-sm border-emerald-400 bg-white"
              @keydown.enter="handleManualInbound"
            />
          </div>
        </div>
        <p v-if="manualMsg" class="text-xs font-bold text-center mt-3 text-emerald-600">{{ manualMsg }}</p>
      </div>

      <!-- 2. Nhập file CSV -->
      <div class="p-5 border border-blue-100 rounded-2xl bg-blue-50/20">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-2 h-2 bg-blue-500 rounded-full"></span>
          <p class="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            NHẬP BẰNG FILE CSV
          </p>
        </div>
        
        <!-- File Picker -->
        <div class="flex flex-col gap-2">
          <input 
            type="file" 
            ref="fileInput" 
            accept=".csv" 
            @change="handleCsvSelected"
            class="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer text-slate-500"
          />
        </div>

        <!-- CSV Preview Section -->
        <div v-if="csvPreview" class="mt-4 p-4 border border-blue-100 rounded-xl bg-white space-y-3">
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Xem trước file tải lên</p>
          <div class="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div class="p-2 bg-slate-50 rounded-lg">
              <span class="block text-slate-500 font-medium">Tổng dòng</span>
              <span class="text-slate-800 text-sm font-black">{{ csvStats.total }}</span>
            </div>
            <div class="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <span class="block text-emerald-600 font-medium">Hợp lệ</span>
              <span class="text-emerald-800 text-sm font-black">{{ csvStats.valid }}</span>
            </div>
            <div class="p-2 bg-rose-50 rounded-lg text-rose-700">
              <span class="block text-rose-600 font-medium">Lỗi/Rỗng</span>
              <span class="text-rose-800 text-sm font-black">{{ csvStats.invalid }}</span>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="max-h-36 overflow-y-auto border border-slate-100 rounded-lg text-[10px]">
            <table class="w-full text-left border-collapse">
              <thead class="bg-slate-50 sticky top-0 font-bold text-slate-500">
                <tr>
                  <th class="p-2">Tag ID</th>
                  <th class="p-2">Bin</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-600">
                <tr v-for="(row, idx) in csvPreview" :key="idx" class="hover:bg-slate-50/50">
                  <td class="p-2 font-mono font-bold">{{ row.tag_id }}</td>
                  <td class="p-2 font-mono">{{ row.bin || 'N/A' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex gap-2">
            <button 
              @click="submitCsv"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              XÁC NHẬN TẢI LÊN ({{ csvStats.valid }} dòng)
            </button>
            <button 
              @click="cancelCsv"
              class="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 rounded-xl text-xs transition-all cursor-pointer"
            >
              HỦY
            </button>
          </div>
        </div>
      </div>
    </div>
  </Dialog>

  <!-- Conflict Confirmation Dialog (Đè lên Inbound Modal nếu trùng) -->
  <Dialog 
    v-model:visible="showConflict" 
    modal 
    header="Tag ID Đã Tồn Tại" 
    :style="{ width: '90vw', maxWidth: '400px' }"
    :closable="false"
  >
    <div class="space-y-4 pt-2 text-center">
      <div class="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-help-circle"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h4 class="text-base font-black text-slate-800">Xử Lý Tag ID Trùng</h4>
      <p class="text-xs text-slate-500 leading-relaxed">
        Tag ID <span class="font-bold text-slate-800">{{ conflictTag }}</span> hiện đang ở vị trí <span class="font-bold text-indigo-600">{{ conflictExistingBin }}</span>.
        Bạn muốn thay đổi vị trí cũ hay ghi nhận thêm tồn kho mới?
      </p>
      <div class="flex gap-3 pt-2">
        <button 
          @click="resolveConflict('update')" 
          class="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
        >
          ĐỔI VỊ TRÍ
        </button>
        <button 
          @click="resolveConflict('insert')" 
          class="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer"
        >
          GHI THÊM
        </button>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Papa from 'papaparse'
import { normalizeCsvData } from '@/services/csvNormalizer'
import { InventoryRow } from '@/types'

const props = defineProps<{
  visible: boolean
  inventoryData: InventoryRow[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'inbound', payload: { tagId: string; bin: string; option: 'update' | 'insert' }): void
  (e: 'import-csv', rows: { tag_id: string; bin: string }[]): void
}>()

const bin = ref('')
const tagId = ref('')
const manualMsg = ref('')

const tagInput = ref<any>(null)

// States xử lý trùng lặp Tag
const showConflict = ref(false)
const conflictTag = ref('')
const conflictExistingBin = ref('')

// States xử lý CSV Import Preview
const fileInput = ref<any>(null)
const csvPreview = ref<any[] | null>(null)
const csvStats = reactive({ total: 0, valid: 0, invalid: 0 })
let finalCsvRows: { tag_id: string; bin: string }[] = []

const focusTag = () => {
  if (tagInput.value) {
    tagInput.value.$el.focus()
  }
}

// Xử lý nhập kho thủ công
const handleManualInbound = () => {
  const cleanTag = tagId.value.trim()
  const cleanBin = bin.value.trim()

  if (!cleanBin) {
    manualMsg.value = 'Vui lòng nhập Vị Trí (Bin) trước!'
    return
  }
  if (!cleanTag) {
    manualMsg.value = 'Vui lòng nhập Tag ID!'
    return
  }

  manualMsg.value = 'Đang kiểm tra...'

  // Kiểm tra trùng Tag ID trong dữ liệu hiện tại
  const matched = props.inventoryData.find(item => item.tag_id === cleanTag)

  if (matched) {
    // Nếu trùng, mở dialog xác nhận trùng
    conflictTag.value = cleanTag
    conflictExistingBin.value = matched.bin || 'Không xác định'
    showConflict.value = true
    manualMsg.value = ''
  } else {
    // Không trùng, lưu luôn
    emit('inbound', { tagId: cleanTag, bin: cleanBin, option: 'insert' })
    tagId.value = ''
    manualMsg.value = 'Đã nhập thành công!'
    nextTick(() => {
      if (tagInput.value) tagInput.value.$el.focus()
    })
  }
}

// Xử lý lựa chọn từ Dialog trùng Tag ID
const resolveConflict = (option: 'update' | 'insert') => {
  emit('inbound', { 
    tagId: conflictTag.value, 
    bin: bin.value.trim(), 
    option 
  })
  showConflict.value = false
  tagId.value = ''
  manualMsg.value = option === 'update' ? 'Đã cập nhật vị trí mới!' : 'Đã ghi thêm dòng mới!'
  nextTick(() => {
    if (tagInput.value) tagInput.value.$el.focus()
  })
}

// Xử lý khi chọn file CSV
const handleCsvSelected = (event: any) => {
  const file = event.target.files[0]
  if (!file) return

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rawRows = results.data as Record<string, any>[]
      const normalized = normalizeCsvData(rawRows, 'inventory') as { tag_id: string; bin: string }[]
      
      finalCsvRows = normalized.filter(row => row.tag_id)
      const invalidCount = normalized.length - finalCsvRows.length

      csvStats.total = normalized.length
      csvStats.valid = finalCsvRows.length
      csvStats.invalid = invalidCount

      // Preview tối đa 8 dòng
      csvPreview.value = finalCsvRows.slice(0, 8)
    }
  })
}

const submitCsv = () => {
  if (finalCsvRows.length > 0) {
    emit('import-csv', finalCsvRows)
    cancelCsv()
  }
}

const cancelCsv = () => {
  csvPreview.value = null
  finalCsvRows = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>
