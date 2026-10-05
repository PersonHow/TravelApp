import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.AVIATION_STACK_API_KEY
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

  it('以正規化航班號呼叫 AviationStack，並收斂上游欄位', async () => {
    process.env.AVIATION_STACK_API_KEY = 'test-api-key'
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            {
              flight: { iata: 'BR198' },
              airline: { name: 'EVA Air' },
              departure: {
                iata: 'TPE',
                airport: 'Taiwan Taoyuan International Airport',
                scheduled: '2026-10-10T08:50:00+00:00',
              },
              arrival: {
                iata: 'NRT',
                airport: 'Narita International Airport',
                scheduled: '2026-10-10T13:05:00+00:00',
              },
              aircraft: { iata: 'A359' },
              flight_status: 'scheduled',
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const res = await request(app)
      .get('/api/flights/search?flightNumber=br%20198')
      .set(auth(session.accessToken))

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]))
    expect(requestUrl.origin + requestUrl.pathname).toBe('https://api.aviationstack.com/v1/flights')
    expect(requestUrl.searchParams.get('access_key')).toBe('test-api-key')
    expect(requestUrl.searchParams.get('flight_iata')).toBe('BR198')
    expect(res.body.data).toEqual([
      {
        flightNumber: 'BR198',
        airline: 'EVA Air',
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        departureTime: '2026-10-10T08:50:00+00:00',
        arrivalTime: '2026-10-10T13:05:00+00:00',
        aircraft: 'A359',
        status: 'scheduled',
      },
    ])
  })

  it('AviationStack HTTP 失敗時回 502，不洩漏上游內容', async () => {
    process.env.AVIATION_STACK_API_KEY = 'test-api-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('provider detail must not leak', { status: 429 }),
    )

    const res = await request(app)
      .get('/api/flights/search?flightNumber=CI777')
      .set(auth(session.accessToken))

    expect(res.status).toBe(502)
    expect(res.body.error).toMatchObject({
      code: 'UPSTREAM_ERROR',
      message: 'AviationStack 服務回應異常',
    })
    expect(JSON.stringify(res.body)).not.toContain('provider detail')
  })

  it('AviationStack JSON 錯誤回應時回 502', async () => {
    process.env.AVIATION_STACK_API_KEY = 'test-api-key'
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: 'invalid_access_key', message: 'Invalid access key' } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )

    const res = await request(app)
      .get('/api/flights/search?flightNumber=JL802')
      .set(auth(session.accessToken))

    expect(res.status).toBe(502)
    expect(res.body.error.code).toBe('UPSTREAM_ERROR')
  })
})
