import jwt from 'jsonwebtoken'
import { AppError } from './AppError'

// 啟動時就確認密鑰存在，避免執行期才爆掉
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('環境變數 JWT_SECRET 未設定')
}

// 對應 CLAUDE.md：access token 7 天、refresh token 30 天
const ACCESS_TOKEN_TTL = '7d'
const REFRESH_TOKEN_TTL = '30d'

export interface JwtPayload {
  userId: string
  type: 'access' | 'refresh'
}

export const signAccessToken = (userId: string) =>
  jwt.sign({ userId, type: 'access' } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  })

export const signRefreshToken = (userId: string) =>
  jwt.sign({ userId, type: 'refresh' } satisfies JwtPayload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  })

// 驗證 token，失敗一律轉成 401
export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as JwtPayload
  } catch {
    throw AppError.unauthorized('Token 無效或已過期')
  }
}
