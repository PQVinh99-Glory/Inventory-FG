<template>
  <div class="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-slate-50/50">
    <!-- PrimeVue Toast Host -->
    <Toast />
    <ConfirmDialog />

    <!-- Sidebar Navigation -->
    <AppSidebar 
      v-model="currentTab" 
      :lastSync="lastSync" 
      :loading="loading" 
      @refresh="loadAllData" 
    />

    <!-- Main Content wrapper -->
    <div class="flex-1 flex flex-col h-full overflow-hidden min-w-0">
      <main class="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 w-full">
        <div class="max-w-[1600px] mx-auto w-full h-full flex flex-col">
      
      <!-- Top Title and Info Bar (Desktop only) -->
      <div class="hidden lg:flex justify-between items-center mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">HỆ THỐNG GIÁM SÁT KHO</p>
          <h1 class="text-3xl font-black text-slate-800 tracking-tight uppercase">
            {{ currentTabName }}
          </h1>
        </div>
        <div class="text-right">
          <p class="text-xs font-semibold text-slate-400">Đồng bộ cuối lúc</p>
          <p class="text-sm font-black text-indigo-600">{{ lastSync }}</p>
        </div>
      </div>

      <!-- Tab Content Area with Transition -->
      
      
      <transition name="tab-fade" mode="out-in">
        <!-- 1. TAB DASHBOARD -->
        <div v-if="currentTab === 'dashboard'" class="space-y-8">
          <!-- KPI Cards -->
          <KpiCards :kpi="kpi" />

          <!-- Trung tâm cảnh báo rủi ro -->
          <section class="glass-card-light p-6 border-t-4 border-indigo-primary">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
              <h3 class="text-xs font-black text-slate-700 uppercase tracking-widest">
                Trung Tâm Cảnh Báo Rủi Ro (Discrepancy Control)
              </h3>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Nhóm 1: Ưu tiên xử lý -->
              <div class="bg-white/60 rounded-2xl p-5 border border-rose-100/80">
                <div class="flex items-center gap-2.5 mb-5 pb-3 border-b border-rose-100/50">
                  <span class="flex h-2.5 w-2.5 relative">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <h4 class="text-rose-600 font-extrabold uppercase text-[11px] tracking-wider">
                    Ưu Tiên Xử Lý (No Data & Tồn Thấp)
                  </h4>
                </div>
                
                <div class="space-y-5">
                  <div>
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2">
                      Tag ID Lỗi "No Data" (Bấm để xem vị trí)
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      <button 
                        v-for="tag in analysis.noData" 
                        :key="tag"
                        @click="showTagInfo(tag)" 
                        class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[10px] font-bold text-rose-600 transition-all cursor-pointer"
                      >
                        {{ tag }}
                      </button>
                      <span v-if="analysis.noData.length === 0" class="text-xs text-slate-400 italic">Hệ thống an toàn</span>
                    </div>
                  </div>
                  
                  <div>
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2">
                      Feature Tồn Thấp (Dưới 2 Kiện)
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      <span 
                        v-for="feat in analysis.lowStock" 
                        :key="feat"
                        class="px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-lg text-[10px] font-bold text-rose-500"
                      >
                        {{ feat }}
                      </span>
                      <span v-if="analysis.lowStock.length === 0" class="text-xs text-slate-400 italic">Đủ số lượng</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Nhóm 2: Theo dõi gần -->
              <div class="bg-white/60 rounded-2xl p-5 border border-amber-100/80">
                <div class="flex items-center gap-2.5 mb-5 pb-3 border-b border-amber-100/50">
                  <span class="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse"></span>
                  <h4 class="text-amber-600 font-extrabold uppercase text-[11px] tracking-wider">
                    Theo Dõi Gần (Trùng Tag & Sắp Hết)
                  </h4>
                </div>
                
                <div class="space-y-5">
                  <div>
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2">
                      Tag ID Bị Trùng trong Kho (Bấm để xem vị trí)
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      <button 
                        v-for="tag in analysis.duplicates" 
                        :key="tag"
                        @click="showTagInfo(tag)" 
                        class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-600 transition-all cursor-pointer"
                      >
                        {{ tag }}
                      </button>
                      <span v-if="analysis.duplicates.length === 0" class="text-xs text-slate-400 italic">Không phát hiện trùng</span>
                    </div>
                  </div>
                  
                  <div>
                    <p class="text-[10px] font-extrabold text-slate-400 uppercase mb-2">
                      Feature Sắp Hết (Từ 3 đến 5 Kiện)
                    </p>
                    <div class="flex flex-wrap gap-1.5">
                      <span 
                        v-for="feat in analysis.midStock" 
                        :key="feat"
                        class="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[10px] font-bold text-amber-500"
                      >
                        {{ feat }}
                      </span>
                      <span v-if="analysis.midStock.length === 0" class="text-xs text-slate-400 italic">Không có</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Charts Section -->
          <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="glass-card-light p-6 lg:col-span-2">
              <h3 class="text-xs font-black text-slate-700 uppercase mb-6 flex items-center gap-2">
                <span class="w-1 h-4 bg-indigo-500 rounded-full"></span>
                Actual vs iScala & Tỷ Lệ Chênh Lệch
              </h3>
              <ComparisonChart :data="summaryData" />
            </div>
            
            <div class="glass-card-light p-6">
              <h3 class="text-xs font-black text-slate-700 uppercase mb-6 flex items-center gap-2">
                <span class="w-1 h-4 bg-rose-500 rounded-full"></span>
                Phân Tích Rủi Ro Lệch Kho
              </h3>
              <RiskNestedPieChart :data="summaryData" />
            </div>
          </section>
        </div>

        <!-- 2. TAB DETAIL INVENTORY -->
        <div v-else-if="currentTab === 'inventory'" class="space-y-6">
          <!-- Control Bar for Inventory Modals -->
          <div class="flex flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <button 
              @click="showInboundModal = true"
              class="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all btn-premium-light cursor-pointer shadow-xs"
            >
              <PlusCircle class="w-4.5 h-4.5" />
              <span>NHẬP KHO (IN)</span>
            </button>
            <button 
              @click="showOutboundModal = true"
              class="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all btn-premium-light cursor-pointer shadow-xs"
            >
              <MinusCircle class="w-4.5 h-4.5" />
              <span>XUẤT KHO (OUT)</span>
            </button>
            <button 
              @click="showUploadModal = true"
              class="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all btn-premium-light cursor-pointer shadow-xs"
            >
              <UploadCloud class="w-4.5 h-4.5" />
              <span>CẬP NHẬT NGUỒN</span>
            </button>
          </div>

          <!-- Inventory Grid AG Grid component -->
          <InventoryGrid 
            :data="inventoryData" 
            @quick-out="triggerQuickOutbound"
            @edit="triggerEditInventory"
            @export="exportExcel"
          />
        </div>

        <!-- 3. TAB ACCESSORIES -->
        <div v-else-if="currentTab === 'accessories'" class="glass-card-light p-6 space-y-6">
          <!-- Accessories Header Controls -->
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="relative w-full sm:w-80">
              <input 
                type="text" 
                v-model="pkFilter"
                placeholder="Tìm nhanh Code, Bin..." 
                class="w-full px-4 py-2.5 pl-10 border border-slate-200 rounded-xl text-xs outline-none bg-white text-slate-700 placeholder-slate-400 focus:ring-2 ring-violet-500 transition-all"
              >
              <Search class="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
            <button 
              @click="showAccInboundModal = true"
              class="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-5 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all btn-premium-light cursor-pointer shadow-xs"
            >
              <PlusCircle class="w-4.5 h-4.5" />
              <span>NHẬP PHỤ KIỆN</span>
            </button>
          </div>

          <!-- Accessories Detail Table -->
          <div class="overflow-x-auto border border-slate-100 rounded-2xl bg-white/50">
            <table class="w-full text-left text-sm whitespace-nowrap border-collapse">
              <thead class="text-[10px] text-slate-500 uppercase bg-slate-50 sticky top-0 shadow-xs font-black">
                <tr>
                  <th class="px-6 py-4">Mã Phụ Kiện (Code)</th>
                  <th class="px-4 py-4 text-right">Số lượng (Qty)</th>
                  <th class="px-4 py-4 text-center">Vị trí (Bin)</th>
                  <th class="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-600">
                <tr 
                  v-for="row in filteredPkData" 
                  :key="row.id" 
                  class="hover:bg-violet-50/20 transition-colors"
                >
                  <td class="px-6 py-4 text-xs font-bold text-slate-700">{{ row.code }}</td>
                  <td class="px-4 py-4 text-right font-black text-violet-600">{{ formatNumber(row.qty) }}</td>
                  <td class="px-4 py-4 text-center text-slate-500 font-mono text-xs">{{ row.bin || 'N/A' }}</td>
                  <td class="px-6 py-4 text-center flex justify-center gap-2">
                    <button 
                      @click="triggerEditAccessory(row)" 
                      class="text-amber-600 p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-100 text-xs font-bold cursor-pointer transition-all"
                    >
                      Sửa
                    </button>
                    <button 
                      @click="triggerOutboundAccessory(row)" 
                      class="text-rose-600 p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-100 text-xs font-bold cursor-pointer transition-all"
                    >
                      Xuất
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredPkData.length === 0">
                  <td colspan="4" class="text-center py-8 text-slate-400 italic text-xs bg-slate-50/20">
                    Không tìm thấy phụ kiện phù hợp!
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </transition>

      <!-- ----------------------------------------- -->
      <!-- MODALS & DIALOGS HOSTS -->
      <!-- ----------------------------------------- -->

      <!-- 1. Inbound Inventory Modal -->
      <InboundModal 
        v-model:visible="showInboundModal"
        :inventory-data="inventoryData"
        @inbound="handleInboundSubmit"
        @import-csv="handleCsvImportSubmit"
      />

      <!-- 2. Outbound Inventory Modal -->
      <OutboundModal 
        v-model:visible="showOutboundModal"
        :inventory-data="inventoryData"
        :loading="loading"
        @outbound="handleOutboundSubmit"
      />

      <!-- 3. Quick Outbound Modal -->
      <QuickOutboundModal 
        v-model:visible="showQuickOutModal"
        :target="quickOutTarget"
        @cancel="showQuickOutModal = false"
        @confirm="handleQuickOutConfirm"
      />

      <!-- 4. Edit Inventory Modal -->
      <EditInventoryModal 
        v-model:visible="showEditInvModal"
        :target="editInvTarget"
        :loading="loading"
        @cancel="showEditInvModal = false"
        @save="handleEditInvSubmit"
      />

      <!-- 5. Upload Master CSV Modal -->
      <UploadMasterModal 
        v-model:visible="showUploadModal"
        :loading="loading"
        @upload="handleUploadMasterSubmit"
      />

      <!-- 6. Accessory Inbound Modal -->
      <AccessoryInboundModal 
        v-model:visible="showAccInboundModal"
        :unique-codes="uniqueCodes"
        :loading="loading"
        @cancel="showAccInboundModal = false"
        @save="handleAccInboundSubmit"
      />

      <!-- 7. Accessory Edit Modal -->
      <AccessoryEditModal 
        v-model:visible="showAccEditModal"
        :target="accEditTarget"
        :loading="loading"
        @cancel="showAccEditModal = false"
        @save="handleAccEditSubmit"
      />

      <!-- 8. Accessory Outbound Modal -->
      <AccessoryOutboundModal 
        v-model:visible="showAccOutModal"
        :target="accOutTarget"
        :loading="loading"
        @outbound-all="handleAccOutAll"
        @outbound-partial="handleAccOutPartial"
      />

      </div>
    </main>

    <!-- Footer Copyright -->
    <footer class="app-footer w-full mt-auto text-center py-3 bg-white/80 border-t border-slate-200/50 text-[10px] font-bold text-slate-400">
      ENGINEERED BY VINH © 2026 | DATA ANALYTICS SYSTEM.
    </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

