// 行程狀態：當前選中的 trip detail 與載入狀態
import { create } from 'zustand'
import { tripService } from '@/services/tripService'
import type { TripDetail, TripSummary } from '@/types/api'

interface TripState {
  trips: TripSummary[]
  currentTrip: TripDetail | null
  loading: boolean
  error: string | null
  loadTrips: () => Promise<void>
  loadDetail: (id: string) => Promise<void>
  clear: () => void
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  currentTrip: null,
  loading: false,
  error: null,

  async loadTrips() {
    set({ loading: true, error: null })
    try {
      const trips = await tripService.list()
      set({ trips, loading: false })
      // 自動載入第一筆的詳細資料（首頁要用）
      if (trips.length > 0 && !get().currentTrip) {
        await get().loadDetail(trips[0].id)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '載入失敗'
      set({ loading: false, error: msg })
    }
  },

  async loadDetail(id: string) {
    set({ loading: true, error: null })
    try {
      const trip = await tripService.detail(id)
      set({ currentTrip: trip, loading: false })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '載入失敗'
      set({ loading: false, error: msg })
    }
  },

  clear() {
    set({ trips: [], currentTrip: null, error: null })
  },
}))
