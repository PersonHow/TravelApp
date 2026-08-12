// 旅遊短句 API 封裝（AI 生成後存 DB，全家共用同一份）
import { apiFetch } from './api'
import type { Phrase } from '@/types/api'

export const phraseService = {
  list(tripId: string) {
    return apiFetch<Phrase[]>(`/api/trips/${tripId}/phrases`)
  },

  // 生成（或重新生成，舊的會被清掉）
  generate(tripId: string) {
    return apiFetch<Phrase[]>(`/api/trips/${tripId}/phrases/generate`, { method: 'POST' })
  },
}
