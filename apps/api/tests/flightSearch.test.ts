import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, register, type Session } from './helpers'

// 航班搜尋端點：401（未登入）、400（缺航班號）、503（無金鑰）、mock 模式回替身資料
// AVIATION_STACK_API_KEY=mock 時不打真實 API（同 aiService 慣例）

describe('航班搜尋 /api/flights/search', () => {
  let session: Session

  beforeEach(async () => {
    // 測試不受開發者本機 .env 的金鑰影響，逐測試自行設定
    delete process.env.AVIATION_STACK_API_KEY
    session = await register(`flight-search-${Date.now()}-${Math.random()}@test.local`)
  })

  it('未登入回 401', async () => {
    const res = await request(app).get('/api/flights/search?flightNumber=BR198')
    expect(res.status).toBe(401)
  })

  it('缺 flightNumber 回 400', async () => {
    process.env.AVIATION_STACK_API_KEY = 'mock'
    const res = await request(app).get('/api/flights/search').set(auth(session.accessToken))
    expect(res.status).toBe(400)
  })

  it('無金鑰回 503 INTEGRATION_NOT_CONFIGURED', async () => {
    const res = await request(app)
      .get('/api/flights/search?flightNumber=BR198')
      .set(auth(session.accessToken))
    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('INTEGRATION_NOT_CONFIGURED')
  })

  it('mock 模式回正規化的替身資料（航班號轉大寫去空白）', async () => {
    process.env.AVIATION_STACK_API_KEY = 'mock'
    const res = await request(app)
      .get('/api/flights/search?flightNumber=br 198')
      .set(auth(session.accessToken))
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data[0]).toMatchObject({
      flightNumber: 'BR198',
      departureAirport: 'TPE',
      arrivalAirport: 'NRT',
    })
    // 正規化欄位齊全（給前端帶入表單用）
    expect(res.body.data[0]).toHaveProperty('departureTime')
    expect(res.body.data[0]).toHaveProperty('aircraft')
  })
})
