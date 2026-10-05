import '../src/config/loadEnv'
import { flightSearchService } from '../src/services/flightSearchService'

// 手動驗證真實 AviationStack 連線；不納入一般測試，避免消耗每月 API 額度。
async function main() {
  const apiKey = process.env.AVIATION_STACK_API_KEY
  if (!apiKey || apiKey === 'mock') {
    throw new Error('請先在根目錄或 apps/api/.env 設定 AVIATION_STACK_API_KEY，再執行此驗證')
  }

  const flightNumber = (process.argv[2] ?? 'BR198').replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z0-9]{2,10}$/.test(flightNumber)) {
    throw new Error('航班號格式錯誤，例如 BR198')
  }

  const results = await flightSearchService.search({ flightNumber })
  console.log(`AviationStack 連線成功；${flightNumber} 查到 ${results.length} 筆資料`)
  console.log(JSON.stringify(results.slice(0, 3), null, 2))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'AviationStack 驗證失敗')
  process.exitCode = 1
})
