<template>
  <div class="glass-card-light p-5 flex flex-col gap-4">
    <!-- Grid Header -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-3">
      <div>
        <p class="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Bảng Chi Tiết</p>
        <h2 class="text-base font-extrabold text-slate-800 uppercase tracking-tight">
          Tồn Kho Thành Phẩm
        </h2>
      </div>
      <div class="flex gap-3 w-full sm:w-auto">
        <button 
          @click="$emit('export')"
          class="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all btn-premium-light cursor-pointer shadow-sm"
        >
          <FileSpreadsheet class="w-3.5 h-3.5" />
          <span>XUẤT EXCEL</span>
        </button>
        <div class="relative flex-1 sm:w-72">
          <input 
            type="text" 
            v-model="quickFilterText"
            placeholder="Tìm nhanh Bin, Tag, Feature..." 
            class="w-full px-4 py-2.5 pl-9 border border-slate-200 rounded-xl text-xs outline-none bg-white text-slate-700 placeholder-slate-400 focus:ring-2 ring-indigo-400 transition-all"
          >
          <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>
    </div>

    <!-- AG Grid Container -->
    <div 
      class="ag-theme-quartz w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm"
      style="height: 580px;"
    >
      <ag-grid-vue
        class="w-full h-full"
        :columnDefs="columnDefs"
        :rowData="flattenedRowData"
        :defaultColDef="defaultColDef"
        :getRowId="getRowId"
        :getRowHeight="getRowHeight"
        :getRowClass="getRowClass"
        :animateRows="true"
        :gridOptions="gridOptions"
        @grid-ready="onGridReady"
        @first-data-rendered="onFirstDataRendered"
      />
    </div>

    <!-- Summary footer -->
    <div class="flex flex-wrap gap-x-4 gap-y-1 pt-1">
      <span class="text-[10px] text-slate-400 font-semibold">
        Tổng <span class="font-black text-slate-600">{{ props.data.length }}</span> dòng thực tế
      </span>
      <span class="text-[10px] text-slate-300">·</span>
      <span class="text-[10px] text-slate-400 font-semibold">
        <span class="font-black text-indigo-600">{{ uniqueFeatureCount }}</span> Feature
      </span>
      <span class="text-[10px] text-slate-300">·</span>
      <span class="text-[10px] text-slate-400 font-semibold">
        Actual <span class="font-black text-emerald-600">{{ formatNumber(totalActual) }}</span> PCS
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import { 
  ModuleRegistry, 
  ClientSideRowModelModule, 
  QuickFilterModule,
  ColumnAutoSizeModule,
  CellStyleModule,
  ValidationModule,
  ColDef,
  GridReadyEvent,
  type GridOptions,
} from 'ag-grid-community'
import { FileSpreadsheet, Search } from 'lucide-vue-next'
import type { InventoryRow } from '@/types'
import { formatNumber, formatDateTime } from '@/utils/format'

// Register AG Grid modules — only Community modules to avoid ResizeObserver errors
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  QuickFilterModule,
  ColumnAutoSizeModule,
  CellStyleModule,
  ValidationModule,
])

// =============================================
// ROW TYPE definition for flattened grouped data
// =============================================
interface GroupHeaderRow {
  _rowType: 'group'
  _rowId: string
  feature: string
  kienNum: number
  kienLabel: string
  totalQty: number
  lp_no?: string
  qty?: number
  warehouse?: string
  stock_in_date?: string
  create_date?: string
  tag_id?: string
  bin?: string
  inventory_id?: string
}

interface DataRow extends InventoryRow {
  _rowType: 'data'
  _rowId: string
  kienLabel: string
}

type FlatRow = GroupHeaderRow | DataRow

const props = defineProps<{ data: InventoryRow[] }>()
const emit = defineEmits<{
  (e: 'quick-out', row: InventoryRow): void
  (e: 'edit', row: InventoryRow): void
  (e: 'export'): void
}>()

const quickFilterText = ref('')
const gridApi = ref<any>(null)

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api
}
const onFirstDataRendered = () => {
  gridApi.value?.sizeColumnsToFit()
}

