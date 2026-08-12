// 行程狀態：旅程列表（總覽頁用）+ 目前進入的 trip detail
// 新架構：登入後先到 /trips 總覽，點進旅程才由 trip/[id]/_layout 載入 detail
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
  // 新增/編輯/刪除後重抓當前行程（不動 loading，避免整頁閃 spinner）
  reloadCurrent: () => Promise<void>
  removeTrip: (id: string) => Promise<void>
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

  async reloadCurrent() {
    const current = get().currentTrip
    if (!current) return
    const trip = await tripService.detail(current.id)
    set({ currentTrip: trip })
  },

  async removeTrip(id: string) {
    await tripService.remove(id)
    set({
      trips: get().trips.filter((t) => t.id !== id),
      ...(get().currentTrip?.id === id ? { currentTrip: null } : {}),
    })
  },

  clear() {
    set({ trips: [], currentTrip: null, error: null })
  },
}))
