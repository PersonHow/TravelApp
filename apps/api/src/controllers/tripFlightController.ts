import type { Request, Response } from 'express'
import { tripFlightService } from '../services/tripFlightService'
import { AppError } from '../utils/AppError'

// 同 tripDayController 的日期轉換規則
function toDate(value: unknown): Date | undefined {
  if (value === undefined || value === null) return undefined
  const d = new Date(value as string)
  if (Number.isNaN(d.getTime())) throw AppError.badRequest('日期格式錯誤')
  return d
}

// 行程航班控制器（與 flightController 的第三方搜尋區分）
export const tripFlightController = {
  // POST /api/trips/:id/flights
  async create(req: Request, res: Response) {
    const {
      flightNumber,
      airline,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      aircraft,
      accessNote,
    } = req.body ?? {}
    if (!flightNumber || !departureAirport || !arrivalAirport || !departureTime || !arrivalTime) {
      throw AppError.badRequest(
        'flightNumber、departureAirport、arrivalAirport、departureTime、arrivalTime 為必填',
      )
    }
    const flight = await tripFlightService.create(
      req.params.id,
      {
        flightNumber,
        airline,
        departureAirport,
        arrivalAirport,
        departureTime: toDate(departureTime)!,
        arrivalTime: toDate(arrivalTime)!,
        aircraft,
        accessNote,
      },
      req.userId!,
    )
    res.status(201).json({ success: true, data: flight })
  },

  // PUT /api/trips/:id/flights/:flightId
  async update(req: Request, res: Response) {
    const {
      flightNumber,
      airline,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      aircraft,
      accessNote,
    } = req.body ?? {}
    const flight = await tripFlightService.update(
      req.params.id,
      req.params.flightId,
      {
        flightNumber,
        airline,
        departureAirport,
        arrivalAirport,
        departureTime: toDate(departureTime),
        arrivalTime: toDate(arrivalTime),
        aircraft,
        accessNote,
      },
      req.userId!,
    )
    res.json({ success: true, data: flight })
  },

  // DELETE /api/trips/:id/flights/:flightId
  async remove(req: Request, res: Response) {
    await tripFlightService.remove(req.params.id, req.params.flightId, req.userId!)
    res.json({ success: true, data: { id: req.params.flightId } })
  },
}
