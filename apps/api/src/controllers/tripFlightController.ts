import type { Request, Response } from 'express'
import { z } from 'zod'
import { tripFlightService } from '../services/tripFlightService'
import {
  dateValue,
  nonEmptyUpdate,
  nullableText,
  optionalText,
  parseInput,
  trimmedString,
} from '../utils/validation'

const airportCode = z
  .string({ required_error: '機場代碼為必填' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, '機場代碼必須是 3 碼 IATA 代碼')

const createFlightSchema = z
  .object({
    flightNumber: trimmedString('flightNumber', 20).transform((value) => value.toUpperCase()),
    airline: optionalText('airline', 200),
    departureAirport: airportCode,
    arrivalAirport: airportCode,
    departureTime: dateValue('departureTime'),
    arrivalTime: dateValue('arrivalTime'),
    aircraft: optionalText('aircraft', 100),
    accessNote: optionalText('accessNote'),
  })
  .strict('包含不支援的欄位')
  .refine((value) => value.arrivalTime >= value.departureTime, {
    message: 'arrivalTime 不可早於 departureTime',
    path: ['arrivalTime'],
  })

const updateFlightSchema = nonEmptyUpdate({
  flightNumber: trimmedString('flightNumber', 20)
    .transform((value) => value.toUpperCase())
    .optional(),
  airline: nullableText('airline', 200),
  departureAirport: airportCode.optional(),
  arrivalAirport: airportCode.optional(),
  departureTime: dateValue('departureTime').optional(),
  arrivalTime: dateValue('arrivalTime').optional(),
  aircraft: nullableText('aircraft', 100),
  accessNote: nullableText('accessNote'),
})

// 行程航班控制器（與 flightController 的第三方搜尋區分）
export const tripFlightController = {
  // POST /api/trips/:id/flights
  async create(req: Request, res: Response) {
    const input = parseInput(createFlightSchema, req.body)
    const flight = await tripFlightService.create(req.params.id, input, req.userId!)
    res.status(201).json({ success: true, data: flight })
  },

  // PUT /api/trips/:id/flights/:flightId
  async update(req: Request, res: Response) {
    const input = parseInput(updateFlightSchema, req.body)
    const flight = await tripFlightService.update(
      req.params.id,
      req.params.flightId,
      input,
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
