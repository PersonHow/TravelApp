// 把開發用的 DATABASE_URL 轉成指向 test schema 的連線字串
export function testDatabaseUrl(base: string): string {
  return base.includes('?') ? `${base}&schema=test` : `${base}?schema=test`
}