// =============================================
// COMPUTED: Feature metrics (số kiện theo brief)
// kien = sum(qty) / 2 / max(qty) theo feature
// =============================================
const featureMetrics = computed(() => {
  const metrics: Record<string, { sum: number; max: number }> = {}
  props.data.forEach(row => {
    const feat = row.feature
    if (!feat || feat === 'No data') return
    if (!metrics[feat]) metrics[feat] = { sum: 0, max: 0 }
    const qty = Number(row.qty) || 0
    metrics[feat].sum += qty
    if (qty > metrics[feat].max) metrics[feat].max = qty
  })
  return metrics
})

const uniqueFeatureCount = computed(() => Object.keys(featureMetrics.value).length)
const totalActual = computed(() => props.data.reduce((s, r) => s + (Number(r.qty) || 0), 0))

// =============================================
// FLATTENED ROW DATA: Group header + data rows
// Sắp xếp theo feature, mỗi group có 1 dòng header 
// =============================================
const flattenedRowData = computed((): FlatRow[] => {
  // Group by feature
  const groups: Record<string, InventoryRow[]> = {}
  const noFeatureRows: InventoryRow[] = []
  
  props.data.forEach(row => {
    const feat = row.feature
    if (!feat || feat === 'No data') {
      noFeatureRows.push(row)
      return
    }
    if (!groups[feat]) groups[feat] = []
    groups[feat].push(row)
  })

  const result: FlatRow[] = []

  // Sort features alphabetically
  const sortedFeatures = Object.keys(groups).sort()

  sortedFeatures.forEach(feature => {
    const rows = groups[feature]
    const m = featureMetrics.value[feature] || { sum: 0, max: 0 }
    const kienNum = m.max > 0 ? (m.sum / 2) / m.max : 0

    // Group header row
    result.push({
      _rowType: 'group',
      _rowId: `group-${feature}`,
      feature,
      kienNum,
      kienLabel: `${kienNum.toFixed(2)} Kiện`,
      totalQty: m.sum,
    } as GroupHeaderRow)

    // Data rows
    rows.forEach(row => {
      result.push({
        ...row,
        _rowType: 'data',
        _rowId: `data-${row.inventory_id || row.tag_id}`,
        kienLabel: `${kienNum.toFixed(2)} Kiện`,
      } as DataRow)
    })
  })

  // Append no-feature rows at the end
  noFeatureRows.forEach(row => {
    result.push({
      ...row,
      _rowType: 'data',
      _rowId: `data-noFeat-${row.inventory_id || row.tag_id}`,
      kienLabel: '—',
    } as DataRow)
  })

  return result
})

// Row ID for AG Grid stability
const getRowId = (params: any) => params.data._rowId

// Group header rows are taller
const getRowHeight = (params: any) => {
  return params.data?._rowType === 'group' ? 46 : 44
}

// CSS class for group rows
const getRowClass = (params: any) => {
  return params.data?._rowType === 'group' ? 'ag-group-header-row' : ''
}

// =============================================
// COLUMN DEFINITIONS
// =============================================
const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  floatingFilter: false,
  suppressMovable: true,
}

