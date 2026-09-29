// 航班搜尋 API 封裝（AviationStack，後端未設金鑰時回 503）
import { apiFetch } from './api'
import type { FlightSearchResult } from '@/types/api'

export const flightSearchService = {
  search(flightNumber: string) {
    return apiFetch<FlightSearchResult[]>(
      `/api/flights/search?flightNumber=${encodeURIComponent(flightNumber)}`,
    )
  },
}
