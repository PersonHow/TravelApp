// 家庭 API 封裝
import { apiFetch } from './api'
import type { CreateFamilyPayload, FamilyMemberWithUser, FamilyWithMembers } from '@/types/api'

export const familyService = {
  list() {
    return apiFetch<FamilyWithMembers[]>('/api/families')
  },

  create(payload: CreateFamilyPayload) {
    return apiFetch<FamilyWithMembers>('/api/families', { method: 'POST', body: payload })
  },

  // 用 email 邀請成員
  addMember(familyId: string, email: string) {
    return apiFetch<FamilyMemberWithUser>(`/api/families/${familyId}/members`, {
      method: 'POST',
      body: { email },
    })
  },
}
