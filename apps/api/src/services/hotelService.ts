import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { tripService } from './tripService'

// 飯店商業邏輯（隸屬於 trip 的巢狀資源）

// 確認飯店存在且隸屬於指定行程
async function assertHotelInTrip(hotelId: string, tripId: string) {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { tripId: true },
  })
  if (!hotel || hotel.tripId !== tripId) throw AppError.notFound('找不到此飯店')
}

export const hotelService = {
  async create(
    tripId: string,
    data: {
      name: string
      checkIn: Date
      checkOut: Date
      address?: string
      lat?: number
      lng?: number
      bookingRef?: string
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    return prisma.hotel.create({ data: { tripId, ...data } })
  },

  async update(
    tripId: string,
    hotelId: string,
    data: {
      name?: string
      checkIn?: Date
      checkOut?: Date
      address?: string | null
      lat?: number | null
      lng?: number | null
      bookingRef?: string | null
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    await assertHotelInTrip(hotelId, tripId)
    return prisma.hotel.update({ where: { id: hotelId }, data })
  },

  async remove(tripId: string, hotelId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    await assertHotelInTrip(hotelId, tripId)
    return prisma.hotel.delete({ where: { id: hotelId } })
  },
}
