// fetch 封裝：自動帶 token、處理統一錯誤格式
import { useAuthStore } from '@/store/useAuthStore'
import type { ApiResponse } from '@/types/api'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  // 是否帶上 access token（auth 端點除外）
  auth?: boolean
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = useAuthStore.getState().accessToken
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let resp: Response
  try {
    resp = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw new ApiError('NETWORK_ERROR', '無法連線到伺服器，請確認網路與後端是否啟動', 0)
  }

  const json = (await resp.json()) as ApiResponse<T>

  if (!json.success) {
    // 401 視為 token 失效，清掉登入狀態（讓 _layout 把使用者導回登入頁）
    if (resp.status === 401) {
      useAuthStore.getState().logout()
    }
    throw new ApiError(json.error.code, json.error.message, resp.status)
  }

  return json.data
}
