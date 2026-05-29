import { prisma } from '../prisma/client'

// 家庭商業邏輯
export const familyService = {
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

  // 加入成員（一般成員）
  addMember(input: { familyId: string; userId: string }) {
    return prisma.familyMember.create({
      data: { familyId: input.familyId, userId: input.userId, role: 'MEMBER' },
    })
  },
}
