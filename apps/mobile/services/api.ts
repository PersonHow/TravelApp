// fetch 封裝：自動帶 token、處理統一錯誤格式、401 時自動用 refresh token 換新後重試
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

// 進行中的 refresh 請求：多個 401 同時發生時共用同一次 refresh（single-flight）
let refreshPromise: Promise<boolean> | null = null

// 用 refresh token 換新的雙 token。成功回 true；失敗（過期/無 token）回 false
function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const { refreshToken } = useAuthStore.getState()
      if (!refreshToken) return false
      try {
        const resp = await fetch(`${BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        const json = (await resp.json()) as ApiResponse<{
          accessToken: string
          refreshToken: string
        }>
        if (!json.success) return false
        useAuthStore.getState().setTokens(json.data)
        return true
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

async function doFetch(path: string, opts: ApiOptions): Promise<Response> {
  const { method = 'GET', body, auth = true } = opts
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = useAuthStore.getState().accessToken
    if (token) headers.Authorization = `Bearer ${token}`
  }

  try {
    return await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', '無法連線到伺服器，請確認網路與後端是否啟動', 0)
  }
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  let resp = await doFetch(path, opts)

  // access token 過期：先嘗試 refresh，成功就帶新 token 重試一次
  if (resp.status === 401 && opts.auth !== false) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      resp = await doFetch(path, opts)
    } else {
      // refresh token 也失效：清掉登入狀態（讓 _layout 把使用者導回登入頁）
      useAuthStore.getState().logout()
    }
  }

  const json = (await resp.json()) as ApiResponse<T>

  if (!json.success) {
    throw new ApiError(json.error.code, json.error.message, resp.status)
  }

  return json.data
}
