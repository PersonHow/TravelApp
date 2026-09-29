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
      roomInfo?: string
      roomNumber?: string
      accessNote?: string
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
      roomInfo?: string | null
      roomNumber?: string | null
      accessNote?: string | null
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    await assertHotelInTrip(hotelId, tripId)
    const current = await prisma.hotel.findUnique({ where: { id: hotelId } })
    if (!current) throw AppError.notFound('找不到此飯店')
    const checkIn = data.checkIn ?? current.checkIn
    const checkOut = data.checkOut ?? current.checkOut
    if (checkOut < checkIn) throw AppError.badRequest('checkOut 不可早於 checkIn')
    const lat = data.lat === undefined ? current.lat : data.lat
    const lng = data.lng === undefined ? current.lng : data.lng
    if ((lat == null) !== (lng == null)) throw AppError.badRequest('lat 與 lng 必須一起提供')
    return prisma.hotel.update({ where: { id: hotelId }, data })
  },

  // 取單筆（查路線用）:驗證存取權與隸屬後回傳完整飯店
  async getForTrip(tripId: string, hotelId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } })
    if (!hotel || hotel.tripId !== tripId) throw AppError.notFound('找不到此飯店')
    return hotel
  },

  async remove(tripId: string, hotelId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    await assertHotelInTrip(hotelId, tripId)
    return prisma.hotel.delete({ where: { id: hotelId } })
  },
}
