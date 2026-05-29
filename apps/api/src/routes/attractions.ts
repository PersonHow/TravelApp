import { Router } from 'express'
import { attractionController } from '../controllers/attractionController'
import { requireAuth } from '../middlewares/auth'
import { asyncHandler } from '../utils/asyncHandler'

// /api/attractions 路由（需登入）
export const attractionsRouter = Router()

attractionsRouter.use(requireAuth)

attractionsRouter.get('/search', asyncHandler(attractionController.search)) // Google Places 搜尋