// Icons
import { 
  PlusCircle, 
  MinusCircle, 
  UploadCloud, 
  Search 
} from 'lucide-vue-next'

// Sub-components
import AppSidebar from '@/components/layout/AppSidebar.vue'
import KpiCards from '@/components/kpi/KpiCards.vue'
import ComparisonChart from '@/components/charts/ComparisonChart.vue'
import RiskNestedPieChart from '@/components/charts/RiskNestedPieChart.vue'
import InventoryGrid from '@/components/inventory/InventoryGrid.vue'

// Modals
import InboundModal from '@/components/inventory/InboundModal.vue'
import OutboundModal from '@/components/inventory/OutboundModal.vue'
import QuickOutboundModal from '@/components/inventory/QuickOutboundModal.vue'
import EditInventoryModal from '@/components/inventory/EditInventoryModal.vue'
import UploadMasterModal from '@/components/inventory/UploadMasterModal.vue'
import AccessoryInboundModal from '@/components/accessories/AccessoryInboundModal.vue'
import AccessoryEditModal from '@/components/accessories/AccessoryEditModal.vue'
import AccessoryOutboundModal from '@/components/accessories/AccessoryOutboundModal.vue'

// Composables
import { useInventory } from '@/composables/useInventory'
import { useAccessories } from '@/composables/useAccessories'
import { exportToExcel } from '@/services/excelExport'
import { formatNumber } from '@/utils/format'
import { InventoryRow, HangPhuKienRow } from '@/types'

