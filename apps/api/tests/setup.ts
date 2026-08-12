import 'dotenv/config'
import { afterAll } from 'vitest'
import { testDatabaseUrl } from './testDatabaseUrl'

// 每個測試檔執行前：把 DATABASE_URL 改指向 test schema
// 必須在 import app 之前生效（PrismaClient 在 import 時就讀取連線字串）
process.env.DATABASE_URL = testDatabaseUrl(process.env.DATABASE_URL!)

// 測試結束關閉連線，避免 vitest 卡住不結束
afterAll(async () => {
  const { prisma } = await import('../src/prisma/client')
  await prisma.$disconnect()
})
