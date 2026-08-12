import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, createFamilyAndTrip, register, type Session } from './helpers'

// 行程 CRUD 與「家庭成員身分」授權
describe('trips', () => {
  let member: Session
  let outsider: Session
  let familyId: string
  let tripId: string

  beforeAll(async () => {
    member = await register('trip-member@test.local')
    outsider = await register('trip-outsider@test.local')
    const created = await createFamilyAndTrip(member.accessToken, '東京行')
    familyId = created.familyId
    tripId = created.tripId
  })

  it('建立行程：必須是目標家庭成員（非成員 403）', async () => {
    const res = await request(app).post('/api/trips').set(auth(outsider.accessToken)).send({
      title: '偷渡行程',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      familyId,
    })
    expect(res.status).toBe(403)
  })

  it('list：只回自己所屬家庭的行程', async () => {
    const mine = await request(app).get('/api/trips').set(auth(member.accessToken))
    expect(mine.status).toBe(200)
    expect(mine.body.data.map((t: { id: string }) => t.id)).toContain(tripId)

    const others = await request(app).get('/api/trips').set(auth(outsider.accessToken))
    expect(others.body.data).toHaveLength(0)
  })

  it('get：成員拿得到（含巢狀資料），非成員 403，不存在 404', async () => {
    const ok = await request(app).get(`/api/trips/${tripId}`).set(auth(member.accessToken))
    expect(ok.status).toBe(200)
    expect(ok.body.data.title).toBe('東京行')
    // 巢狀欄位都要在（前端 TripDetail 依賴這個形狀）
    expect(ok.body.data).toHaveProperty('tripDays')
    expect(ok.body.data).toHaveProperty('hotels')
    expect(ok.body.data).toHaveProperty('flights')
    expect(ok.body.data).toHaveProperty('tripAttractions')

    const forbidden = await request(app).get(`/api/trips/${tripId}`).set(auth(outsider.accessToken))
    expect(forbidden.status).toBe(403)

    const missing = await request(app).get('/api/trips/no-such-trip').set(auth(member.accessToken))
    expect(missing.status).toBe(404)
  })

  it('update：成員可改且只改有傳的欄位，非成員 403', async () => {
    const res = await request(app)
      .put(`/api/trips/${tripId}`)
      .set(auth(member.accessToken))
      .send({ title: '東京行（改）' })
    expect(res.status).toBe(200)
    expect(res.body.data.title).toBe('東京行（改）')
    // 沒傳的欄位不能被動到
    expect(res.body.data.startDate).toContain('2026-07-01')

    const forbidden = await request(app)
      .put(`/api/trips/${tripId}`)
      .set(auth(outsider.accessToken))
      .send({ title: '駭客改名' })
    expect(forbidden.status).toBe(403)
  })

  it('delete：非成員 403；成員刪除後再查回 404', async () => {
    const { tripId: tempTrip } = await createFamilyAndTrip(member.accessToken, '待刪行程')

    const forbidden = await request(app)
      .delete(`/api/trips/${tempTrip}`)
      .set(auth(outsider.accessToken))
    expect(forbidden.status).toBe(403)

    const ok = await request(app).delete(`/api/trips/${tempTrip}`).set(auth(member.accessToken))
    expect(ok.status).toBe(200)

    const gone = await request(app).get(`/api/trips/${tempTrip}`).set(auth(member.accessToken))
    expect(gone.status).toBe(404)
  })

  it('成為家庭成員後就能存取該家庭的行程', async () => {
    await request(app)
      .post(`/api/families/${familyId}/members`)
      .set(auth(member.accessToken))
      .send({ email: outsider.user.email })

    const res = await request(app).get(`/api/trips/${tripId}`).set(auth(outsider.accessToken))
    expect(res.status).toBe(200)
  })
})
