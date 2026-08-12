// 種子資料：建立一個 demo 使用者 + 家庭 + 一筆完整的東京 5/12–5/15 行程
// 對應設計檔 data.js 的 japan region；可重複執行（先清掉舊的 demo 資料）
// 執行：npm run seed --workspace @travel-app/api

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_EMAIL = 'demo@travel-app.com'
const DEMO_PASSWORD = 'demo1234'

async function main() {
  console.log('🌱 開始 seed...')

  // 1) 清掉舊的 demo 使用者（Cascade 會帶走 family / trip / 等）
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (existing) {
    console.log('  ↻ 清掉舊的 demo 資料')
    await prisma.user.delete({ where: { id: existing.id } })
  }

  // 2) 建立 demo 使用者
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Demo 使用者',
      passwordHash,
    },
  })
  console.log(`  ✓ 使用者 ${user.email}`)

  // 3) 建立家庭（demo 使用者自動為 OWNER）
  const family = await prisma.family.create({
    data: {
      name: 'Demo 家庭',
      members: {
        create: { userId: user.id, role: 'OWNER' },
      },
    },
  })
  console.log(`  ✓ 家庭 ${family.name}`)

  // 4) 建立東京行程（5/12 – 5/15）含幣別 + 匯率
  const trip = await prisma.trip.create({
    data: {
      title: '東京自由行',
      startDate: new Date('2026-05-12'),
      endDate: new Date('2026-05-15'),
      familyId: family.id,
      currency: 'JPY',
      symbol: '¥',
      fx: 0.21, // 1 JPY ≈ 0.21 TWD
    },
  })
  console.log(`  ✓ 行程 ${trip.title}`)

  // 5) 三天行程（Day 1–Day 3）
  type ActivityIn = {
    time: string
    title: string
    type: string
    place?: string
    hours?: string
    price?: number
    note?: string
  }
  const daysData: { date: string; dayNumber: number; theme: string; items: ActivityIn[] }[] = [
    {
      date: '2026-05-12',
      dayNumber: 1,
      theme: '淺草・上野',
      items: [
        {
          time: '08:30',
          title: '旅館出發',
          type: 'move',
          place: '上野 ホテル',
          note: '寄放行李於櫃台',
        },
        {
          time: '09:20',
          title: '淺草寺・雷門',
          type: 'spot',
          place: '台東区浅草',
          hours: '06:00–17:00',
          price: 0,
          note: '仲見世通り商店街，人形燒、雷門前拍照',
        },
        {
          time: '12:00',
          title: '午餐・大黑家天婦羅',
          type: 'food',
          place: '浅草',
          price: 2200,
          note: '招牌炸蝦天丼，現金優先',
        },
        {
          time: '14:00',
          title: '上野恩賜公園・動物園',
          type: 'spot',
          place: '台東区上野公園',
          hours: '09:30–17:00',
          price: 600,
          note: '貓熊館排隊約 30 分',
        },
        {
          time: '17:30',
          title: '阿美橫丁逛街',
          type: 'shop',
          place: 'アメ横',
          note: '藥妝、零食、海鮮丼，傍晚最熱鬧',
        },
      ],
    },
    {
      date: '2026-05-13',
      dayNumber: 2,
      theme: '原宿・澀谷',
      items: [
        {
          time: '10:00',
          title: '明治神宮',
          type: 'spot',
          place: '渋谷区代々木',
          hours: '05:00–18:00',
          price: 0,
          note: '南參道森林步道，清酒樽',
        },
        {
          time: '11:30',
          title: '竹下通り',
          type: 'shop',
          place: '原宿',
          note: '可麗餅、潮流小店，假日人潮多',
        },
        {
          time: '13:00',
          title: '午餐・一蘭拉麵',
          type: 'food',
          place: '原宿',
          price: 1290,
          note: '需先買食券',
        },
        {
          time: '15:00',
          title: 'SHIBUYA SKY 展望台',
          type: 'spot',
          place: '渋谷スクランブルスクエア',
          hours: '10:00–22:30',
          price: 2200,
          note: '建議線上預約黃昏時段',
        },
        {
          time: '18:30',
          title: '澀谷十字路口・晚餐',
          type: 'food',
          place: '渋谷',
          note: '鐵板燒或居酒屋',
        },
      ],
    },
    {
      date: '2026-05-14',
      dayNumber: 3,
      theme: '押上・銀座',
      items: [
        {
          time: '10:00',
          title: '東京晴空塔',
          type: 'spot',
          place: '墨田区押上',
          hours: '10:00–21:00',
          price: 2100,
          note: '天望甲板 350m，可加購回廊',
        },
        {
          time: '13:00',
          title: '午餐・晴空塔餐廳街',
          type: 'food',
          place: 'Tokyo Solamachi',
          price: 1800,
        },
        {
          time: '15:30',
          title: '銀座購物',
          type: 'shop',
          place: '銀座',
          note: 'UNIQLO 旗艦、伊東屋文具、GINZA SIX',
        },
        {
          time: '19:00',
          title: '晚餐・銀座壽司',
          type: 'food',
          place: '銀座',
          price: 4500,
          note: '建議預約',
        },
      ],
    },
  ]

  for (const d of daysData) {
    // 把 "08:30" 轉成當天的 DateTime（用本地時區，前端只取時/分）
    const baseDate = d.date
    const day = await prisma.tripDay.create({
      data: {
        tripId: trip.id,
        date: new Date(baseDate),
        dayNumber: d.dayNumber,
        theme: d.theme,
        activities: {
          create: d.items.map((it, idx) => ({
            title: it.title,
            startTime: new Date(`${baseDate}T${it.time}:00+09:00`),
            type: it.type,
            place: it.place ?? null,
            hours: it.hours ?? null,
            price: it.price ?? null,
            note: it.note ?? null,
            order: idx,
          })),
        },
      },
    })
    console.log(`  ✓ Day ${d.dayNumber} (${d.theme}) - ${d.items.length} 個項目`)
    void day
  }

  // 6) 航班：去程 CI 100、回程 CI 101
  await prisma.flight.createMany({
    data: [
      {
        tripId: trip.id,
        flightNumber: 'CI 100',
        airline: '中華航空',
        departureAirport: 'TPE',
        arrivalAirport: 'NRT',
        departureTime: new Date('2026-05-12T08:50:00+08:00'),
        arrivalTime: new Date('2026-05-12T13:05:00+09:00'),
      },
      {
        tripId: trip.id,
        flightNumber: 'CI 101',
        airline: '中華航空',
        departureAirport: 'NRT',
        arrivalAirport: 'TPE',
        departureTime: new Date('2026-05-15T14:25:00+09:00'),
        arrivalTime: new Date('2026-05-15T17:35:00+08:00'),
      },
    ],
  })
  console.log(`  ✓ 航班 2 筆 (CI 100 去程 / CI 101 回程)`)

  // 7) 飯店：上野 燦路都大飯店
  await prisma.hotel.create({
    data: {
      tripId: trip.id,
      name: '上野 燦路都大飯店',
      address: '上野站 徒步 3 分',
      checkIn: new Date('2026-05-12T15:00:00+09:00'),
      checkOut: new Date('2026-05-15T11:00:00+09:00'),
      bookingRef: null,
    },
  })
  console.log(`  ✓ 飯店 上野 燦路都大飯店`)

  console.log('\n✅ Seed 完成')
  console.log(`   登入用：${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
