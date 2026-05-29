import { Router } from 'express'
import { flightController } from '../controllers/flightController'
import { requireAuth } from '../middlewares/auth'
import { asyncHandler } from '../utils/asyncHandler'

// /api/flights 路由（需登入）
export const flightsRouter = Router()

flightsRouter.use(requireAuth)

flightsRouter.get('/search', asyncHandler(flightController.search)) // AviationStack 航班搜尋
