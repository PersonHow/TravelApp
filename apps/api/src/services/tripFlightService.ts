import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { tripService } from './tripService'

// 行程航班商業邏輯（隸屬於 trip 的巢狀資源）
// 命名為 tripFlightService 與既有的 flightSearchService（AviationStack 查詢）區分

// 確認航班存在且隸屬於指定行程
async function assertFlightInTrip(flightId: string, tripId: string) {
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    select: { tripId: true },
  })
  if (!flight || flight.tripId !== tripId) throw AppError.notFound('找不到此航班')
}

export const tripFlightService = {
  async create(
    tripId: string,
    data: {
      flightNumber: string
      departureAirport: string
      arrivalAirport: string
      departureTime: Date
      arrivalTime: Date
      airline?: string
      aircraft?: string
      accessNote?: string
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    return prisma.flight.create({ data: { tripId, ...data } })
  },

  async update(
    tripId: string,
    flightId: string,
    data: {
      flightNumber?: string
      departureAirport?: string
      arrivalAirport?: string
      departureTime?: Date
      arrivalTime?: Date
      airline?: string | null
      aircraft?: string | null
      accessNote?: string | null
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    await assertFlightInTrip(flightId, tripId)
    return prisma.flight.update({ where: { id: flightId }, data })
  },

  async remove(tripId: string, flightId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    await assertFlightInTrip(flightId, tripId)
    return prisma.flight.delete({ where: { id: flightId } })
  },
}
