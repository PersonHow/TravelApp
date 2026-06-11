// 認證 API 封裝
import { apiFetch } from './api'
import type { AuthResponse } from '@/types/api'

export const authService = {
  login(email: string, password: string) {
    return apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    })
  },

  register(email: string, password: string, name: string) {
    return apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { email, password, name },
      auth: false,
    })
  },
}
