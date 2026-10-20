import type { Request, Response } from 'express'
import { z } from 'zod'
import { tripService } from '../services/tripService'
import { AppError } from '../utils/AppError'
import {
  dateValue,
  nonEmptyUpdate,
  optionalText,
  parseInput,
  trimmedString,
} from '../utils/validation'

const createTripSchema = z
  .object({
    title: trimmedString('title'),
    startDate: dateValue('startDate'),
    endDate: dateValue('endDate'),
    familyId: trimmedString('familyId', 100),
    destination: optionalText('destination', 200),
    createDays: z.boolean().optional(),
  })
  .strict('包含不支援的欄位')
  .refine((value) => value.endDate >= value.startDate, {
    message: 'endDate 不可早於 startDate',
    path: ['endDate'],
  })

const updateTripSchema = nonEmptyUpdate({
  title: trimmedString('title').optional(),
  startDate: dateValue('startDate').optional(),
  endDate: dateValue('endDate').optional(),
  destination: optionalText('destination', 200).nullable(),
})

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
    const input = parseInput(createTripSchema, req.body)
    const trip = await tripService.create(input, req.userId!)
    res.status(201).json({ success: true, data: trip })
  },

  // PUT /api/trips/:id
  async update(req: Request, res: Response) {
    const input = parseInput(updateTripSchema, req.body)
    const trip = await tripService.update(req.params.id, input, req.userId!)
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
