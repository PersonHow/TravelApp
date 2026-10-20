import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, createFamilyAndTrip, register, type Session } from './helpers'

// 行程讀取、管理者操作與家庭成員協作權限
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

  it('建立行程：日期無效或結束日早於開始日回 400', async () => {
    const invalid = await request(app).post('/api/trips').set(auth(member.accessToken)).send({
      title: '日期錯誤',
      startDate: 'not-a-date',
      endDate: '2026-08-03',
      familyId,
    })
    expect(invalid.status).toBe(400)

    const reversed = await request(app).post('/api/trips').set(auth(member.accessToken)).send({
      title: '日期倒置',
      startDate: '2026-08-05',
      endDate: '2026-08-03',
      familyId,
    })
    expect(reversed.status).toBe(400)
  })

  it('新旅程可一次建立日期範圍內的空白 Days', async () => {
    const created = await request(app).post('/api/trips').set(auth(member.accessToken)).send({
      title: '手動規劃旅程',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      familyId,
      createDays: true,
    })
    expect(created.status).toBe(201)

    const detail = await request(app)
      .get(`/api/trips/${created.body.data.id}`)
      .set(auth(member.accessToken))
    expect(detail.body.data.tripDays.map((day: { dayNumber: number }) => day.dayNumber)).toEqual([
      1, 2, 3,
    ])
    expect(
      detail.body.data.tripDays.every(
        (day: { activities: unknown[] }) => day.activities.length === 0,
      ),
    ).toBe(true)
    const firstDayId = detail.body.data.tripDays[0].id
    const activity = await request(app)
      .post(`/api/trips/${created.body.data.id}/days/${firstDayId}/activities`)
      .set(auth(member.accessToken))
      .send({ title: '手動新增活動' })
    expect(activity.status).toBe(201)
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

  it('修改開始日會同步 DAY 日期；不能縮短到截掉既有 DAY', async () => {
    const { tripId: datedTrip } = await createFamilyAndTrip(member.accessToken, '改期行程')
    await request(app)
      .post(`/api/trips/${datedTrip}/days`)
      .set(auth(member.accessToken))
      .send({ date: '2026-07-02', dayNumber: 2 })

    const moved = await request(app)
      .put(`/api/trips/${datedTrip}`)
      .set(auth(member.accessToken))
      .send({ startDate: '2026-07-10', endDate: '2026-07-14' })
    expect(moved.status).toBe(200)

    const detail = await request(app).get(`/api/trips/${datedTrip}`).set(auth(member.accessToken))
    expect(detail.body.data.tripDays[0].date).toContain('2026-07-11')

    const shortened = await request(app)
      .put(`/api/trips/${datedTrip}`)
      .set(auth(member.accessToken))
      .send({ endDate: '2026-07-10' })
    expect(shortened.status).toBe(409)
    expect(shortened.body.error.code).toBe('TRIP_DAYS_OUT_OF_RANGE')
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

  it('一般 MEMBER 可讀取，但不能改旅程基本資料、刪除或在家庭內建立旅程', async () => {
    const update = await request(app)
      .put(`/api/trips/${tripId}`)
      .set(auth(outsider.accessToken))
      .send({ title: '不應成功' })
    expect(update.status).toBe(403)

    const remove = await request(app).delete(`/api/trips/${tripId}`).set(auth(outsider.accessToken))
    expect(remove.status).toBe(403)

    const create = await request(app).post('/api/trips').set(auth(outsider.accessToken)).send({
      title: '一般成員建立',
      startDate: '2026-09-01',
      endDate: '2026-09-03',
      familyId,
    })
    expect(create.status).toBe(403)
  })
})
