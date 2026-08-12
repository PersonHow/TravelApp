import type { Request, Response } from 'express'
import { tripDayService } from '../services/tripDayService'
import { AppError } from '../utils/AppError'

// 把 body 的日期欄位轉成 Date：沒傳 = 不更新（undefined）、傳 null = 清空
function toDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const d = new Date(value as string)
  if (Number.isNaN(d.getTime())) throw AppError.badRequest('日期格式錯誤')
  return d
}

// 行程日與每日活動控制器
export const tripDayController = {
  // POST /api/trips/:id/days
  async createDay(req: Request, res: Response) {
    const { date, dayNumber, theme } = req.body ?? {}
    if (!date || dayNumber === undefined) {
      throw AppError.badRequest('date、dayNumber 為必填')
    }
    const day = await tripDayService.createDay(
      req.params.id,
      { date: toDate(date)!, dayNumber: Number(dayNumber), theme },
      req.userId!,
    )
    res.status(201).json({ success: true, data: day })
  },

  // PUT /api/trips/:id/days/:dayId
  async updateDay(req: Request, res: Response) {
    const { date, dayNumber, theme } = req.body ?? {}
    const day = await tripDayService.updateDay(
      req.params.id,
      req.params.dayId,
      {
        date: toDate(date) ?? undefined,
        dayNumber: dayNumber === undefined ? undefined : Number(dayNumber),
        theme,
      },
      req.userId!,
    )
    res.json({ success: true, data: day })
  },

  // DELETE /api/trips/:id/days/:dayId
  async removeDay(req: Request, res: Response) {
    await tripDayService.removeDay(req.params.id, req.params.dayId, req.userId!)
    res.json({ success: true, data: { id: req.params.dayId } })
  },

  // POST /api/trips/:id/days/:dayId/activities
  async createActivity(req: Request, res: Response) {
    const { title, startTime, endTime, note, order, type, place, hours, price, placeId, lat, lng } =
      req.body ?? {}
    if (!title) throw AppError.badRequest('title 為必填')
    const activity = await tripDayService.createActivity(
      req.params.id,
      req.params.dayId,
      {
        title,
        startTime: toDate(startTime) ?? undefined,
        endTime: toDate(endTime) ?? undefined,
        note,
        order,
        type,
        place,
        hours,
        price,
        placeId,
        lat,
        lng,
      },
      req.userId!,
    )
    res.status(201).json({ success: true, data: activity })
  },

  // PUT /api/trips/:id/activities/:activityId
  async updateActivity(req: Request, res: Response) {
    const {
      title,
      startTime,
      endTime,
      note,
      order,
      type,
      place,
      hours,
      price,
      placeId,
      lat,
      lng,
      tripDayId,
    } = req.body ?? {}
    const activity = await tripDayService.updateActivity(
      req.params.id,
      req.params.activityId,
      {
        title,
        startTime: toDate(startTime),
        endTime: toDate(endTime),
        note,
        order,
        type,
        place,
        hours,
        price,
        placeId,
        lat,
        lng,
        tripDayId,
      },
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
