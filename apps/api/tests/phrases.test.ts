import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, createFamilyAndTrip, register } from './helpers'

// 旅遊短句端點：授權（403／404）、503（無金鑰）、400（無目的地）、mock 生成與重新生成
// ANTHROPIC_API_KEY=mock 時 aiService 直接回替身資料，不打真實 API

let counter = 0
const uniqueEmail = () => `phrase-${Date.now()}-${counter++}@test.com`

// 幫 trip 補上目的地（生成的前置條件）
async function setDestination(token: string, tripId: string, destination = '日本・東京') {
  const res = await request(app).put(`/api/trips/${tripId}`).set(auth(token)).send({ destination })
  expect(res.status).toBe(200)
  expect(res.body.data.destination).toBe(destination)
}

describe('旅遊短句 /api/trips/:id/phrases', () => {
  let token: string
  let tripId: string

  beforeEach(async () => {
    // 測試不受開發者本機 .env 的金鑰影響，逐測試自行設定
    delete process.env.ANTHROPIC_API_KEY
    const session = await register(uniqueEmail())
    token = session.accessToken
    const created = await createFamilyAndTrip(token)
    tripId = created.tripId
  })

  it('建立行程可帶目的地，更新可清空', async () => {
    const fam = await request(app)
      .post('/api/families')
      .set(auth(token))
      .send({ name: '目的地家庭' })
    const res = await request(app).post('/api/trips').set(auth(token)).send({
      title: '帶目的地的行程',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
      familyId: fam.body.data.id,
      destination: '韓國・首爾',
    })
    expect(res.status).toBe(201)
    expect(res.body.data.destination).toBe('韓國・首爾')

    const cleared = await request(app)
      .put(`/api/trips/${res.body.data.id}`)
      .set(auth(token))
      .send({ destination: null })
    expect(cleared.body.data.destination).toBeNull()
  })

  it('未生成前列表為空陣列', async () => {
    const res = await request(app).get(`/api/trips/${tripId}/phrases`).set(auth(token))
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })

  it('非家庭成員讀取／生成回 403', async () => {
    const outsider = await register(uniqueEmail())
    const list = await request(app)
      .get(`/api/trips/${tripId}/phrases`)
      .set(auth(outsider.accessToken))
    expect(list.status).toBe(403)

    const gen = await request(app)
      .post(`/api/trips/${tripId}/phrases/generate`)
      .set(auth(outsider.accessToken))
    expect(gen.status).toBe(403)
  })

  it('行程不存在回 404', async () => {
    const res = await request(app).get('/api/trips/nonexistent/phrases').set(auth(token))
    expect(res.status).toBe(404)
  })

  it('未填目的地時生成回 400', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock'
    const res = await request(app).post(`/api/trips/${tripId}/phrases/generate`).set(auth(token))
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('未設定金鑰時生成回 503 INTEGRATION_NOT_CONFIGURED', async () => {
    await setDestination(token, tripId)
    const res = await request(app).post(`/api/trips/${tripId}/phrases/generate`).set(auth(token))
    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('INTEGRATION_NOT_CONFIGURED')
  })

  it('mock 金鑰可生成並存入 DB，列表讀得到', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock'
    await setDestination(token, tripId)

    const gen = await request(app).post(`/api/trips/${tripId}/phrases/generate`).set(auth(token))
    expect(gen.status).toBe(201)
    expect(gen.body.data.length).toBeGreaterThan(0)
    // 每句都有必要欄位且分類合法
    const categories = ['greeting', 'dining', 'transport', 'shopping', 'emergency']
    for (const p of gen.body.data) {
      expect(categories).toContain(p.category)
      expect(p.text).toBeTruthy()
      expect(p.meaning).toBeTruthy()
    }

    const list = await request(app).get(`/api/trips/${tripId}/phrases`).set(auth(token))
    expect(list.body.data.length).toBe(gen.body.data.length)
  })

  it('重新生成會清掉舊的（數量不累積、id 全換新）', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock'
    await setDestination(token, tripId)

    const first = await request(app).post(`/api/trips/${tripId}/phrases/generate`).set(auth(token))
    const second = await request(app).post(`/api/trips/${tripId}/phrases/generate`).set(auth(token))
    expect(second.body.data.length).toBe(first.body.data.length)

    const firstIds = new Set(first.body.data.map((p: { id: string }) => p.id))
    for (const p of second.body.data) {
      expect(firstIds.has(p.id)).toBe(false)
    }
  })
})
