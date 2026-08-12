import { Router } from 'express'
import { aiPlanController } from '../controllers/aiPlanController'
import { hotelController } from '../controllers/hotelController'
import { packingItemController } from '../controllers/packingItemController'
import { phraseController } from '../controllers/phraseController'
import { tripController } from '../controllers/tripController'
import { tripDayController } from '../controllers/tripDayController'
import { tripFlightController } from '../controllers/tripFlightController'
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

// 行程日（巢狀資源；列表已含在 GET /:id 的 tripDays）
tripsRouter.post('/:id/days', asyncHandler(tripDayController.createDay)) // 新增一天
tripsRouter.put('/:id/days/:dayId', asyncHandler(tripDayController.updateDay)) // 更新一天
tripsRouter.delete('/:id/days/:dayId', asyncHandler(tripDayController.removeDay)) // 刪除一天

// 每日活動（巢狀於行程日）
tripsRouter.post('/:id/days/:dayId/activities', asyncHandler(tripDayController.createActivity)) // 新增活動
tripsRouter.put('/:id/activities/:activityId', asyncHandler(tripDayController.updateActivity)) // 更新活動（可換天）
tripsRouter.delete('/:id/activities/:activityId', asyncHandler(tripDayController.removeActivity)) // 刪除活動

// 飯店（巢狀資源）
tripsRouter.post('/:id/hotels', asyncHandler(hotelController.create)) // 新增飯店
tripsRouter.put('/:id/hotels/:hotelId', asyncHandler(hotelController.update)) // 更新飯店
tripsRouter.delete('/:id/hotels/:hotelId', asyncHandler(hotelController.remove)) // 刪除飯店

// 行程航班（巢狀資源；與 /api/flights/search 第三方查詢不同）
tripsRouter.post('/:id/flights', asyncHandler(tripFlightController.create)) // 新增航班
tripsRouter.put('/:id/flights/:flightId', asyncHandler(tripFlightController.update)) // 更新航班
tripsRouter.delete('/:id/flights/:flightId', asyncHandler(tripFlightController.remove)) // 刪除航班

// AI 規劃行程（限 OWNER/ADMIN；兩段式：草稿 → 確認套用）
tripsRouter.post('/:id/ai-plan', asyncHandler(aiPlanController.generate)) // 生成草稿（不寫 DB）
tripsRouter.post('/:id/ai-plan/apply', asyncHandler(aiPlanController.apply)) // 套用草稿（寫入 TripDay/DayActivity）

// 旅遊短句（AI 生成；獨立端點，不含在 GET /:id）
tripsRouter.get('/:id/phrases', asyncHandler(phraseController.list)) // 短句列表
tripsRouter.post('/:id/phrases/generate', asyncHandler(phraseController.generate)) // AI 生成（重生成會先清舊的）

// 行李清單（巢狀資源；列表已含在 GET /:id 的 packingItems）
tripsRouter.post('/:id/packing', asyncHandler(packingItemController.create)) // 新增項目
tripsRouter.put('/:id/packing/:itemId', asyncHandler(packingItemController.update)) // 更新項目（改名/勾選）
tripsRouter.delete('/:id/packing/:itemId', asyncHandler(packingItemController.remove)) // 刪除項目
