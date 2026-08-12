import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { tripService } from './tripService'

// 行李清單商業邏輯（隸屬於 trip 的巢狀資源）

// 確認項目存在且隸屬於指定行程
async function assertItemInTrip(itemId: string, tripId: string) {
  const item = await prisma.packingItem.findUnique({
    where: { id: itemId },
    select: { tripId: true },
  })
  if (!item || item.tripId !== tripId) throw AppError.notFound('找不到此行李項目')
}

export const packingItemService = {
  async create(tripId: string, data: { name: string }, userId: string) {
    await tripService.assertAccess(tripId, userId)
    return prisma.packingItem.create({ data: { tripId, ...data } })
  },

  async update(
    tripId: string,
    itemId: string,
    data: { name?: string; checked?: boolean },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    await assertItemInTrip(itemId, tripId)
    return prisma.packingItem.update({ where: { id: itemId }, data })
  },

  async remove(tripId: string, itemId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    await assertItemInTrip(itemId, tripId)
    return prisma.packingItem.delete({ where: { id: itemId } })
  },
}
