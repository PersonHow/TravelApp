import { defineConfig } from 'vitest/config'

// 整合測試設定：連本機 Postgres 的獨立 test schema（見 tests/globalSetup.ts）
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: './tests/globalSetup.ts',
    setupFiles: ['./tests/setup.ts'],
    // 測試共用同一個 test schema，序列執行避免資料互相干擾
    fileParallelism: false,
    testTimeout: 15000,
  },
})