const columnDefs = ref<ColDef[]>([
  {
    headerName: 'STOCK CODE',
    field: 'lp_no',
    minWidth: 145,
    cellRenderer: (params: any) => {
      if (params.data?._rowType === 'group') {
        // Group header: show feature label with styling
        const f = params.data.feature
        const kien = params.data.kienLabel
        const total = formatNumber(params.data.totalQty)
        return `
          <div style="display:flex;align-items:center;gap:10px;height:100%">
            <div style="width:3px;height:22px;background:#6366f1;border-radius:3px;flex-shrink:0"></div>
            <span style="font-size:11px;font-weight:900;color:#3730a3;letter-spacing:0.05em;text-transform:uppercase">
              FEATURE: ${f}
            </span>
            <span style="font-size:10px;font-weight:700;color:#7c3aed;background:#ede9fe;padding:2px 9px;border-radius:20px;white-space:nowrap">
              ${kien}
            </span>
            <span style="font-size:12px;font-weight:900;color:#0f172a;margin-left:auto;padding-right:8px">
              ${total}
            </span>
          </div>
        `
      }
      // Normal data row
      const val = params.value
      if (!val || val === 'No data') {
        return '<span style="color:#ef4444;font-size:10px;font-weight:700;background:#fee2e2;padding:2px 6px;border-radius:5px">No Data</span>'
      }
      return `<span style="color:#64748b;font-weight:500;font-family:monospace;font-size:11px">${val}</span>`
    },
    colSpan: (params: any) => params.data?._rowType === 'group' ? 8 : 1,
  },
  {
    headerName: 'FEATURE',
    field: 'feature',
    width: 95,
    cellStyle: { fontWeight: '700', color: '#4f46e5', fontSize: '12px' },
  },
  {
    headerName: 'ACTUAL',
    field: 'qty',
    width: 105,
    type: 'numericColumn',
    valueFormatter: params => {
      if (params.data?._rowType === 'group') return ''
      return params.value != null ? formatNumber(params.value) : ''
    },
    cellStyle: { fontWeight: '900', color: '#0f172a', textAlign: 'right' },
  },
  {
    headerName: 'WAREHOUSE',
    field: 'warehouse',
    width: 110,
    cellRenderer: (params: any) => {
      if (params.data?._rowType === 'group') return ''
      const val = params.value
      if (!val || val === 'No data') {
        return '<span style="padding:2px 7px;background:#fee2e2;color:#dc2626;border-radius:6px;font-size:10px;font-weight:700">No Data</span>'
      }
      return `<span style="font-weight:700;color:#334155">${val}</span>`
    },
    cellStyle: { textAlign: 'center' },
  },
  {
    headerName: 'STOCK-UPDATE',
    field: 'stock_in_date',
    width: 155,
    valueFormatter: params => {
      if (params.data?._rowType === 'group') return ''
      return formatDateTime(params.value)
    },
    cellStyle: { color: '#64748b', fontSize: '11px' },
  },
  {
    headerName: 'CREATEDATE',
    field: 'create_date',
    width: 110,
    valueFormatter: params => params.data?._rowType === 'group' ? '' : (params.value || ''),
    cellStyle: { color: '#94a3b8', fontSize: '11px' },
  },
  {
    headerName: 'TAG ID',
    field: 'tag_id',
    minWidth: 155,
    cellRenderer: (params: any) => {
      if (params.data?._rowType === 'group') return ''
      if (!params.value) return ''
      return `<span style="font-family:monospace;font-weight:700;color:#4f46e5;font-size:11px">${params.value}</span>`
    },
  },
  {
    headerName: 'BIN',
    field: 'bin',
    width: 100,
    valueFormatter: params => params.data?._rowType === 'group' ? '' : (params.value || 'N/A'),
    cellStyle: { fontFamily: 'monospace', color: '#475569', fontWeight: '600', fontSize: '11px' },
  },
  {
    headerName: 'HÀNH ĐỘNG',
    field: 'actions',
    width: 105,
    sortable: false,
    filter: false,
    cellRenderer: (params: any) => {
      if (params.data?._rowType === 'group' || !params.data) return ''
      const container = document.createElement('div')
      container.style.cssText = 'display:flex;gap:5px;align-items:center;justify-content:center;height:100%'

      const btnOut = document.createElement('button')
      btnOut.style.cssText = 'color:#ef4444;padding:5px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;cursor:pointer;display:flex;align-items:center;transition:background 0.15s'
      btnOut.title = 'Xuất Nhanh'
      btnOut.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
      btnOut.onmouseenter = () => { btnOut.style.background = '#fee2e2' }
      btnOut.onmouseleave = () => { btnOut.style.background = '#fef2f2' }
      btnOut.onclick = (e) => { e.stopPropagation(); emit('quick-out', params.data as InventoryRow) }

      const btnEdit = document.createElement('button')
      btnEdit.style.cssText = 'color:#d97706;padding:5px;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;cursor:pointer;display:flex;align-items:center;transition:background 0.15s'
      btnEdit.title = 'Sửa Nhanh'
      btnEdit.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`
      btnEdit.onmouseenter = () => { btnEdit.style.background = '#fef3c7' }
      btnEdit.onmouseleave = () => { btnEdit.style.background = '#fffbeb' }
      btnEdit.onclick = (e) => { e.stopPropagation(); emit('edit', params.data as InventoryRow) }

      container.appendChild(btnOut)
      container.appendChild(btnEdit)
      return container
    },
  },
])

const gridOptions: GridOptions = {
  suppressCellFocus: true,
  suppressRowClickSelection: true,
  overlayNoRowsTemplate: '<span style="color:#94a3b8;font-size:12px;font-style:italic">Không có dữ liệu tồn kho</span>',
}
</script>
