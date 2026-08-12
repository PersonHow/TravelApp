// AI 規劃行程 API 封裝（兩段式：生成草稿 → 確認套用）
import { apiFetch } from './api'
import type {
  AiPlanDraft,
  AiPlanPreferencesPayload,
  ApplyAiPlanPayload,
  TripDay,
} from '@/types/api'

export const aiPlanService = {
  // 生成草稿（不寫 DB，回來先給使用者預覽）
  generate(tripId: string, payload: AiPlanPreferencesPayload) {
    return apiFetch<AiPlanDraft>(`/api/trips/${tripId}/ai-plan`, { method: 'POST', body: payload })
  },

  // 使用者確認後套用（寫入 TripDay / DayActivity）
  apply(tripId: string, payload: ApplyAiPlanPayload) {
    return apiFetch<TripDay[]>(`/api/trips/${tripId}/ai-plan/apply`, {
      method: 'POST',
      body: payload,
    })
  },
}
