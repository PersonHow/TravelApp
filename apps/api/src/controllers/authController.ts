import type { Request, Response } from 'express'
import { z } from 'zod'
import { authService } from '../services/authService'
import { AppError } from '../utils/AppError'
import { parseInput, trimmedString } from '../utils/validation'

const email = z
  .string()
  .trim()
  .email('email 格式錯誤')
  .max(320, 'email 太長')
  .transform((value) => value.toLowerCase())
const password = z.string().min(8, 'password 至少需要 8 個字').max(128, 'password 最多 128 個字')
const registerSchema = z
  .object({ email, name: trimmedString('name', 100), password })
  .strict('包含不支援的欄位')
const loginSchema = z.object({ email, password }).strict('包含不支援的欄位')
const refreshSchema = z
  .object({ refreshToken: trimmedString('refreshToken', 4096) })
  .strict('包含不支援的欄位')

// 認證控制器
export const authController = {
  // POST /api/auth/register
  async register(req: Request, res: Response) {
    const input = parseInput(registerSchema, req.body)
    const result = await authService.register(input)
    res.status(201).json({ success: true, data: result })
  },

  // POST /api/auth/login
  async login(req: Request, res: Response) {
    const input = parseInput(loginSchema, req.body)
    const result = await authService.login(input)
    res.json({ success: true, data: result })
  },

  // POST /api/auth/refresh
  async refresh(req: Request, res: Response) {
    const { refreshToken } = parseInput(refreshSchema, req.body)
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
