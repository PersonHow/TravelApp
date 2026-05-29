// 統一 API 回應格式（對應 CLAUDE.md 規範）

// 成功：{ success: true, data: ... }
export interface ApiSuccess<T> {
  success: true
  data: T
}

// 失敗：{ success: false, error: { code, message } }
export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody
