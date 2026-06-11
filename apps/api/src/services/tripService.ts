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

  // 取得「使用者所屬家庭」的所有行程，依出發日排序（不再回傳全資料庫的行程）
  findAllForUser(userId: string) {
    return prisma.trip.findMany({
      where: { family: { members: { some: { userId } } } },
      orderBy: { startDate: 'asc' },
    })
  },

  // 取得單一行程（含景點、每日活動、飯店、航班）——僅限所屬家庭成員
  async findById(id: string, userId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        tripAttractions: { include: { attraction: true } },
        tripDays: { include: { activities: true } },
        hotels: true,
        flights: true,
      },
    })
    if (!trip) throw AppError.notFound('找不到此行程')
    await familyService.assertMember(userId, trip.familyId)
    return trip
  },

  // 建立行程——使用者必須是目標家庭的成員
  async create(
    data: {
      title: string
      startDate: Date
      endDate: Date
      familyId: string
    },
    userId: string,
  ) {
    await familyService.assertMember(userId, data.familyId)
    return prisma.trip.create({ data })
  },

  // 更新行程（只更新有傳入的欄位）——僅限所屬家庭成員
  async update(
    id: string,
    data: { title?: string; startDate?: Date; endDate?: Date },
    userId: string,
  ) {
    await tripService.assertAccess(id, userId)
    return prisma.trip.update({ where: { id }, data })
  },

  // 刪除行程——僅限所屬家庭成員
  async remove(id: string, userId: string) {
    await tripService.assertAccess(id, userId)
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
