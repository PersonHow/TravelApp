import { prisma } from '../prisma/client'

// 行程商業邏輯：所有對 DB 的存取都集中在 service 層（controller 不直接碰 prisma）

export const tripService = {
  // 取得所有行程，依出發日排序
  findAll() {
    return prisma.trip.findMany({
      orderBy: { startDate: 'asc' },
    })
  },

  // 取得單一行程（含景點、每日活動、飯店、航班）
  findById(id: string) {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        tripAttractions: { include: { attraction: true } },
        tripDays: { include: { activities: true } },
        hotels: true,
        flights: true,
      },
    })
  },

  // 建立行程
  create(data: {
    title: string
    startDate: Date
    endDate: Date
    familyId: string
  }) {
    return prisma.trip.create({ data })
  },

  // 更新行程（只更新有傳入的欄位）
  update(
    id: string,
    data: { title?: string; startDate?: Date; endDate?: Date },
  ) {
    return prisma.trip.update({ where: { id }, data })
  },

  // 刪除行程
  remove(id: string) {
    return prisma.trip.delete({ where: { id } })
  },

  // 列出行程的景點（依排序）
  listAttractions(tripId: string) {
    return prisma.tripAttraction.findMany({
      where: { tripId },
      include: { attraction: true },
      orderBy: { order: 'asc' },
    })
  },

  // 將景點加入行程
  addAttraction(input: {
    tripId: string
    attractionId: string
    order?: number
    note?: string
  }) {
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