const toast = useToast()

// States
const currentTab = ref('dashboard')

// Composables states
const {
  loading,
  inventoryData,
  summaryData,
  kpi,
  analysis,
  lastSync,
  fetchInventory,
  inbound,
  importCsvData,
  deleteInventoryItem,
  editInventoryItem,
  replaceMasterData
} = useInventory()

const {
  accessoriesData,
  pkFilter,
  uniqueCodes,
  filteredPkData,
  fetchAccessories,
  inboundAccessory,
  editAccessory,
  deleteAccessory,
  outboundAccessoryPartial
} = useAccessories()

// Modal Triggers
const showInboundModal = ref(false)
const showOutboundModal = ref(false)
const showQuickOutModal = ref(false)
const showEditInvModal = ref(false)
const showUploadModal = ref(false)
const showAccInboundModal = ref(false)
const showAccEditModal = ref(false)
const showAccOutModal = ref(false)

// Active Modal Targets
const quickOutTarget = ref<InventoryRow | null>(null)
const editInvTarget = ref<InventoryRow | null>(null)
const accEditTarget = ref<HangPhuKienRow | null>(null)
const accOutTarget = ref<HangPhuKienRow | null>(null)

// Current Tab Name in Vietnamese
const currentTabName = computed(() => {
  switch (currentTab.value) {
    case 'dashboard': return 'Bảng Điều Khiển'
    case 'inventory': return 'Tồn Kho Thành Phẩm'
    case 'accessories': return 'Quản Lý Phụ Kiện'
    default: return ''
  }
})

