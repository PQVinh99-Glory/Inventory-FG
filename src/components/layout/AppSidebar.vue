<template>
  <!-- Mobile Header (chỉ hiển thị trên mobile) -->
  <header class="lg:hidden flex justify-between items-center bg-white p-4 shadow-sm sticky top-0 z-30">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 animate-sway">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
          <path d="M3 17H21V19H3V17Z" fill="#94a3b8"/>
          <rect x="4" y="6" width="16" height="11" rx="1" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
          <path d="M8 6V17" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
          <path d="M16 6V17" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
          <path d="M4 11H20" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div>
        <h1 class="text-xl font-extrabold text-slate-800">WMS <span class="text-indigo-600">FG</span></h1>
      </div>
    </div>
    <button @click="isOpen = !isOpen" class="p-2 text-slate-600 hover:text-indigo-600 focus:outline-none">
      <Menu v-if="!isOpen" class="w-6 h-6" />
      <X v-else class="w-6 h-6" />
    </button>
  </header>

  <!-- Mobile Sidebar Overlay -->
  <div 
    v-if="isOpen" 
    @click="isOpen = false" 
    class="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
  ></div>

  <!-- Main Sidebar Container -->
  <aside 
    :class="[
      'fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between w-64 bg-white/70 backdrop-blur-xl border-r border-white/50 transition-transform lg:translate-x-0 shadow-lg shadow-indigo-100/20',
      isOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:sticky lg:h-screen'
    ]"
  >
    <!-- Top Brand / Logo -->
    <div>
      <div class="flex items-center gap-4 p-6 border-b border-white/50">
        <div class="animate-sway w-12 h-12 flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-md">
            <path d="M3 17H21V19H3V17Z" fill="#94a3b8"/>
            <path d="M5 19H7V21H5V19ZM10 19H12V21H10V19ZM15 19H17V21H15V19ZM19 19H21V21H19V19Z" fill="#64748b"/>
            <rect x="4" y="6" width="16" height="11" rx="1" fill="#facc15" stroke="#ca8a04" stroke-width="1"/>
            <path d="M8 6V17" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
            <path d="M16 6V17" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 11H20" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
            <p class="text-[9px] font-bold text-indigo-500 tracking-wider uppercase">Inventory</p>
          </div>
          <h1 class="text-2xl font-black bg-gradient-to-r from-slate-800 to-indigo-800 bg-clip-text text-transparent tracking-tight">
            WMS <span class="text-indigo-600">FG</span>
            <span class="text-[10px] font-bold bg-indigo-100/80 text-indigo-700 px-1.5 py-0.5 rounded-full ml-1 align-middle shadow-sm">Pro</span>
          </h1>
        </div>
      </div>

      <!-- Navigation Menu Items -->
      <nav class="p-4 space-y-1">
        <button 
          v-for="item in menuItems" 
          :key="item.value"
          @click="selectTab(item.value)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
            modelValue === item.value 
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30' 
              : 'text-slate-600 hover:bg-white/60 hover:text-indigo-600 hover:shadow-sm'
          ]"
        >
          <component :is="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </div>

    <!-- Bottom Info & Action -->
    <div class="p-4 border-t border-white/50 bg-white/40">
      <!-- Sync Button -->
      <button 
        @click="$emit('refresh')"
        :disabled="loading"
        class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-indigo-100/50 text-indigo-700 rounded-xl text-xs font-bold shadow-sm hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
      >
        <RefreshCw :class="['w-4 h-4 text-slate-500', loading ? 'animate-spin' : '']" />
        <span>LÀM MỚI DỮ LIỆU</span>
      </button>

      <div class="mt-4 flex flex-col gap-1 text-[10px] font-bold text-slate-400">
        <div class="flex justify-between">
          <span>Đồng bộ cuối:</span>
          <span class="text-indigo-500">{{ lastSync }}</span>
        </div>
        <div class="text-center mt-2 border-t border-slate-200/50 pt-2 font-medium">
          WMS FG Pro &copy; 2026
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  Menu, 
  X, 
  RefreshCw,
  LayoutDashboard, 
  Package, 
  Boxes 
} from 'lucide-vue-next'

defineProps<{
  modelValue: string
  lastSync: string
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'refresh'): void
}>()

const isOpen = ref(false)

const menuItems = [
  { label: 'Bảng Điều Khiển', value: 'dashboard', icon: LayoutDashboard },
  { label: 'Tồn Kho Thành Phẩm', value: 'inventory', icon: Package },
  { label: 'Quản Lý Phụ Kiện', value: 'accessories', icon: Boxes }
]

const selectTab = (tab: string) => {
  emit('update:modelValue', tab)
  isOpen.value = false // Đóng menu mobile sau khi chọn
}
</script>
