import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app, auth, register } from './helpers'

// 認證流程：註冊 / 登入 / refresh / me
describe('auth', () => {
  const EMAIL = 'auth-user@test.local'

  it('註冊成功回 201，含 user 與雙 token，且不洩漏密碼雜湊', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: EMAIL, name: '小明', password: 'pass1234' })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user).toMatchObject({ email: EMAIL, name: '小明' })
    expect(res.body.data.accessToken).toBeTruthy()
    expect(res.body.data.refreshToken).toBeTruthy()
    expect(JSON.stringify(res.body)).not.toContain('passwordHash')
  })

  it('重複 email 註冊回 409 EMAIL_TAKEN', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: EMAIL, name: '重複', password: 'pass1234' })
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('缺必填欄位回 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@test.local' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })

  it('正確密碼登入成功', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'pass1234' })
    expect(res.status).toBe(200)
    expect(res.body.data.user.email).toBe(EMAIL)
    expect(res.body.data.accessToken).toBeTruthy()
  })

  it('錯誤密碼回 401，且不透露帳號是否存在', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'wrong-password' })
    expect(res.status).toBe(401)
    // 不存在的帳號也要回一樣的訊息
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-such@test.local', password: 'pass1234' })
    expect(res2.status).toBe(401)
    expect(res2.body.error.message).toBe(res.body.error.message)
  })

  it('me：帶 access token 回使用者資料；沒帶回 401', async () => {
    const session = await register('auth-me@test.local')
    const ok = await request(app).get('/api/auth/me').set(auth(session.accessToken))
    expect(ok.status).toBe(200)
    expect(ok.body.data.id).toBe(session.user.id)

    const noToken = await request(app).get('/api/auth/me')
    expect(noToken.status).toBe(401)
  })

  it('refresh：用 refresh token 換新雙 token', async () => {
    const session = await register('auth-refresh@test.local')
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.refreshToken })
    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeTruthy()
    expect(res.body.data.refreshToken).toBeTruthy()
    // 換到的新 access token 要真的能用
    const me = await request(app).get('/api/auth/me').set(auth(res.body.data.accessToken))
    expect(me.status).toBe(200)
  })

  it('refresh：拿 access token 充當 refresh token 要被擋（401）', async () => {
    const session = await register('auth-refresh-type@test.local')
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: session.accessToken })
    expect(res.status).toBe(401)
  })

  it('access token 不能反過來當 me 以外受保護路由都擋亂湊的 token', async () => {
    const res = await request(app).get('/api/trips').set(auth('not-a-real-token'))
    expect(res.status).toBe(401)
  })
})
