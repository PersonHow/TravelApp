import request from 'supertest'
import { createApp } from '../src/app'

// 所有測試共用的 app 實例與常用流程
export const app = createApp()

export interface Session {
  user: { id: string; email: string; name: string }
  accessToken: string
  refreshToken: string
}

// 註冊一個使用者並回傳 session（email 各測試檔自行確保不重複）
export async function register(email: string, name = '測試者'): Promise<Session> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, name, password: 'pass1234' })
  if (res.status !== 201) throw new Error(`register 失敗：${JSON.stringify(res.body)}`)
  return res.body.data
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

// 建立家庭 + 行程，回傳兩者 id（多數行程測試的前置）
export async function createFamilyAndTrip(token: string, title = '測試行程') {
  const fam = await request(app).post('/api/families').set(auth(token)).send({ name: '測試家庭' })
  if (fam.status !== 201) throw new Error(`建立家庭失敗：${JSON.stringify(fam.body)}`)
  const familyId: string = fam.body.data.id

  const trip = await request(app).post('/api/trips').set(auth(token)).send({
    title,
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    familyId,
  })
  if (trip.status !== 201) throw new Error(`建立行程失敗：${JSON.stringify(trip.body)}`)
  return { familyId, tripId: trip.body.data.id as string }
}
