import type { Request, Response } from 'express'
import { hotelService } from '../services/hotelService'
import { AppError } from '../utils/AppError'

// 同 tripDayController 的日期轉換規則
function toDate(value: unknown): Date | undefined {
  if (value === undefined || value === null) return undefined
  const d = new Date(value as string)
  if (Number.isNaN(d.getTime())) throw AppError.badRequest('日期格式錯誤')
  return d
}

// 飯店控制器
export const hotelController = {
  // POST /api/trips/:id/hotels
  async create(req: Request, res: Response) {
    const { name, checkIn, checkOut, address, lat, lng, bookingRef } = req.body ?? {}
    if (!name || !checkIn || !checkOut) {
      throw AppError.badRequest('name、checkIn、checkOut 為必填')
    }
    const hotel = await hotelService.create(
      req.params.id,
      {
        name,
        checkIn: toDate(checkIn)!,
        checkOut: toDate(checkOut)!,
        address,
        lat,
        lng,
        bookingRef,
      },
      req.userId!,
    )
    res.status(201).json({ success: true, data: hotel })
  },

  // PUT /api/trips/:id/hotels/:hotelId
  async update(req: Request, res: Response) {
    const { name, checkIn, checkOut, address, lat, lng, bookingRef } = req.body ?? {}
    const hotel = await hotelService.update(
      req.params.id,
      req.params.hotelId,
      { name, checkIn: toDate(checkIn), checkOut: toDate(checkOut), address, lat, lng, bookingRef },
      req.userId!,
    )
    res.json({ success: true, data: hotel })
  },

  // DELETE /api/trips/:id/hotels/:hotelId
  async remove(req: Request, res: Response) {
    await hotelService.remove(req.params.id, req.params.hotelId, req.userId!)
    res.json({ success: true, data: { id: req.params.hotelId } })
  },
}
