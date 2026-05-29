import type { NextFunction, Request, Response } from 'express'
import { AppError } from '../utils/AppError'
import { verifyToken } from '../utils/jwt'

// 驗證 Authorization: Bearer <token>，通過後把 userId 掛到 req 上
// 同步拋出的錯誤會被 Express 自動轉交給 errorHandler
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw AppError.unauthorized('缺少 Authorization Bearer Token')
  }

  const token = header.slice('Bearer '.length)
  const payload = verifyToken(token)
  if (payload.type !== 'access') {
    throw AppError.unauthorized('需要 access token')
  }

  req.userId = payload.userId
  next()
}
