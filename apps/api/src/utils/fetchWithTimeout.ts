import { AppError } from './AppError'

const DEFAULT_TIMEOUT_MS = 12_000

// 統一限制第三方 HTTP 請求時間，避免上游卡住時耗盡 API 連線。
export async function fetchWithTimeout(
  input: string | URL,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
) {
  try {
    return await fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(timeoutMs) })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new AppError(504, 'UPSTREAM_TIMEOUT', '第三方服務回應逾時，請稍後再試')
    }
    throw new AppError(502, 'UPSTREAM_ERROR', '無法連線到第三方服務')
  }
}
