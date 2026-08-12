import { PrismaClient } from '@prisma/client'

// Prisma Client 單例：避免開發時 hot-reload 重複建立連線
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // production / test 只記錯誤（vitest 會自動設 NODE_ENV=test，避免 query log 洗版）
    log:
      process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
        ? ['error']
        : ['query', 'warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
