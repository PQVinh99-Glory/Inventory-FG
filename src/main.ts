import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

// Import CSS (including Tailwind CSS v4)
import './styles/index.css'

// ECharts Setup
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// Đăng ký các module ECharts cần dùng để tối ưu hóa bundle size
use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
])

const app = createApp(App)

// Sử dụng PrimeVue v4 cấu hình Aura theme
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: 'none' // Chỉ dùng theme sáng (Light Mode) theo giao diện luxury cũ
    }
  }
})

app.use(ToastService)
app.use(ConfirmationService)

// Đăng ký component ECharts toàn cục
app.component('v-chart', VChart)

app.mount('#app')
