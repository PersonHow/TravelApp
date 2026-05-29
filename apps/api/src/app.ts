import cors from 'cors'
import express from 'express'
import { errorHandler } from './middlewares/errorHandler'
import { notFound } from './middlewares/notFound'
import { apiRouter } from './routes'

// 建立並設定 Express App（與啟動分離，方便日後測試）
export const createApp = () => {
  const app = express()

  app.use(cors()) // 允許跨來源請求（網頁版、手機區網連線都需要）
  app.use(express.json()) // 解析 JSON body

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
