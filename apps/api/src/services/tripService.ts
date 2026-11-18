import type { FamilyRole } from '@prisma/client'
import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { familyService } from './familyService'

// 行程商業邏輯：所有對 DB 的存取都集中在 service 層（controller 不直接碰 prisma）
// 授權原則：行程一律以「所屬家庭的成員身分」控管，非成員不得讀寫

export const tripService = {
  // 確認行程存在、且 user 是該行程所屬家庭的成員（不存在→404，非成員→403）
  async assertAccess(tripId: string, userId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { familyId: true },
    })
    if (!trip) throw AppError.notFound('找不到此行程')
    await familyService.assertMember(userId, trip.familyId)
  },

  // 行程管理權限：建立、改基本資料、刪除等高影響操作只開放給管理者。
  async assertRole(tripId: string, userId: string, roles: FamilyRole[]) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { familyId: true },
    })
    if (!trip) throw AppError.notFound('找不到此行程')
    return familyService.assertRole(userId, trip.familyId, roles)
  },

  // 取得「使用者所屬家庭」的所有行程，依出發日排序（不再回傳全資料庫的行程）
  findAllForUser(userId: string) {
    return prisma.trip.findMany({
      where: { family: { members: { some: { userId } } } },
      orderBy: { startDate: 'asc' },
    })
  },

  // 取得單一行程（含景點、每日活動、飯店、航班、行李清單）——僅限所屬家庭成員
  async findById(id: string, userId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        // TripAttraction 是「尚未排入日期的收藏清單」；排入行程後以 DayActivity 為準。
        tripAttractions: { include: { attraction: true }, orderBy: { order: 'asc' } },
        tripDays: {
          orderBy: { dayNumber: 'asc' },
          include: { activities: { orderBy: [{ order: 'asc' }, { startTime: 'asc' }] } },
        },
        hotels: { orderBy: { checkIn: 'asc' } },
        flights: { orderBy: { departureTime: 'asc' } },
        packingItems: { orderBy: { createdAt: 'asc' } },
        expenses: {
          orderBy: { date: 'asc' },
          include: { payer: { select: { id: true, email: true, name: true } } },
        },
      },
    })
    if (!trip) throw AppError.notFound('找不到此行程')
    await familyService.assertMember(userId, trip.familyId)
    return trip
  },

  // 建立行程——使用者必須是目標家庭的 OWNER / ADMIN
  async create(
    data: {
      title: string
      startDate: Date
      endDate: Date
      familyId: string
      destination?: string
      createDays?: boolean
    },
    userId: string,
  ) {
    await familyService.assertRole(userId, data.familyId, ['OWNER', 'ADMIN'])
    const { createDays, ...tripData } = data
    if (!createDays) return prisma.trip.create({ data: tripData })

    const dayCount = Math.floor((data.endDate.getTime() - data.startDate.getTime()) / 86400000) + 1
    if (dayCount > 366) throw AppError.badRequest('自動建立行程日最多支援 366 天')
    return prisma.trip.create({
      data: {
        ...tripData,
        tripDays: {
          create: Array.from({ length: dayCount }, (_, index) => ({
            dayNumber: index + 1,
            date: new Date(data.startDate.getTime() + index * 86400000),
          })),
        },
      },
    })
  },

  // 更新行程（只更新有傳入的欄位）——僅限 OWNER / ADMIN
  async update(
    id: string,
    data: { title?: string; startDate?: Date; endDate?: Date; destination?: string | null },
    userId: string,
  ) {
    await tripService.assertRole(id, userId, ['OWNER', 'ADMIN'])
    const current = await prisma.trip.findUnique({
      where: { id },
      include: { tripDays: { select: { id: true, dayNumber: true, date: true } } },
    })
    if (!current) throw AppError.notFound('找不到此行程')

    const startDate = data.startDate ?? current.startDate
    const endDate = data.endDate ?? current.endDate
    if (endDate < startDate) throw AppError.badRequest('endDate 不可早於 startDate')

    const dayCount = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1
    const outsideRange = current.tripDays.find((day) => day.dayNumber > dayCount)
    if (outsideRange) {
      throw new AppError(
        409,
        'TRIP_DAYS_OUT_OF_RANGE',
        `行程目前有第 ${outsideRange.dayNumber} 天，請先移除超出新日期範圍的行程日`,
      )
    }
    if (
      !data.startDate &&
      current.tripDays.some((day) => day.date < startDate || day.date > endDate)
    ) {
      throw new AppError(409, 'TRIP_DAYS_OUT_OF_RANGE', '請先調整超出新日期範圍的行程日')
    }

    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.update({ where: { id }, data })
      if (data.startDate) {
        for (const day of current.tripDays) {
          await tx.tripDay.update({
            where: { id: day.id },
            data: { date: new Date(startDate.getTime() + (day.dayNumber - 1) * 86400000) },
          })
        }
      }
      return trip
    })
  },

  // 刪除行程——僅限 OWNER / ADMIN
  async remove(id: string, userId: string) {
    await tripService.assertRole(id, userId, ['OWNER', 'ADMIN'])
    return prisma.trip.delete({ where: { id } })
  },

  // 列出行程的景點（依排序）——僅限所屬家庭成員
  async listAttractions(tripId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    return prisma.tripAttraction.findMany({
      where: { tripId },
      include: { attraction: true },
      orderBy: { order: 'asc' },
    })
  },

  // 將景點加入行程——僅限所屬家庭成員
  async addAttraction(
    input: {
      tripId: string
      attractionId: string
      order?: number
      note?: string
    },
    userId: string,
  ) {
    await tripService.assertAccess(input.tripId, userId)
    return prisma.tripAttraction.create({
      data: {
        tripId: input.tripId,
        attractionId: input.attractionId,
        order: input.order ?? 0,
        note: input.note,
      },
      include: { attraction: true },
    })
  },
}
