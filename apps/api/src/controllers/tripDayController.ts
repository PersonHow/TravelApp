import type { Request, Response } from 'express'
import { z } from 'zod'
import { tripDayService } from '../services/tripDayService'
import {
  coordinatePair,
  dateValue,
  nonEmptyUpdate,
  nonNegativeInt,
  nullableText,
  optionalText,
  parseInput,
  trimmedString,
} from '../utils/validation'

const activityType = z.enum(['spot', 'food', 'shop', 'move'])
const dayNumber = z
  .number({ invalid_type_error: 'dayNumber 必須是數字' })
  .int('dayNumber 必須是整數')
  .positive('dayNumber 必須大於 0')

const createDaySchema = z
  .object({ date: dateValue('date'), dayNumber, theme: optionalText('theme', 200) })
  .strict('包含不支援的欄位')

const updateDaySchema = nonEmptyUpdate({
  date: dateValue('date').optional(),
  dayNumber: dayNumber.optional(),
  theme: nullableText('theme', 200),
})

const activityFields = {
  title: trimmedString('title').optional(),
  startTime: dateValue('startTime').optional().nullable(),
  endTime: dateValue('endTime').optional().nullable(),
  note: nullableText('note'),
  order: nonNegativeInt('order').optional(),
  type: activityType.optional().nullable(),
  place: nullableText('place', 300),
  hours: nullableText('hours', 100),
  price: nonNegativeInt('price').optional().nullable(),
  placeId: nullableText('placeId', 300),
  ...coordinatePair,
}

function hasCoordinatePair(value: { lat?: number | null; lng?: number | null }) {
  return (value.lat == null) === (value.lng == null)
}

const createActivitySchema = z
  .object({ ...activityFields, title: trimmedString('title') })
  .strict('包含不支援的欄位')
  .refine(hasCoordinatePair, 'lat 與 lng 必須一起提供')

const updateActivitySchema = z
  .object({ ...activityFields, tripDayId: trimmedString('tripDayId', 100).optional() })
  .strict('包含不支援的欄位')
  .refine((value) => Object.keys(value).length > 0, '至少要提供一個更新欄位')
  .refine(hasCoordinatePair, 'lat 與 lng 必須一起提供')

// 行程日與每日活動控制器
export const tripDayController = {
  // POST /api/trips/:id/days
  async createDay(req: Request, res: Response) {
    const input = parseInput(createDaySchema, req.body)
    const day = await tripDayService.createDay(req.params.id, input, req.userId!)
    res.status(201).json({ success: true, data: day })
  },

  // PUT /api/trips/:id/days/:dayId
  async updateDay(req: Request, res: Response) {
    const input = parseInput(updateDaySchema, req.body)
    const day = await tripDayService.updateDay(req.params.id, req.params.dayId, input, req.userId!)
    res.json({ success: true, data: day })
  },

  // DELETE /api/trips/:id/days/:dayId
  async removeDay(req: Request, res: Response) {
    await tripDayService.removeDay(
      req.params.id,
      req.params.dayId,
      req.userId!,
      req.query.confirmActivities === 'true',
    )
    res.json({ success: true, data: { id: req.params.dayId } })
  },

  // POST /api/trips/:id/days/:dayId/activities
  async createActivity(req: Request, res: Response) {
    const input = parseInput(createActivitySchema, req.body)
    const activity = await tripDayService.createActivity(
      req.params.id,
      req.params.dayId,
      {
        ...input,
        startTime: input.startTime ?? undefined,
        endTime: input.endTime ?? undefined,
        note: input.note ?? undefined,
        type: input.type ?? undefined,
        place: input.place ?? undefined,
        hours: input.hours ?? undefined,
        price: input.price ?? undefined,
        placeId: input.placeId ?? undefined,
        lat: input.lat ?? undefined,
        lng: input.lng ?? undefined,
      },
      req.userId!,
    )
    res.status(201).json({ success: true, data: activity })
  },

  // PUT /api/trips/:id/activities/:activityId
  async updateActivity(req: Request, res: Response) {
    const input = parseInput(updateActivitySchema, req.body)
    const activity = await tripDayService.updateActivity(
      req.params.id,
      req.params.activityId,
      input,
      req.userId!,
    )
    res.json({ success: true, data: activity })
  },

  // DELETE /api/trips/:id/activities/:activityId
  async removeActivity(req: Request, res: Response) {
    await tripDayService.removeActivity(req.params.id, req.params.activityId, req.userId!)
    res.json({ success: true, data: { id: req.params.activityId } })
  },
}
