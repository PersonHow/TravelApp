import { Router } from 'express'
import { familyController } from '../controllers/familyController'
import { requireAuth } from '../middlewares/auth'
import { asyncHandler } from '../utils/asyncHandler'

// /api/families 路由（整個資源都需登入）
export const familiesRouter = Router()

familiesRouter.use(requireAuth)

familiesRouter.post('/', asyncHandler(familyController.create)) // 建立家庭
familiesRouter.get('/', asyncHandler(familyController.list)) // 我的家庭列表
familiesRouter.post('/:id/members', asyncHandler(familyController.addMember)) // 新增成員
