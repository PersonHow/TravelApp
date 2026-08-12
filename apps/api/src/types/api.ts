// 統一 API 回應格式：改由 packages/shared-types 提供（前後端共用）
// 保留這個檔案讓既有的 '../types/api' import 路徑不變
export type { ApiErrorBody, ApiResponse, ApiSuccess } from '@travel-app/shared-types'