// Load All System Data
const loadAllData = async () => {
  try {
    await Promise.all([
      fetchInventory(),
      fetchAccessories()
    ])
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi tải dữ liệu',
      detail: e.message || 'Không thể đồng bộ dữ liệu từ Supabase!',
      life: 5000
    })
  }
}

onMounted(() => {
  loadAllData()
})

// Click Tag Handler from Risk Alerts
const showTagInfo = (tag: string) => {
  const matches = inventoryData.value.filter(r => r.tag_id === tag)
  if (matches.length > 0) {
    const bins = matches.map(m => m.bin || 'Không rõ').join(', ')
    toast.add({
      severity: 'info',
      summary: `Chi Tiết Tag: ${tag}`,
      detail: `Đang ở vị trí (Bin): ${bins}`,
      life: 5000
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: `Chi Tiết Tag: ${tag}`,
      detail: 'Không tìm thấy vị trí của Tag này trong kho!',
      life: 4000
    })
  }
}

// Inbound Submission (Manual)
const handleInboundSubmit = async (payload: { tagId: string; bin: string; option: 'update' | 'insert' }) => {
  try {
    await inbound(payload.tagId, payload.bin, payload.option)
    toast.add({
      severity: 'success',
      summary: 'Nhập kho thành công',
      detail: `Đã nhập Tag ${payload.tagId} vào Bin ${payload.bin}`,
      life: 3000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi nhập kho',
      detail: e.message,
      life: 4000
    })
  }
}

// Inbound CSV Import
const handleCsvImportSubmit = async (rows: { tag_id: string; bin: string }[]) => {
  try {
    await importCsvData(rows)
    showInboundModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Nhập CSV thành công',
      detail: `Đã nhập thêm ${rows.length} dòng tồn kho`,
      life: 4000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi import CSV',
      detail: e.message,
      life: 4000
    })
  }
}

// Outbound Submission
const handleOutboundSubmit = async (inventoryId: string, tagId: string, bin: string) => {
  try {
    await deleteInventoryItem(inventoryId)
    toast.add({
      severity: 'success',
      summary: 'Xuất kho thành công',
      detail: `Đã xuất Tag ${tagId} từ Bin ${bin || 'N/A'}`,
      life: 3000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi xuất kho',
      detail: e.message,
      life: 4000
    })
  }
}

