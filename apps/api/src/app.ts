import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { errorHandler } from './middlewares/errorHandler'
import { notFound } from './middlewares/notFound'
import { apiRouter } from './routes'
import { AppError } from './utils/AppError'

const rateLimitHandler: NonNullable<Parameters<typeof rateLimit>[0]>['handler'] = (_req, res) => {
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: '請求過於頻繁，請稍後再試' },
  })
}

// 建立並設定 Express App（與啟動分離，方便日後測試）
export const createApp = () => {
  const app = express()

  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use(helmet({ crossOriginResourcePolicy: false }))
  app.use(
    cors({
      origin(origin, callback) {
        // 原生 App 沒有 Origin；開發環境沒設定 allowlist 時允許 localhost 開發。
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          (process.env.NODE_ENV !== 'production' && allowedOrigins.length === 0)
        ) {
          callback(null, true)
          return
        }
        callback(AppError.forbidden('此來源不允許存取'))
      },
    }),
  )
  app.use(express.json({ limit: '100kb' }))

  app.use(
    '/api',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: rateLimitHandler,
      skip: () => process.env.NODE_ENV === 'test',
    }),
  )
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 30,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      handler: rateLimitHandler,
      skip: () => process.env.NODE_ENV === 'test',
    }),
  )

  // 健康檢查端點（部署時 Cloud Run 探活用）
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: { status: 'ok', time: new Date().toISOString() },
    })
  })

  app.use('/api', apiRouter)

  app.use(notFound) // 找不到路由
  app.use(errorHandler) // 統一錯誤處理（必須放最後）

  return app
}
