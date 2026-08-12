import type { NextFunction, Request, Response } from 'express'
import type { ApiErrorBody } from '../types/api'
import { AppError } from '../utils/AppError'

// 統一錯誤處理：所有錯誤都輸出成 { success: false, error: { code, message } }
// 必須掛在所有路由之後（見 app.ts）
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // 已知的應用錯誤：直接使用其狀態碼與錯誤碼
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      success: false,
      error: { code: err.code, message: err.message },
    }
    res.status(err.statusCode).json(body)
    return
  }

  // 非預期錯誤：記錄完整內容，對外只回一般訊息
  console.error('[UnhandledError]', err)
  const body: ApiErrorBody = {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: '伺服器發生未預期的錯誤' },
  }
  res.status(500).json(body)
}