// Trigger Quick Outbound from Grid Row Button
const triggerQuickOutbound = (row: InventoryRow) => {
  quickOutTarget.value = row
  showQuickOutModal.value = true
}

const handleQuickOutConfirm = async (row: InventoryRow) => {
  try {
    await deleteInventoryItem(row.inventory_id)
    showQuickOutModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Xuất kho nhanh thành công',
      detail: `Đã xóa dòng Tag ${row.tag_id} khỏi kho`,
      life: 3000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi xuất kho nhanh',
      detail: e.message,
      life: 4000
    })
  }
}

// Trigger Edit Inventory Row
const triggerEditInventory = (row: InventoryRow) => {
  editInvTarget.value = row
  showEditInvModal.value = true
}

const handleEditInvSubmit = async (payload: { inventoryId: string; tagId: string; bin: string }) => {
  try {
    await editInventoryItem(payload.inventoryId, payload.tagId, payload.bin)
    showEditInvModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Cập nhật thành công',
      detail: 'Đã lưu thay đổi dòng tồn kho',
      life: 3000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi cập nhật',
      detail: e.message,
      life: 4000
    })
  }
}

// Upload Master Data
const handleUploadMasterSubmit = async (payload: any[]) => {
  try {
    await replaceMasterData(payload)
    showUploadModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Cập nhật nguồn thành công',
      detail: `Đã tải lên ${payload.length} dòng dữ liệu nguồn mới`,
      life: 4000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi cập nhật nguồn',
      detail: e.message,
      life: 4000
    })
  }
}

// --- PHỤ KIỆN HANDLERS ---

// Nhập kho phụ kiện
const handleAccInboundSubmit = async (payload: { code: string; qty: number; bin: string }) => {
  try {
    await inboundAccessory(payload.code, payload.qty, payload.bin)
    showAccInboundModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Nhập phụ kiện thành công',
      detail: `Đã nhập ${payload.qty} sản phẩm ${payload.code} vào Bin ${payload.bin}`,
      life: 3500
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi nhập phụ kiện',
      detail: e.message,
      life: 4000
    })
  }
}

// Chỉnh sửa phụ kiện
const triggerEditAccessory = (row: HangPhuKienRow) => {
  accEditTarget.value = row
  showAccEditModal.value = true
}

const handleAccEditSubmit = async (payload: { id: string; code: string; qty: number; bin: string }) => {
  try {
    await editAccessory(payload.id, payload.code, payload.qty, payload.bin)
    showAccEditModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Cập nhật phụ kiện thành công',
      detail: `Đã lưu thay đổi phụ kiện ${payload.code}`,
      life: 3000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi chỉnh sửa phụ kiện',
      detail: e.message,
      life: 4000
    })
  }
}

// Xuất kho phụ kiện
const triggerOutboundAccessory = (row: HangPhuKienRow) => {
  accOutTarget.value = row
  showAccOutModal.value = true
}

const handleAccOutAll = async (id: string) => {
  try {
    await deleteAccessory(id)
    showAccOutModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Xuất hết thành công',
      detail: 'Đã xóa phụ kiện khỏi kho',
      life: 3000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi xuất phụ kiện',
      detail: e.message,
      life: 4000
    })
  }
}

const handleAccOutPartial = async (id: string, currentQty: number, outQty: number) => {
  try {
    await outboundAccessoryPartial(id, currentQty, outQty)
    showAccOutModal.value = false
    toast.add({
      severity: 'success',
      summary: 'Xuất một phần thành công',
      detail: `Đã xuất ${outQty} sản phẩm phụ kiện`,
      life: 3000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi xuất một phần',
      detail: e.message,
      life: 4000
    })
  }
}

// Export Excel (từ Supabase View thực tế)
const exportExcel = () => {
  try {
    exportToExcel(inventoryData.value, summaryData.value, accessoriesData.value)
    toast.add({
      severity: 'success',
      summary: 'Đang tải báo cáo Excel',
      detail: 'Đã xuất dữ liệu thực tế từ Supabase thành công!',
      life: 3000
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Lỗi xuất báo cáo',
      detail: e.message || 'Không thể tạo file báo cáo!',
      life: 4000
    })
  }
}
</script>
