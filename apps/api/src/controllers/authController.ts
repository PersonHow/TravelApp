import type { Request, Response } from 'express'
import { authService } from '../services/authService'
import { AppError } from '../utils/AppError'

// 認證控制器
export const authController = {
  // POST /api/auth/register
  async register(req: Request, res: Response) {
    const { email, name, password } = req.body ?? {}
    if (!email || !name || !password) {
      throw AppError.badRequest('email、name、password 為必填')
    }
    const result = await authService.register({ email, name, password })
    res.status(201).json({ success: true, data: result })
  },

  // POST /api/auth/login
  async login(req: Request, res: Response) {
    const { email, password } = req.body ?? {}
    if (!email || !password) {
      throw AppError.badRequest('email、password 為必填')
    }
    const result = await authService.login({ email, password })
    res.json({ success: true, data: result })
  },

  // POST /api/auth/refresh
  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body ?? {}
    if (!refreshToken) {
      throw AppError.badRequest('refreshToken 為必填')
    }
    const result = await authService.refresh(refreshToken)
    res.json({ success: true, data: result })
  },

  // GET /api/auth/me（需登入）
  async me(req: Request, res: Response) {
    const user = await authService.getById(req.userId!)
    if (!user) throw AppError.notFound('找不到使用者')
    res.json({ success: true, data: user })
  },
}
