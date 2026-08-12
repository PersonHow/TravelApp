import type { Request, Response } from 'express'
import { flightSearchService } from '../services/flightSearchService'

// 航班控制器
export const flightController = {
  // GET /api/flights/search?flightNumber=BR189
  async search(req: Request, res: Response) {
    const flightNumber = req.query.flightNumber ? String(req.query.flightNumber) : undefined
    const results = await flightSearchService.search({ flightNumber })
    res.json({ success: true, data: results })
  },
}
