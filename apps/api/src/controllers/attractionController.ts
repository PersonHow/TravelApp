import type { Request, Response } from 'express'
import { placesService } from '../services/placesService'
import { AppError } from '../utils/AppError'

// 景點控制器
export const attractionController = {
  // GET /api/attractions/search?query=東京鐵塔
  async search(req: Request, res: Response) {
    const query = String(req.query.query ?? '').trim()
    if (!query) throw AppError.badRequest('query 查詢參數為必填')
    const results = await placesService.search(query)
    res.json({ success: true, data: results })
  },
}
