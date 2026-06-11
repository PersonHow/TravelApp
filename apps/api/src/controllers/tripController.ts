import type { Request, Response } from 'express'
import { tripService } from '../services/tripService'
import { AppError } from '../utils/AppError'

// 行程控制器：解析請求 → 呼叫 service → 回傳統一格式 { success, data }
export const tripController = {
  // GET /api/trips
  async list(req: Request, res: Response) {
    const trips = await tripService.findAllForUser(req.userId!)
    res.json({ success: true, data: trips })
  },

  // GET /api/trips/:id
  async getById(req: Request, res: Response) {
    const trip = await tripService.findById(req.params.id, req.userId!)
    res.json({ success: true, data: trip })
  },

  // POST /api/trips
  async create(req: Request, res: Response) {
    const { title, startDate, endDate, familyId } = req.body ?? {}
    if (!title || !startDate || !endDate || !familyId) {
      throw AppError.badRequest('title、startDate、endDate、familyId 為必填')
    }
    const trip = await tripService.create(
      {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        familyId,
      },
      req.userId!,
    )
    res.status(201).json({ success: true, data: trip })
  },

  // PUT /api/trips/:id
  async update(req: Request, res: Response) {
    const { title, startDate, endDate } = req.body ?? {}
    const trip = await tripService.update(
      req.params.id,
      {
        title,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      req.userId!,
    )
    res.json({ success: true, data: trip })
  },

  // DELETE /api/trips/:id
  async remove(req: Request, res: Response) {
    await tripService.remove(req.params.id, req.userId!)
    res.json({ success: true, data: { id: req.params.id } })
  },

  // GET /api/trips/:id/attractions
  async listAttractions(req: Request, res: Response) {
    const items = await tripService.listAttractions(req.params.id, req.userId!)
    res.json({ success: true, data: items })
  },

  // POST /api/trips/:id/attractions
  async addAttraction(req: Request, res: Response) {
    const { attractionId, order, note } = req.body ?? {}
    if (!attractionId) throw AppError.badRequest('attractionId 為必填')
    const item = await tripService.addAttraction(
      {
        tripId: req.params.id,
        attractionId,
        order,
        note,
      },
      req.userId!,
    )
    res.status(201).json({ success: true, data: item })
  },
}
