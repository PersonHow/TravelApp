import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { tripService } from './tripService'

// 記帳商業邏輯（隸屬於 trip 的巢狀資源）
// payer 帶基本資料給列表顯示（不含 passwordHash）

const PAYER_SELECT = { select: { id: true, email: true, name: true } }

// 確認帳目存在且隸屬於指定行程
async function assertExpenseInTrip(expenseId: string, tripId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    select: { tripId: true },
  })
  if (!expense || expense.tripId !== tripId) throw AppError.notFound('找不到此帳目')
}

// payerId 有填時，確認他是行程所屬家庭的成員（防止掛到不相干的使用者）
async function assertPayerInFamily(payerId: string, tripId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, select: { familyId: true } })
  const member = await prisma.familyMember.findFirst({
    where: { userId: payerId, familyId: trip!.familyId },
  })
  if (!member) throw AppError.badRequest('付款人必須是行程所屬家庭的成員')
}

export const expenseService = {
  async create(
    tripId: string,
    data: {
      title: string
      amount: number
      category: string
      date: Date
      payerId?: string
      note?: string
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    if (data.payerId) await assertPayerInFamily(data.payerId, tripId)
    return prisma.expense.create({
      data: { tripId, ...data },
      include: { payer: PAYER_SELECT },
    })
  },

  async update(
    tripId: string,
    expenseId: string,
    data: {
      title?: string
      amount?: number
      category?: string
      date?: Date
      payerId?: string | null
      note?: string | null
    },
    userId: string,
  ) {
    await tripService.assertAccess(tripId, userId)
    await assertExpenseInTrip(expenseId, tripId)
    if (data.payerId) await assertPayerInFamily(data.payerId, tripId)
    return prisma.expense.update({
      where: { id: expenseId },
      data,
      include: { payer: PAYER_SELECT },
    })
  },

  async remove(tripId: string, expenseId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    await assertExpenseInTrip(expenseId, tripId)
    return prisma.expense.delete({ where: { id: expenseId } })
  },
}
