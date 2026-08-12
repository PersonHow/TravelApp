import type { FamilyRole } from '@prisma/client'
import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'

// 成員列表統一帶使用者基本資料（家庭管理 UI 顯示名字/email）
const MEMBERS_WITH_USER = {
  members: { include: { user: { select: { id: true, email: true, name: true } } } },
} as const

// 家庭商業邏輯
export const familyService = {
  // 授權檢查共用：確認 user 是該家庭成員，不是就擋下（trips / families 都會用到）
  async assertMember(userId: string, familyId: string) {
    const membership = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId, familyId } },
    })
    if (!membership) {
      throw AppError.forbidden('你不是這個家庭的成員，無權存取')
    }
    return membership
  },

  // 授權檢查：除了是成員，角色還要在允許清單內（AI 排行程等管理者限定功能用）
  async assertRole(userId: string, familyId: string, roles: FamilyRole[]) {
    const membership = await familyService.assertMember(userId, familyId)
    if (!roles.includes(membership.role)) {
      throw AppError.forbidden('僅限家庭建立者或管理員使用此功能')
    }
    return membership
  },

  // 建立家庭，並把建立者設為 OWNER（一次交易內完成）
  create(input: { name: string; ownerId: string }) {
    return prisma.family.create({
      data: {
        name: input.name,
        members: {
          create: { userId: input.ownerId, role: 'OWNER' },
        },
      },
      include: MEMBERS_WITH_USER,
    })
  },

  // 列出某使用者所屬的所有家庭
  findAllForUser(userId: string) {
    return prisma.family.findMany({
      where: { members: { some: { userId } } },
      include: MEMBERS_WITH_USER,
    })
  },

  // 用 email 邀請成員（一般成員）：發起者本身必須是該家庭成員
  async addMemberByEmail(input: { familyId: string; email: string; requesterId: string }) {
    await familyService.assertMember(input.requesterId, input.familyId)

    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw AppError.notFound('找不到這個 email 的使用者，請確認對方已註冊')

    const existing = await prisma.familyMember.findUnique({
      where: { userId_familyId: { userId: user.id, familyId: input.familyId } },
    })
    if (existing) throw new AppError(409, 'CONFLICT', '這位使用者已經是家庭成員')

    return prisma.familyMember.create({
      data: { familyId: input.familyId, userId: user.id, role: 'MEMBER' },
      include: { user: { select: { id: true, email: true, name: true } } },
    })
  },
}
