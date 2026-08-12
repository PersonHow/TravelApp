import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, createFamilyAndTrip, register } from './helpers'

// AI 規劃行程：角色授權（OWNER/ADMIN 限定）、503／400、mock 生成不落地、套用寫入與附加
// ANTHROPIC_API_KEY=mock 時 aiService 直接回替身草稿（2 天、每天 3 個活動）

let counter = 0
const uniqueEmail = () => `aiplan-${Date.now()}-${counter++}@test.com`

async function setDestination(token: string, tripId: string) {
  const res = await request(app)
    .put(`/api/trips/${tripId}`)
    .set(auth(token))
    .send({ destination: '日本・東京' })
  expect(res.status).toBe(200)
}

describe('AI 規劃行程 /api/trips/:id/ai-plan', () => {
  let ownerToken: string
  let familyId: string
  let tripId: string

  beforeEach(async () => {
    delete process.env.ANTHROPIC_API_KEY
    const owner = await register(uniqueEmail())
    ownerToken = owner.accessToken
    const created = await createFamilyAndTrip(ownerToken) // 2026-07-01 ~ 07-05（5 天）
    familyId = created.familyId
    tripId = created.tripId
  })

  it('一般成員（MEMBER）生成／套用回 403，OWNER 可以', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock'
    await setDestination(ownerToken, tripId)

    // 邀請進家庭的成員預設是 MEMBER
    const member = await register(uniqueEmail())
    const invite = await request(app)
      .post(`/api/families/${familyId}/members`)
      .set(auth(ownerToken))
      .send({ email: member.user.email })
    expect(invite.status).toBe(201)

    const gen = await request(app)
      .post(`/api/trips/${tripId}/ai-plan`)
      .set(auth(member.accessToken))
      .send({})
    expect(gen.status).toBe(403)

    const apply = await request(app)
      .post(`/api/trips/${tripId}/ai-plan/apply`)
      .set(auth(member.accessToken))
      .send({ days: [{ dayNumber: 1, activities: [{ title: '測試' }] }] })
    expect(apply.status).toBe(403)

    // MEMBER 仍能讀行程（403 只擋 AI 排程，不影響一般權限）
    const detail = await request(app).get(`/api/trips/${tripId}`).set(auth(member.accessToken))
    expect(detail.status).toBe(200)

    const ownerGen = await request(app)
      .post(`/api/trips/${tripId}/ai-plan`)
      .set(auth(ownerToken))
      .send({})
    expect(ownerGen.status).toBe(200)
  })

  it('非成員回 403、行程不存在回 404', async () => {
    const outsider = await register(uniqueEmail())
    const res = await request(app)
      .post(`/api/trips/${tripId}/ai-plan`)
      .set(auth(outsider.accessToken))
      .send({})
    expect(res.status).toBe(403)

    const missing = await request(app)
      .post('/api/trips/nonexistent/ai-plan')
      .set(auth(ownerToken))
      .send({})
    expect(missing.status).toBe(404)
  })

  it('未填目的地回 400', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock'
    const res = await request(app)
      .post(`/api/trips/${tripId}/ai-plan`)
      .set(auth(ownerToken))
      .send({})
    expect(res.status).toBe(400)
  })

  it('未設定金鑰回 503 INTEGRATION_NOT_CONFIGURED', async () => {
    await setDestination(ownerToken, tripId)
    const res = await request(app)
      .post(`/api/trips/${tripId}/ai-plan`)
      .set(auth(ownerToken))
      .send({})
    expect(res.status).toBe(503)
    expect(res.body.error.code).toBe('INTEGRATION_NOT_CONFIGURED')
  })

  it('mock 生成回草稿但不寫 DB', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock'
    await setDestination(ownerToken, tripId)

    const res = await request(app)
      .post(`/api/trips/${tripId}/ai-plan`)
      .set(auth(ownerToken))
      .send({ pace: 'moderate', interests: '動漫', note: '有帶長輩' })
    expect(res.status).toBe(200)
    expect(res.body.data.days.length).toBeGreaterThan(0)
    expect(res.body.data.days[0].activities[0].title).toBeTruthy()

    // 草稿不落地：行程的 tripDays 仍是空的
    const detail = await request(app).get(`/api/trips/${tripId}`).set(auth(ownerToken))
    expect(detail.body.data.tripDays).toEqual([])
  })

  it('套用會寫入 TripDay/DayActivity；同 dayNumber 再套用會附加活動', async () => {
    process.env.ANTHROPIC_API_KEY = 'mock'
    const days = [
      {
        dayNumber: 1,
        theme: '抵達・淺草',
        activities: [
          { title: '淺草寺', type: 'spot', place: '浅草', startTime: '2026-07-01T08:00:00.000Z' },
          { title: '晚餐：一蘭', type: 'food' },
        ],
      },
      { dayNumber: 2, activities: [{ title: '上野公園', type: 'spot' }] },
    ]

    const first = await request(app)
      .post(`/api/trips/${tripId}/ai-plan/apply`)
      .set(auth(ownerToken))
      .send({ days })
    expect(first.status).toBe(201)
    const day1 = first.body.data.find((d: { dayNumber: number }) => d.dayNumber === 1)
    expect(day1.theme).toBe('抵達・淺草')
    expect(day1.activities.length).toBe(2)
    expect(first.body.data.length).toBe(2)

    // 同 dayNumber 再套用：活動附加、order 接在後面，不會撞 409
    const second = await request(app)
      .post(`/api/trips/${tripId}/ai-plan/apply`)
      .set(auth(ownerToken))
      .send({ days: [{ dayNumber: 1, activities: [{ title: '雷門拍照', type: 'spot' }] }] })
    expect(second.status).toBe(201)
    const day1After = second.body.data.find((d: { dayNumber: number }) => d.dayNumber === 1)
    expect(day1After.activities.length).toBe(3)
    expect(day1After.activities.map((a: { order: number }) => a.order).sort()).toEqual([0, 1, 2])
  })

  it('套用驗證：days 空回 400、dayNumber 超出旅程天數回 400', async () => {
    const empty = await request(app)
      .post(`/api/trips/${tripId}/ai-plan/apply`)
      .set(auth(ownerToken))
      .send({ days: [] })
    expect(empty.status).toBe(400)

    const outOfRange = await request(app)
      .post(`/api/trips/${tripId}/ai-plan/apply`)
      .set(auth(ownerToken))
      .send({ days: [{ dayNumber: 99, activities: [{ title: '測試' }] }] })
    expect(outOfRange.status).toBe(400)
  })
})
