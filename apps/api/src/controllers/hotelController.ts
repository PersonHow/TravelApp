import type { Request, Response } from 'express'
import { z } from 'zod'
import { hotelService } from '../services/hotelService'
import { transitRouteService } from '../services/transitRouteService'
import { AppError } from '../utils/AppError'
import {
  coordinatePair,
  dateValue,
  nonEmptyUpdate,
  nullableText,
  optionalText,
  parseInput,
  trimmedString,
} from '../utils/validation'

const createHotelSchema = z
  .object({
    name: trimmedString('name'),
    checkIn: dateValue('checkIn'),
    checkOut: dateValue('checkOut'),
    address: optionalText('address', 500),
    bookingRef: optionalText('bookingRef', 200),
    roomInfo: optionalText('roomInfo', 300),
    roomNumber: optionalText('roomNumber', 200),
    accessNote: optionalText('accessNote'),
    ...coordinatePair,
  })
  .strict('包含不支援的欄位')
  .refine((value) => value.checkOut >= value.checkIn, {
    message: 'checkOut 不可早於 checkIn',
    path: ['checkOut'],
  })
  .refine((value) => (value.lat == null) === (value.lng == null), 'lat 與 lng 必須一起提供')

const updateHotelSchema = nonEmptyUpdate({
  name: trimmedString('name').optional(),
  checkIn: dateValue('checkIn').optional(),
  checkOut: dateValue('checkOut').optional(),
  address: nullableText('address', 500),
  bookingRef: nullableText('bookingRef', 200),
  roomInfo: nullableText('roomInfo', 300),
  roomNumber: nullableText('roomNumber', 200),
  accessNote: nullableText('accessNote'),
  ...coordinatePair,
})

// 飯店控制器
export const hotelController = {
  // POST /api/trips/:id/hotels
  async create(req: Request, res: Response) {
    const input = parseInput(createHotelSchema, req.body)
    const hotel = await hotelService.create(
      req.params.id,
      { ...input, lat: input.lat ?? undefined, lng: input.lng ?? undefined },
      req.userId!,
    )
    res.status(201).json({ success: true, data: hotel })
  },

  // PUT /api/trips/:id/hotels/:hotelId
  async update(req: Request, res: Response) {
    const input = parseInput(updateHotelSchema, req.body)
    const hotel = await hotelService.update(req.params.id, req.params.hotelId, input, req.userId!)
    res.json({ success: true, data: hotel })
  },

  // GET /api/trips/:id/hotels/:hotelId/transit-route?origin=關西機場
  // 查「出發地 → 飯店」的大眾運輸路線（Google Routes API）;查無路線 data 回 null
  async transitRoute(req: Request, res: Response) {
    const origin = String(req.query.origin ?? '').trim()
    if (!origin) throw AppError.badRequest('origin 為必填')
    if (origin.length > 300) throw AppError.badRequest('origin 最多 300 個字')

    const hotel = await hotelService.getForTrip(req.params.id, req.params.hotelId, req.userId!)
    // 目的地:有座標用座標,沒座標退回名稱＋地址文字
    const destination =
      hotel.lat != null && hotel.lng != null
        ? { lat: hotel.lat, lng: hotel.lng }
        : { text: [hotel.name, hotel.address].filter(Boolean).join(' ') }

    const route = await transitRouteService.search(origin, destination)
    res.json({ success: true, data: route })
  },

  // DELETE /api/trips/:id/hotels/:hotelId
  async remove(req: Request, res: Response) {
    await hotelService.remove(req.params.id, req.params.hotelId, req.userId!)
    res.json({ success: true, data: { id: req.params.hotelId } })
  },
}
