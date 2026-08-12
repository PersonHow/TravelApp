import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, createFamilyAndTrip, register, type Session } from './helpers'

// 行程巢狀資源：行程日 / 活動 / 飯店 / 航班
// 核心商業規則：除了家庭成員授權，子資源必須「隸屬於該行程」才能讀寫
describe('trip nested resources', () => {
  let member: Session
  let outsider: Session
  let tripId: string
  let otherTripId: string // member 自己的另一個行程（測跨行程保護）
  let dayId: string

  beforeAll(async () => {
    member = await register('nested-member@test.local')
    outsider = await register('nested-outsider@test.local')
    tripId = (await createFamilyAndTrip(member.accessToken, '主行程')).tripId
    otherTripId = (await createFamilyAndTrip(member.accessToken, '別的行程')).tripId
  })

  describe('行程日（days）', () => {
    it('新增一天成功，回傳含空的 activities', async () => {
      const res = await request(app)
        .post(`/api/trips/${tripId}/days`)
        .set(auth(member.accessToken))
        .send({ date: '2026-07-01', dayNumber: 1, theme: '淺草' })
      expect(res.status).toBe(201)
      expect(res.body.data).toMatchObject({ tripId, dayNumber: 1, theme: '淺草' })
      expect(res.body.data.activities).toEqual([])
      dayId = res.body.data.id
    })

    it('同行程 dayNumber 重複回 409 CONFLICT', async () => {
      const res = await request(app)
        .post(`/api/trips/${tripId}/days`)
        .set(auth(member.accessToken))
        .send({ date: '2026-07-02', dayNumber: 1 })
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('CONFLICT')
    })

    it('不同行程可以用同一個 dayNumber', async () => {
      const res = await request(app)
        .post(`/api/trips/${otherTripId}/days`)
        .set(auth(member.accessToken))
        .send({ date: '2026-07-01', dayNumber: 1 })
      expect(res.status).toBe(201)
    })

    it('更新一天：只改有傳的欄位', async () => {
      const res = await request(app)
        .put(`/api/trips/${tripId}/days/${dayId}`)
        .set(auth(member.accessToken))
        .send({ theme: '淺草・上野' })
      expect(res.status).toBe(200)
      expect(res.body.data.theme).toBe('淺草・上野')
      expect(res.body.data.dayNumber).toBe(1)
    })

    it('跨行程保護：拿 A 行程的權限改不屬於它的 day 回 404', async () => {
      // dayId 屬於 tripId，但路徑帶 otherTripId
      const res = await request(app)
        .put(`/api/trips/${otherTripId}/days/${dayId}`)
        .set(auth(member.accessToken))
        .send({ theme: '不該成功' })
      expect(res.status).toBe(404)
    })

    it('非家庭成員操作回 403', async () => {
      const res = await request(app)
        .post(`/api/trips/${tripId}/days`)
        .set(auth(outsider.accessToken))
        .send({ date: '2026-07-03', dayNumber: 9 })
      expect(res.status).toBe(403)
    })

    it('缺必填欄位回 400', async () => {
      const res = await request(app)
        .post(`/api/trips/${tripId}/days`)
        .set(auth(member.accessToken))
        .send({ theme: '沒日期' })
      expect(res.status).toBe(400)
    })
  })

  describe('每日活動（activities）', () => {
    let activityId: string

    it('新增活動：欄位完整寫入', async () => {
      const res = await request(app)
        .post(`/api/trips/${tripId}/days/${dayId}/activities`)
        .set(auth(member.accessToken))
        .send({
          title: '淺草寺',
          type: 'spot',
          place: '台東区浅草',
          hours: '06:00–17:00',
          price: 0,
          startTime: '2026-07-01T09:30:00Z',
        })
      expect(res.status).toBe(201)
      expect(res.body.data).toMatchObject({
        tripDayId: dayId,
        title: '淺草寺',
        type: 'spot',
        place: '台東区浅草',
        price: 0, // 0 = 免費，不能被當成「沒填」丟掉
      })
      activityId = res.body.data.id
    })

    it('缺 title 回 400', async () => {
      const res = await request(app)
        .post(`/api/trips/${tripId}/days/${dayId}/activities`)
        .set(auth(member.accessToken))
        .send({ place: '某處' })
      expect(res.status).toBe(400)
    })

    it('更新活動：可清空欄位（price: null）', async () => {
      const res = await request(app)
        .put(`/api/trips/${tripId}/activities/${activityId}`)
        .set(auth(member.accessToken))
        .send({ title: '淺草寺（早場）', price: null })
      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('淺草寺（早場）')
      expect(res.body.data.price).toBeNull()
    })

    it('換天：傳 tripDayId 把活動搬到同行程另一天', async () => {
      const day2 = await request(app)
        .post(`/api/trips/${tripId}/days`)
        .set(auth(member.accessToken))
        .send({ date: '2026-07-02', dayNumber: 2 })
      const res = await request(app)
        .put(`/api/trips/${tripId}/activities/${activityId}`)
        .set(auth(member.accessToken))
        .send({ tripDayId: day2.body.data.id })
      expect(res.status).toBe(200)
      expect(res.body.data.tripDayId).toBe(day2.body.data.id)
    })

    it('不能把活動搬到「別的行程」的某一天（404）', async () => {
      const otherDay = await request(app)
        .post(`/api/trips/${otherTripId}/days`)
        .set(auth(member.accessToken))
        .send({ date: '2026-07-02', dayNumber: 2 })
      const res = await request(app)
        .put(`/api/trips/${tripId}/activities/${activityId}`)
        .set(auth(member.accessToken))
        .send({ tripDayId: otherDay.body.data.id })
      expect(res.status).toBe(404)
    })

    it('刪除一天會連帶刪掉其下活動（cascade）', async () => {
      // 建一個臨時的 day + activity，刪掉 day 後活動要消失
      const day = await request(app)
        .post(`/api/trips/${tripId}/days`)
        .set(auth(member.accessToken))
        .send({ date: '2026-07-03', dayNumber: 3 })
      const act = await request(app)
        .post(`/api/trips/${tripId}/days/${day.body.data.id}/activities`)
        .set(auth(member.accessToken))
        .send({ title: '臨時活動' })

      const del = await request(app)
        .delete(`/api/trips/${tripId}/days/${day.body.data.id}`)
        .set(auth(member.accessToken))
      expect(del.status).toBe(200)

      // 活動跟著消失：再更新它要 404
      const gone = await request(app)
        .put(`/api/trips/${tripId}/activities/${act.body.data.id}`)
        .set(auth(member.accessToken))
        .send({ title: 'x' })
      expect(gone.status).toBe(404)
    })
  })

  describe('飯店（hotels）', () => {
    let hotelId: string

    it('新增飯店成功；缺 checkIn 回 400', async () => {
      const ok = await request(app)
        .post(`/api/trips/${tripId}/hotels`)
        .set(auth(member.accessToken))
        .send({
          name: '淺草豪景',
          checkIn: '2026-07-01T15:00:00Z',
          checkOut: '2026-07-05T10:00:00Z',
          bookingRef: 'BK-1',
        })
      expect(ok.status).toBe(201)
      expect(ok.body.data).toMatchObject({ tripId, name: '淺草豪景', bookingRef: 'BK-1' })
      hotelId = ok.body.data.id

      const bad = await request(app)
        .post(`/api/trips/${tripId}/hotels`)
        .set(auth(member.accessToken))
        .send({ name: '沒日期飯店' })
      expect(bad.status).toBe(400)
    })

    it('更新與跨行程保護', async () => {
      const ok = await request(app)
        .put(`/api/trips/${tripId}/hotels/${hotelId}`)
        .set(auth(member.accessToken))
        .send({ address: '台東区花川戸' })
      expect(ok.status).toBe(200)
      expect(ok.body.data.address).toBe('台東区花川戸')

      const wrongTrip = await request(app)
        .put(`/api/trips/${otherTripId}/hotels/${hotelId}`)
        .set(auth(member.accessToken))
        .send({ name: '不該成功' })
      expect(wrongTrip.status).toBe(404)
    })

    it('非成員刪除回 403；成員刪除成功', async () => {
      const forbidden = await request(app)
        .delete(`/api/trips/${tripId}/hotels/${hotelId}`)
        .set(auth(outsider.accessToken))
      expect(forbidden.status).toBe(403)

      const ok = await request(app)
        .delete(`/api/trips/${tripId}/hotels/${hotelId}`)
        .set(auth(member.accessToken))
      expect(ok.status).toBe(200)
    })
  })

  describe('航班（flights）', () => {
    let flightId: string

    it('新增航班成功；缺欄位回 400', async () => {
      const ok = await request(app)
        .post(`/api/trips/${tripId}/flights`)
        .set(auth(member.accessToken))
        .send({
          flightNumber: 'BR198',
          departureAirport: 'TPE',
          arrivalAirport: 'NRT',
          departureTime: '2026-07-01T09:25:00Z',
          arrivalTime: '2026-07-01T13:40:00Z',
        })
      expect(ok.status).toBe(201)
      expect(ok.body.data).toMatchObject({ tripId, flightNumber: 'BR198' })
      flightId = ok.body.data.id

      const bad = await request(app)
        .post(`/api/trips/${tripId}/flights`)
        .set(auth(member.accessToken))
        .send({ flightNumber: 'BR999' })
      expect(bad.status).toBe(400)
    })

    it('日期格式錯誤回 400', async () => {
      const res = await request(app)
        .post(`/api/trips/${tripId}/flights`)
        .set(auth(member.accessToken))
        .send({
          flightNumber: 'BR200',
          departureAirport: 'TPE',
          arrivalAirport: 'NRT',
          departureTime: 'not-a-date',
          arrivalTime: '2026-07-01T13:40:00Z',
        })
      expect(res.status).toBe(400)
    })

    it('更新（含機型/前往方式）、跨行程保護、刪除', async () => {
      const ok = await request(app)
        .put(`/api/trips/${tripId}/flights/${flightId}`)
        .set(auth(member.accessToken))
        .send({ airline: '長榮航空', aircraft: 'A350-900', accessNote: '搭機捷直達 T2' })
      expect(ok.status).toBe(200)
      expect(ok.body.data).toMatchObject({
        airline: '長榮航空',
        aircraft: 'A350-900',
        accessNote: '搭機捷直達 T2',
      })

      const wrongTrip = await request(app)
        .delete(`/api/trips/${otherTripId}/flights/${flightId}`)
        .set(auth(member.accessToken))
      expect(wrongTrip.status).toBe(404)

      const del = await request(app)
        .delete(`/api/trips/${tripId}/flights/${flightId}`)
        .set(auth(member.accessToken))
      expect(del.status).toBe(200)
    })
  })

  describe('行李清單（packing）', () => {
    let itemId: string

    it('新增項目成功，預設未勾選；缺 name 回 400', async () => {
      const ok = await request(app)
        .post(`/api/trips/${tripId}/packing`)
        .set(auth(member.accessToken))
        .send({ name: '護照' })
      expect(ok.status).toBe(201)
      expect(ok.body.data).toMatchObject({ tripId, name: '護照', checked: false })
      itemId = ok.body.data.id

      const bad = await request(app)
        .post(`/api/trips/${tripId}/packing`)
        .set(auth(member.accessToken))
        .send({})
      expect(bad.status).toBe(400)
    })

    it('非成員不能新增（403）', async () => {
      const res = await request(app)
        .post(`/api/trips/${tripId}/packing`)
        .set(auth(outsider.accessToken))
        .send({ name: '牙刷' })
      expect(res.status).toBe(403)
    })

    it('勾選／取消勾選；checked 非布林回 400', async () => {
      const ok = await request(app)
        .put(`/api/trips/${tripId}/packing/${itemId}`)
        .set(auth(member.accessToken))
        .send({ checked: true })
      expect(ok.status).toBe(200)
      expect(ok.body.data.checked).toBe(true)

      const bad = await request(app)
        .put(`/api/trips/${tripId}/packing/${itemId}`)
        .set(auth(member.accessToken))
        .send({ checked: 'yes' })
      expect(bad.status).toBe(400)
    })

    it('行程詳細會帶出 packingItems', async () => {
      const res = await request(app).get(`/api/trips/${tripId}`).set(auth(member.accessToken))
      expect(res.status).toBe(200)
      expect(res.body.data.packingItems).toHaveLength(1)
      expect(res.body.data.packingItems[0]).toMatchObject({ name: '護照', checked: true })
    })

    it('跨行程保護：拿別的行程動不屬於它的項目回 404；刪除成功', async () => {
      const wrongTrip = await request(app)
        .delete(`/api/trips/${otherTripId}/packing/${itemId}`)
        .set(auth(member.accessToken))
      expect(wrongTrip.status).toBe(404)

      const del = await request(app)
        .delete(`/api/trips/${tripId}/packing/${itemId}`)
        .set(auth(member.accessToken))
      expect(del.status).toBe(200)
    })
  })

  it('行程詳細頁會帶出剩下的巢狀資料', async () => {
    const res = await request(app).get(`/api/trips/${tripId}`).set(auth(member.accessToken))
    expect(res.status).toBe(200)
    // 主行程目前剩 day1(空)、day2(含搬過來的活動)
    const days = res.body.data.tripDays
    expect(days).toHaveLength(2)
    const day2 = days.find((d: { dayNumber: number }) => d.dayNumber === 2)
    expect(day2.activities.map((a: { title: string }) => a.title)).toContain('淺草寺（早場）')
  })
})
