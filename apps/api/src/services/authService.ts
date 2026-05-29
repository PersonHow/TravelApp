import bcrypt from 'bcryptjs'
import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { signAccessToken, signRefreshToken, verifyToken } from '../utils/jwt'

// 組出統一的認證回傳結果（公開使用者資訊 + 雙 token）
const buildAuthResult = (user: { id: string; email: string; name: string }) => ({
  user: { id: user.id, email: user.email, name: user.name },
  accessToken: signAccessToken(user.id),
  refreshToken: signRefreshToken(user.id),
})

export const authService = {
  // 註冊：email 不可重複，密碼以 bcrypt 雜湊後存放
  async register(input: { email: string; name: string; password: string }) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    })
    if (existing) {
      throw new AppError(409, 'EMAIL_TAKEN', '此 email 已被註冊')
    }

    const passwordHash = await bcrypt.hash(input.password, 10)
    const user = await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
    })
    return buildAuthResult(user)
  },

  // 登入：驗證密碼，成功才發 token
  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    })
    if (!user) throw AppError.unauthorized('帳號或密碼錯誤')

    const ok = await bcrypt.compare(input.password, user.passwordHash)
    if (!ok) throw AppError.unauthorized('帳號或密碼錯誤')

    return buildAuthResult(user)
  },

  // 用 refresh token 換新的雙 token
  async refresh(refreshToken: string) {
    const payload = verifyToken(refreshToken)
    if (payload.type !== 'refresh') {
      throw AppError.unauthorized('需要 refresh token')
    }
    return {
      accessToken: signAccessToken(payload.userId),
      refreshToken: signRefreshToken(payload.userId),
    }
  },

  // 取得目前登入者（不含密碼）
  getById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true },
    })
  },
}
