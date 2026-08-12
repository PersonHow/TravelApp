import { Prisma } from '@prisma/client'
import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { tripService } from './tripService'

// 行程日與每日活動的商業邏輯
// 授權：所有操作都先以所屬 trip 做 assertAccess（非成員 403、行程不存在 404）
// 巢狀資源都要驗證「確實隸屬於該 trip」，避免拿 A 行程的權限去改 B 行程的資料

// 確認該日存在且隸屬於指定行程
async function assertDayInTrip(dayId: string, tripId: string) {
  const day = await prisma.tripDay.findUnique({
    where: { id: dayId },
    select: { tripId: true },
  })
  if (!day || day.tripId !== tripId) throw AppError.notFound('找不到此行程日')
}

// 確認該活動存在且隸屬於指定行程（透過所屬的 tripDay 反查）
async function assertActivityInTrip(activityId: string, tripId: string) {
  const activity = await prisma.dayActivity.findUnique({
    where: { id: activityId },
    select: { tripDay: { select: { tripId: true } } },
  })
  if (!activity || activity.tripDay.tripId !== tripId) {
    throw AppError.notFound('找不到此活動')
  }
}

export const tripDayService = {
  // 新增行程日（同一行程內 dayNumber 不可重複）
  async createDay(
    tripId: string,
    data: { date: Date; dayNumber: number; theme?: string },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    try {
      return await prisma.tripDay.create({
        data: { tripId, ...data },
        include: { activities: true },
      })
    } catch (e) {
      // P2002 = unique constraint 衝突（tripId + dayNumber）
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AppError(409, 'CONFLICT', `第 ${data.dayNumber} 天已存在`)
      }
      throw e
    }
  },

  // 更新行程日（只更新有傳入的欄位）
  async updateDay(
    tripId: string,
    dayId: string,
    data: { date?: Date; dayNumber?: number; theme?: string | null },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    await assertDayInTrip(dayId, tripId)
    try {
      return await prisma.tripDay.update({
        where: { id: dayId },
        data,
        include: { activities: true },
      })
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new AppError(409, 'CONFLICT', `第 ${data.dayNumber} 天已存在`)
      }
      throw e
    }
  },

  // 刪除行程日（其下活動由 schema 的 onDelete: Cascade 一併刪除）
  async removeDay(tripId: string, dayId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    await assertDayInTrip(dayId, tripId)
    return prisma.tripDay.delete({ where: { id: dayId } })
  },

  // 在某一天新增活動
  async createActivity(
    tripId: string,
    dayId: string,
    data: {
      title: string
      startTime?: Date
      endTime?: Date
      note?: string
      order?: number
      type?: string
      place?: string
      hours?: string
      price?: number
      placeId?: string
      lat?: number
      lng?: number
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    await assertDayInTrip(dayId, tripId)
    return prisma.dayActivity.create({ data: { tripDayId: dayId, ...data } })
  },

  // 更新活動（可傳 tripDayId 把活動搬到同行程的另一天）
  async updateActivity(
    tripId: string,
    activityId: string,
    data: {
      title?: string
      startTime?: Date | null
      endTime?: Date | null
      note?: string | null
      order?: number
      type?: string | null
      place?: string | null
      hours?: string | null
      price?: number | null
      placeId?: string | null
      lat?: number | null
      lng?: number | null
      tripDayId?: string
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    await assertActivityInTrip(activityId, tripId)
    // 搬移目的地的那一天也必須屬於同一個行程
    if (data.tripDayId) await assertDayInTrip(data.tripDayId, tripId)
    return prisma.dayActivity.update({ where: { id: activityId }, data })
  },

  // 刪除活動
  async removeActivity(tripId: string, activityId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    await assertActivityInTrip(activityId, tripId)
    return prisma.dayActivity.delete({ where: { id: activityId } })
  },
}
