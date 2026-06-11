// 行程 API 封裝
import { apiFetch } from './api'
import type { TripDetail, TripSummary } from '@/types/api'

export const tripService = {
  list() {
    return apiFetch<TripSummary[]>('/api/trips')
  },

  detail(id: string) {
    return apiFetch<TripDetail>(`/api/trips/${id}`)
  },
}
