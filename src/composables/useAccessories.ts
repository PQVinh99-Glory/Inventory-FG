import { ref, computed } from 'vue'
import { supabase } from '@/services/supabase'
import { HangPhuKienRow } from '@/types'

export function useAccessories() {
  const loading = ref(false)
  const accessoriesData = ref<HangPhuKienRow[]>([])
  const pkFilter = ref('')

  // Danh sách các mã phụ kiện không trùng để phục vụ dropdown autocomplete gợi ý
  const uniqueCodes = computed(() => {
    const codes = accessoriesData.value.map(a => a.code).filter(Boolean)
    return Array.from(new Set(codes))
  })

  const filteredPkData = computed(() => {
    if (!pkFilter.value) return accessoriesData.value
    const kw = pkFilter.value.toLowerCase()
    return accessoriesData.value.filter(
      r =>
        r.code.toLowerCase().includes(kw) ||
        (r.bin && r.bin.toLowerCase().includes(kw))
    )
  })

  const fetchAccessories = async () => {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('hang_phu_kien')
        .select('*')
        .order('code', { ascending: true })
      if (error) throw error
      accessoriesData.value = data as HangPhuKienRow[]
    } catch (e: any) {
      console.error(e)
      throw new Error(e.message || 'Lỗi tải danh sách phụ kiện')
    } finally {
      loading.value = false
    }
  }

  // Nhập kho phụ kiện
  const inboundAccessory = async (code: string, qty: number, bin: string) => {
    loading.value = true
    try {
      // Tìm xem đã tồn tại phụ kiện cùng code và cùng vị trí (bin) chưa
      const { data: exist, error: fetchErr } = await supabase
        .from('hang_phu_kien')
        .select('*')
        .eq('code', code)
        .eq('bin', bin)
        .maybeSingle()

      if (fetchErr) throw fetchErr

      if (exist) {
        // Cập nhật tăng số lượng
        const { error: updateErr } = await supabase
          .from('hang_phu_kien')
          .update({ qty: Number(exist.qty) + qty })
          .eq('id', exist.id)
        if (updateErr) throw updateErr
      } else {
        // Tạo dòng mới
        const { error: insertErr } = await supabase
          .from('hang_phu_kien')
          .insert([{ code, qty, bin }])
        if (insertErr) throw insertErr
      }
      await fetchAccessories()
    } catch (e: any) {
      console.error(e)
      throw new Error(e.message || 'Lỗi nhập phụ kiện')
    } finally {
      loading.value = false
    }
  }

  // Chỉnh sửa phụ kiện
  const editAccessory = async (id: string, code: string, qty: number, bin: string) => {
    loading.value = true
    try {
      const { error } = await supabase
        .from('hang_phu_kien')
        .update({ code, qty, bin })
        .eq('id', id)
      if (error) throw error
      await fetchAccessories()
    } catch (e: any) {
      console.error(e)
      throw new Error(e.message || 'Lỗi cập nhật phụ kiện')
    } finally {
      loading.value = false
    }
  }

  // Xuất kho phụ kiện (Toàn bộ)
  const deleteAccessory = async (id: string) => {
    loading.value = true
    try {
      const { error } = await supabase
        .from('hang_phu_kien')
        .delete()
        .eq('id', id)
      if (error) throw error
      await fetchAccessories()
    } catch (e: any) {
      console.error(e)
      throw new Error(e.message || 'Lỗi xuất phụ kiện')
    } finally {
      loading.value = false
    }
  }

  // Xuất một phần phụ kiện
  const outboundAccessoryPartial = async (id: string, currentQty: number, outQty: number) => {
    loading.value = true
    try {
      const remaining = currentQty - outQty
      if (remaining < 0) {
        throw new Error('Số lượng xuất vượt quá tồn kho hiện tại!')
      }

      if (remaining === 0) {
        // Nếu xuất hết, xóa luôn dòng
        const { error } = await supabase
          .from('hang_phu_kien')
          .delete()
          .eq('id', id)
        if (error) throw error
      } else {
        // Cập nhật số lượng còn lại
        const { error } = await supabase
          .from('hang_phu_kien')
          .update({ qty: remaining })
          .eq('id', id)
        if (error) throw error
      }
      await fetchAccessories()
    } catch (e: any) {
      console.error(e)
      throw new Error(e.message || 'Lỗi xuất một phần phụ kiện')
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    accessoriesData,
    pkFilter,
    uniqueCodes,
    filteredPkData,
    fetchAccessories,
    inboundAccessory,
    editAccessory,
    deleteAccessory,
    outboundAccessoryPartial
  }
}
