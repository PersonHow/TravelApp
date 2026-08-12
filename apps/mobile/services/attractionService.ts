// 景點搜尋 API 封裝（Google Places，後端未設金鑰時回 503）
import { apiFetch } from './api'
import type { AttractionSearchResult } from '@/types/api'

export const attractionService = {
  search(query: string) {
    return apiFetch<AttractionSearchResult[]>(
      `/api/attractions/search?query=${encodeURIComponent(query)}`,
    )
  },
}
