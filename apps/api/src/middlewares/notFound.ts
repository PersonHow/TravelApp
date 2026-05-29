import type { Request, Response } from 'express'
import type { ApiErrorBody } from '../types/api'

// 找不到對應路由時的統一回應
export const notFound = (req: Request, res: Response) => {
  const body: ApiErrorBody = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `找不到路徑：${req.method} ${req.originalUrl}`,
    },
  }
  res.status(404).json(body)
}
