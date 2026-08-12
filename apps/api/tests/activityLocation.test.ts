import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, createFamilyAndTrip, register } from './helpers'

// 活動精確位置欄位（placeId/lat/lng）：建立帶入、更新清空

let counter = 0
const uniqueEmail = () => `actloc-${Date.now()}-${counter++}@test.com`

describe('活動精確位置', () => {
  let token: string
  let tripId: string
  let dayId: string

  beforeEach(async () => {
    const session = await register(uniqueEmail())
    token = session.accessToken
    tripId = (await createFamilyAndTrip(token)).tripId
    const day = await request(app)
      .post(`/api/trips/${tripId}/days`)
      .set(auth(token))
      .send({ date: '2026-07-01', dayNumber: 1 })
    dayId = day.body.data.id
  })

  it('建立活動可存座標，更新可清空', async () => {
    const created = await request(app)
      .post(`/api/trips/${tripId}/days/${dayId}/activities`)
      .set(auth(token))
      .send({
        title: '淺草寺',
        type: 'spot',
        placeId: 'ChIJ8T1GpMGOGGARDYGSgpooDWw',
        lat: 35.7147651,
        lng: 139.7966553,
      })
    expect(created.status).toBe(201)
    expect(created.body.data.placeId).toBe('ChIJ8T1GpMGOGGARDYGSgpooDWw')
    expect(created.body.data.lat).toBeCloseTo(35.7147651)
    expect(created.body.data.lng).toBeCloseTo(139.7966553)

    // 移除精確定位：三欄位一起清空
    const cleared = await request(app)
      .put(`/api/trips/${tripId}/activities/${created.body.data.id}`)
      .set(auth(token))
      .send({ placeId: null, lat: null, lng: null })
    expect(cleared.status).toBe(200)
    expect(cleared.body.data.placeId).toBeNull()
    expect(cleared.body.data.lat).toBeNull()
    expect(cleared.body.data.lng).toBeNull()
  })

  it('不帶座標建立時三欄位為 null（相容既有流程）', async () => {
    const created = await request(app)
      .post(`/api/trips/${tripId}/days/${dayId}/activities`)
      .set(auth(token))
      .send({ title: '手動輸入的活動' })
    expect(created.status).toBe(201)
    expect(created.body.data.placeId).toBeNull()
    expect(created.body.data.lat).toBeNull()
    expect(created.body.data.lng).toBeNull()
  })
})
