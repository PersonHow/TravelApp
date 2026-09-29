import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, createFamilyAndTrip, register, type Session } from './helpers'

// 記帳端點：CRUD、驗證（400）、授權（403）、跨行程保護（404）、付款人需為家庭成員、trip detail 含 expenses

describe('記帳 /api/trips/:id/expenses', () => {
  let member: Session
  let outsider: Session
  let tripId: string
  let otherTripId: string
  let expenseId: string

  beforeAll(async () => {
    member = await register('expense-member@test.local')
    outsider = await register('expense-outsider@test.local')
    tripId = (await createFamilyAndTrip(member.accessToken, '記帳行程')).tripId
    otherTripId = (await createFamilyAndTrip(member.accessToken, '別的行程')).tripId
  })

  it('新增帳目成功，回傳含 payer 資料', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set(auth(member.accessToken))
      .send({
        title: '一蘭拉麵',
        amount: 1290,
        category: 'food',
        date: '2026-07-02',
        payerId: member.user.id,
        note: '晚餐',
      })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({
      tripId,
      title: '一蘭拉麵',
      amount: 1290,
      category: 'food',
      note: '晚餐',
    })
    expect(res.body.data.payer).toMatchObject({ id: member.user.id, name: member.user.name })
    expect(res.body.data.payer.passwordHash).toBeUndefined()
    expenseId = res.body.data.id
  })

  it('缺必填欄位回 400', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set(auth(member.accessToken))
      .send({ title: '沒金額' })
    expect(res.status).toBe(400)
  })

  it('金額非整數或負數回 400', async () => {
    for (const amount of [12.5, -100, 'abc']) {
      const res = await request(app)
        .post(`/api/trips/${tripId}/expenses`)
        .set(auth(member.accessToken))
        .send({ title: '壞金額', amount, category: 'food', date: '2026-07-02' })
      expect(res.status).toBe(400)
    }
  })

  it('分類不在清單內回 400', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set(auth(member.accessToken))
      .send({ title: '壞分類', amount: 100, category: 'invalid', date: '2026-07-02' })
    expect(res.status).toBe(400)
  })

  it('付款人不是家庭成員回 400', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set(auth(member.accessToken))
      .send({
        title: '外人付錢',
        amount: 100,
        category: 'other',
        date: '2026-07-02',
        payerId: outsider.user.id,
      })
    expect(res.status).toBe(400)
  })

  it('更新帳目：只改有傳的欄位，payerId 傳 null 可清空', async () => {
    const res = await request(app)
      .put(`/api/trips/${tripId}/expenses/${expenseId}`)
      .set(auth(member.accessToken))
      .send({ amount: 1500, payerId: null })
    expect(res.status).toBe(200)
    expect(res.body.data.amount).toBe(1500)
    expect(res.body.data.title).toBe('一蘭拉麵')
    expect(res.body.data.payer).toBeNull()
  })

  it('trip detail 含 expenses（依日期排序）', async () => {
    await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set(auth(member.accessToken))
      .send({ title: '早的帳', amount: 200, category: 'transport', date: '2026-07-01' })
    const res = await request(app).get(`/api/trips/${tripId}`).set(auth(member.accessToken))
    expect(res.status).toBe(200)
    expect(res.body.data.expenses.length).toBe(2)
    expect(res.body.data.expenses[0].title).toBe('早的帳')
  })

  it('跨行程保護：拿別的行程路徑改帳目回 404', async () => {
    const res = await request(app)
      .put(`/api/trips/${otherTripId}/expenses/${expenseId}`)
      .set(auth(member.accessToken))
      .send({ amount: 999 })
    expect(res.status).toBe(404)
  })

  it('非家庭成員操作回 403', async () => {
    const res = await request(app)
      .post(`/api/trips/${tripId}/expenses`)
      .set(auth(outsider.accessToken))
      .send({ title: '外人記帳', amount: 100, category: 'food', date: '2026-07-02' })
    expect(res.status).toBe(403)
  })

  it('刪除帳目成功', async () => {
    const res = await request(app)
      .delete(`/api/trips/${tripId}/expenses/${expenseId}`)
      .set(auth(member.accessToken))
    expect(res.status).toBe(200)
    const detail = await request(app).get(`/api/trips/${tripId}`).set(auth(member.accessToken))
    expect(detail.body.data.expenses.length).toBe(1)
  })
})
