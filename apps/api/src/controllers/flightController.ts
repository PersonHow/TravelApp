import type { Request, Response } from 'express'
import { flightSearchService } from '../services/flightSearchService'
import { AppError } from '../utils/AppError'

// 航班控制器
export const flightController = {
  // GET /api/flights/search?flightNumber=BR189
  async search(req: Request, res: Response) {
    const flightNumber = req.query.flightNumber ? String(req.query.flightNumber).trim() : ''
    if (!flightNumber) throw AppError.badRequest('flightNumber 為必填')
    if (!/^[A-Za-z0-9 ]{2,10}$/.test(flightNumber)) {
      throw AppError.badRequest('flightNumber 格式錯誤')
    }
    const results = await flightSearchService.search({ flightNumber })
    res.json({ success: true, data: results })
  },
}
