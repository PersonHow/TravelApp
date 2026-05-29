import { Router } from 'express'
import { tripController } from '../controllers/tripController'
import { requireAuth } from '../middlewares/auth'
import { asyncHandler } from '../utils/asyncHandler'

// /api/trips 路由（對應 CLAUDE.md RESTful 規範，整個資源都需登入）
export const tripsRouter = Router()

tripsRouter.use(requireAuth)

tripsRouter.get('/', asyncHandler(tripController.list)) // 取得行程列表
tripsRouter.post('/', asyncHandler(tripController.create)) // 建立行程
tripsRouter.get('/:id', asyncHandler(tripController.getById)) // 取得單一行程
tripsRouter.put('/:id', asyncHandler(tripController.update)) // 更新行程
tripsRouter.delete('/:id', asyncHandler(tripController.remove)) // 刪除行程

// 行程的景點（巢狀資源）
tripsRouter.get('/:id/attractions', asyncHandler(tripController.listAttractions)) // 景點列表
tripsRouter.post('/:id/attractions', asyncHandler(tripController.addAttraction)) // 加入景點
