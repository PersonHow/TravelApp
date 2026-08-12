import { beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, register, type Session } from './helpers'

// 家庭：建立者自動成 OWNER、只有成員能加人
describe('families', () => {
  let owner: Session
  let outsider: Session
  let familyId: string

  beforeAll(async () => {
    owner = await register('fam-owner@test.local')
    outsider = await register('fam-outsider@test.local')
  })

  it('建立家庭：建立者自動成為 OWNER 成員', async () => {
    const res = await request(app)
      .post('/api/families')
      .set(auth(owner.accessToken))
      .send({ name: '王家' })
    expect(res.status).toBe(201)
    familyId = res.body.data.id
    const members = res.body.data.members
    expect(members).toHaveLength(1)
    expect(members[0]).toMatchObject({ userId: owner.user.id, role: 'OWNER' })
  })

  it('list：只回自己所屬的家庭', async () => {
    const mine = await request(app).get('/api/families').set(auth(owner.accessToken))
    expect(mine.body.data.map((f: { id: string }) => f.id)).toContain(familyId)

    const others = await request(app).get('/api/families').set(auth(outsider.accessToken))
    expect(others.body.data).toHaveLength(0)
  })

  it('list：成員帶使用者基本資料（名字/email）', async () => {
    const res = await request(app).get('/api/families').set(auth(owner.accessToken))
    const family = res.body.data.find((f: { id: string }) => f.id === familyId)
    expect(family.members[0].user).toMatchObject({ id: owner.user.id, email: owner.user.email })
  })

  it('非成員不能邀請人進別人的家庭（403）', async () => {
    const res = await request(app)
      .post(`/api/families/${familyId}/members`)
      .set(auth(outsider.accessToken))
      .send({ email: outsider.user.email })
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('邀請不存在的 email 回 404', async () => {
    const res = await request(app)
      .post(`/api/families/${familyId}/members`)
      .set(auth(owner.accessToken))
      .send({ email: 'nobody@test.local' })
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('成員可以用 email 邀請新成員，新成員角色為 MEMBER', async () => {
    const res = await request(app)
      .post(`/api/families/${familyId}/members`)
      .set(auth(owner.accessToken))
      .send({ email: outsider.user.email })
    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ userId: outsider.user.id, role: 'MEMBER' })
    expect(res.body.data.user).toMatchObject({ email: outsider.user.email })

    // 加入後就看得到這個家庭了
    const list = await request(app).get('/api/families').set(auth(outsider.accessToken))
    expect(list.body.data.map((f: { id: string }) => f.id)).toContain(familyId)
  })

  it('重複邀請已是成員的人回 409', async () => {
    const res = await request(app)
      .post(`/api/families/${familyId}/members`)
      .set(auth(owner.accessToken))
      .send({ email: outsider.user.email })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })
})
