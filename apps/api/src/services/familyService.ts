import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'

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

  // 建立家庭，並把建立者設為 OWNER（一次交易內完成）
  create(input: { name: string; ownerId: string }) {
    return prisma.family.create({
      data: {
        name: input.name,
        members: {
          create: { userId: input.ownerId, role: 'OWNER' },
        },
      },
      include: { members: true },
    })
  },

  // 列出某使用者所屬的所有家庭
  findAllForUser(userId: string) {
    return prisma.family.findMany({
      where: { members: { some: { userId } } },
      include: { members: true },
    })
  },

  // 加入成員（一般成員）：發起者本身必須是該家庭成員，才能新增其他人
  async addMember(input: { familyId: string; userId: string; requesterId: string }) {
    await familyService.assertMember(input.requesterId, input.familyId)
    return prisma.familyMember.create({
      data: { familyId: input.familyId, userId: input.userId, role: 'MEMBER' },
    })
  },
}
