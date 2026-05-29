import { Router } from 'express'
import { authController } from '../controllers/authController'
import { requireAuth } from '../middlewares/auth'
import { asyncHandler } from '../utils/asyncHandler'

// /api/auth 路由
export const authRouter = Router()

authRouter.post('/register', asyncHandler(authController.register)) // 註冊
authRouter.post('/login', asyncHandler(authController.login)) // 登入
authRouter.post('/refresh', asyncHandler(authController.refresh)) // 換發 token
authRouter.get('/me', requireAuth, asyncHandler(authController.me)) // 取得目前登入者
