import { execSync } from 'node:child_process'
import 'dotenv/config'
import { testDatabaseUrl } from './testDatabaseUrl'

// 整體測試前置：把 Postgres 的 test schema 重置成目前的 prisma schema
// 用 schema 隔離（?schema=test），不會動到開發用的 public schema 資料
export default function setup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL 未設定（apps/api/.env），且測試需要本機 Postgres：docker-compose up -d',
    )
  }
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl(process.env.DATABASE_URL) },
    stdio: 'pipe',
  })
}
