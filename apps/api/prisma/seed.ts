// 種子資料：建立一個 demo 使用者 + 家庭 + 兩筆行程
//   1) 東京自由行（5/12–5/15，四天三夜）
//   2) 關西七日遊（10/10–10/16，七天六夜：大阪＋京都，含兩間飯店與行李清單）
// 可重複執行（先清掉舊的 demo 資料）
// 執行：npm run seed --workspace @travel-app/api

import '../src/config/loadEnv'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const DEMO_EMAIL = 'demo@travel-app.com'
const DEMO_PASSWORD = 'demo1234'

// 一天行程的輸入格式（time 為 "HH:MM"，寫入時轉成當天 +09:00 的 DateTime）
type ActivityIn = {
  time: string
  title: string
  type: string
  place?: string
  hours?: string
  price?: number
  note?: string
}
type DayIn = { date: string; dayNumber: number; theme: string; items: ActivityIn[] }

// 建立多天行程與活動（兩筆行程共用）
async function createDays(tripId: string, daysData: DayIn[]) {
  for (const d of daysData) {
    await prisma.tripDay.create({
      data: {
        tripId,
        date: new Date(d.date),
        dayNumber: d.dayNumber,
        theme: d.theme,
        activities: {
          create: d.items.map((it, idx) => ({
            title: it.title,
            startTime: new Date(`${d.date}T${it.time}:00+09:00`),
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
  }
}

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

  // ────────────────────────────────────────────
  // 行程一：東京自由行（5/12 – 5/15）
  // ────────────────────────────────────────────
  const trip = await prisma.trip.create({
    data: {
      title: '東京自由行',
      startDate: new Date('2026-05-12'),
      endDate: new Date('2026-05-15'),
      familyId: family.id,
      destination: '日本・東京',
      currency: 'JPY',
      symbol: '¥',
      fx: 0.21, // 1 JPY ≈ 0.21 TWD
    },
  })
  console.log(`  ✓ 行程 ${trip.title}`)

  const tokyoDays: DayIn[] = [
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
  await createDays(trip.id, tokyoDays)

  // 航班：去程 CI 100、回程 CI 101
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

  // 飯店：上野 燦路都大飯店
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

  // ────────────────────────────────────────────
  // 行程二：關西七日遊（10/10 – 10/16，七天六夜）
  // ────────────────────────────────────────────
  const kansaiTrip = await prisma.trip.create({
    data: {
      title: '關西七日遊',
      startDate: new Date('2026-10-10'),
      endDate: new Date('2026-10-16'),
      familyId: family.id,
      destination: '日本・大阪／京都',
      currency: 'JPY',
      symbol: '¥',
      fx: 0.21,
    },
  })
  console.log(`  ✓ 行程 ${kansaiTrip.title}`)

  const kansaiDays: DayIn[] = [
    {
      date: '2026-10-10',
      dayNumber: 1,
      theme: '抵達大阪・道頓堀',
      items: [
        {
          time: '14:00',
          title: '關西機場 → 難波',
          type: 'move',
          place: '南海電鐵',
          price: 1490,
          note: '搭 Rapi:t 特急約 40 分',
        },
        {
          time: '15:30',
          title: '飯店 Check-in',
          type: 'move',
          place: '難波',
          note: '先放行李再出門',
        },
        {
          time: '17:00',
          title: '道頓堀・固力果跑跑人',
          type: 'spot',
          place: '道頓堀',
          note: '戎橋拍照、川邊散步',
        },
        {
          time: '18:30',
          title: '晚餐・蟹道樂本店',
          type: 'food',
          place: '道頓堀',
          price: 6000,
          note: '建議預約，招牌螃蟹會席',
        },
        {
          time: '20:30',
          title: '心齋橋筋商店街',
          type: 'shop',
          place: '心斎橋',
          note: '藥妝補貨，多數店開到 21:00',
        },
      ],
    },
    {
      date: '2026-10-11',
      dayNumber: 2,
      theme: '大阪城・梅田',
      items: [
        {
          time: '09:30',
          title: '大阪城天守閣',
          type: 'spot',
          place: '大阪城公園',
          hours: '09:00–17:00',
          price: 600,
          note: '護城河與西之丸庭園，登頂看市景',
        },
        {
          time: '12:30',
          title: '午餐・大阪燒 千房',
          type: 'food',
          place: '梅田',
          price: 1600,
        },
        {
          time: '14:30',
          title: '梅田藍天大廈・空中庭園',
          type: 'spot',
          place: '梅田スカイビル',
          hours: '09:30–22:30',
          price: 1500,
          note: '360 度露天展望台',
        },
        {
          time: '17:00',
          title: 'HEP FIVE 摩天輪・逛街',
          type: 'shop',
          place: '梅田',
          note: '紅色摩天輪是地標',
        },
        {
          time: '19:00',
          title: '晚餐・新梅田食道街',
          type: 'food',
          place: '梅田',
          price: 2000,
          note: '串炸、立吞居酒屋',
        },
      ],
    },
    {
      date: '2026-10-12',
      dayNumber: 3,
      theme: '環球影城 USJ',
      items: [
        {
          time: '08:00',
          title: '出發前往 USJ',
          type: 'move',
          place: 'JR ゆめ咲線',
          note: '開園前 30 分到，入園衝瑪利歐園區',
        },
        {
          time: '09:00',
          title: '超級任天堂世界',
          type: 'spot',
          place: 'USJ',
          hours: '09:00–21:00',
          price: 8900,
          note: '門票先線上買好；需抽整理券',
        },
        {
          time: '13:00',
          title: '午餐・奇諾比奧咖啡店',
          type: 'food',
          place: 'USJ',
          price: 2500,
        },
        {
          time: '15:00',
          title: '哈利波特魔法世界',
          type: 'spot',
          place: 'USJ',
          note: '奶油啤酒、活米村',
        },
        {
          time: '20:00',
          title: '晚餐・環球城市大道',
          type: 'food',
          place: 'Universal City Walk',
          price: 1800,
        },
      ],
    },
    {
      date: '2026-10-13',
      dayNumber: 4,
      theme: '奈良餵鹿・移動京都',
      items: [
        {
          time: '09:00',
          title: '難波 → 奈良',
          type: 'move',
          place: '近鐵奈良線',
          price: 680,
          note: '快速急行約 40 分；行李寄放飯店',
        },
        {
          time: '10:00',
          title: '奈良公園餵鹿',
          type: 'spot',
          place: '奈良公園',
          price: 200,
          note: '鹿仙貝一份 ¥200，小心被搶',
        },
        {
          time: '11:30',
          title: '東大寺大佛殿',
          type: 'spot',
          place: '奈良',
          hours: '07:30–17:30',
          price: 800,
          note: '世界最大木造建築',
        },
        {
          time: '13:00',
          title: '午餐・中谷堂麻糬＋商店街',
          type: 'food',
          place: '奈良町',
          price: 1200,
          note: '看高速搗麻糬表演',
        },
        {
          time: '16:00',
          title: '奈良 → 京都・飯店 Check-in',
          type: 'move',
          place: '近鐵京都線',
          price: 760,
          note: '回大阪取行李後移動京都',
        },
        {
          time: '19:00',
          title: '晚餐・京都車站拉麵小路',
          type: 'food',
          place: '京都駅',
          price: 1300,
        },
      ],
    },
    {
      date: '2026-10-14',
      dayNumber: 5,
      theme: '清水寺・祇園',
      items: [
        {
          time: '09:00',
          title: '清水寺・清水舞台',
          type: 'spot',
          place: '東山区',
          hours: '06:00–18:00',
          price: 400,
          note: '早上人少好拍，音羽瀑布排隊',
        },
        {
          time: '11:00',
          title: '二年坂・三年坂',
          type: 'shop',
          place: '東山',
          note: '抹茶甜點、和風小物',
        },
        {
          time: '13:00',
          title: '午餐・順正湯豆腐',
          type: 'food',
          place: '清水',
          price: 3000,
          note: '京都名物湯豆腐會席',
        },
        {
          time: '15:00',
          title: '八坂神社・円山公園',
          type: 'spot',
          place: '祇園',
          price: 0,
        },
        {
          time: '17:00',
          title: '祇園花見小路散策',
          type: 'spot',
          place: '祇園',
          note: '運氣好可遇見藝妓',
        },
        {
          time: '18:30',
          title: '晚餐・先斗町',
          type: 'food',
          place: '先斗町',
          price: 3500,
          note: '鴨川納涼床（依季節）',
        },
      ],
    },
    {
      date: '2026-10-15',
      dayNumber: 6,
      theme: '嵐山・金閣寺',
      items: [
        {
          time: '09:00',
          title: '嵐山竹林小徑',
          type: 'spot',
          place: '嵐山',
          price: 0,
          note: '早上去避開人潮',
        },
        {
          time: '10:30',
          title: '渡月橋・保津川',
          type: 'spot',
          place: '嵐山',
          note: '河岸散步，可搭人力車',
        },
        {
          time: '12:00',
          title: '午餐・嵐山 よしむら蕎麥麵',
          type: 'food',
          place: '嵐山',
          price: 1800,
          note: '窗邊座位看渡月橋',
        },
        {
          time: '14:30',
          title: '金閣寺（鹿苑寺）',
          type: 'spot',
          place: '北区金閣寺町',
          hours: '09:00–17:00',
          price: 500,
          note: '倒影池畔拍照',
        },
        {
          time: '17:00',
          title: '錦市場・京都之廚房',
          type: 'shop',
          place: '中京区',
          hours: '10:00–18:00',
          note: '邊走邊吃：玉子燒、豆乳甜甜圈',
        },
        {
          time: '19:00',
          title: '晚餐・京都塔下居酒屋',
          type: 'food',
          place: '京都駅',
          price: 2500,
        },
      ],
    },
    {
      date: '2026-10-16',
      dayNumber: 7,
      theme: '伏見稻荷・回程',
      items: [
        {
          time: '08:00',
          title: '伏見稻荷大社・千本鳥居',
          type: 'spot',
          place: '伏見区',
          price: 0,
          note: '一早去拍無人鳥居，走到四辻約 45 分',
        },
        {
          time: '11:00',
          title: '午餐・稻荷壽司＋抹茶',
          type: 'food',
          place: '伏見',
          price: 1200,
        },
        {
          time: '12:30',
          title: '京都 → 關西機場',
          type: 'move',
          place: 'JR はるか特急',
          price: 3110,
          note: '約 80 分，預留報到時間',
        },
        {
          time: '15:00',
          title: '機場免稅店採買',
          type: 'shop',
          place: 'KIX',
          note: '白色戀人、Royce 生巧克力',
        },
      ],
    },
  ]
  await createDays(kansaiTrip.id, kansaiDays)

  // 航班：去程 BR 132、回程 BR 177
  await prisma.flight.createMany({
    data: [
      {
        tripId: kansaiTrip.id,
        flightNumber: 'BR 132',
        airline: '長榮航空',
        departureAirport: 'TPE',
        arrivalAirport: 'KIX',
        departureTime: new Date('2026-10-10T08:40:00+08:00'),
        arrivalTime: new Date('2026-10-10T12:20:00+09:00'),
        aircraft: 'A330-300',
        accessNote: '桃機二航廈，06:40 前抵達報到；家裡出發搭機捷直達',
      },
      {
        tripId: kansaiTrip.id,
        flightNumber: 'BR 177',
        airline: '長榮航空',
        departureAirport: 'KIX',
        arrivalAirport: 'TPE',
        departureTime: new Date('2026-10-16T17:30:00+09:00'),
        arrivalTime: new Date('2026-10-16T19:40:00+08:00'),
        aircraft: 'A330-300',
        accessNote: '京都搭 HARUKA 特急直達 KIX，約 80 分',
      },
    ],
  })
  console.log(`  ✓ 航班 2 筆 (BR 132 去程 / BR 177 回程)`)

  // 飯店：大阪 3 晚 + 京都 3 晚
  await prisma.hotel.createMany({
    data: [
      {
        tripId: kansaiTrip.id,
        name: '難波東方酒店',
        address: '難波站 徒步 5 分',
        lat: 34.667,
        lng: 135.5015,
        checkIn: new Date('2026-10-10T15:00:00+09:00'),
        checkOut: new Date('2026-10-13T11:00:00+09:00'),
        bookingRef: 'OSK-20261010',
        roomInfo: '雙床房 ×2',
      },
      {
        tripId: kansaiTrip.id,
        name: '京都世紀酒店',
        address: '京都車站 徒步 2 分',
        lat: 34.9871,
        lng: 135.7594,
        checkIn: new Date('2026-10-13T15:00:00+09:00'),
        checkOut: new Date('2026-10-16T11:00:00+09:00'),
        bookingRef: 'KYT-20261013',
        roomInfo: '家庭房 ×1（4 人）',
      },
    ],
  })
  console.log(`  ✓ 飯店 2 筆 (難波東方酒店 / 京都世紀酒店)`)

  // 行李清單（航班詳細頁顯示）
  await prisma.packingItem.createMany({
    data: [
      { tripId: kansaiTrip.id, name: '護照＋簽證影本', checked: true },
      { tripId: kansaiTrip.id, name: '日本網卡 / eSIM', checked: true },
      { tripId: kansaiTrip.id, name: '行動電源', checked: false },
      { tripId: kansaiTrip.id, name: 'ICOCA 卡', checked: false },
      { tripId: kansaiTrip.id, name: '摺疊雨傘', checked: false },
      { tripId: kansaiTrip.id, name: 'USJ 門票（手機截圖備份）', checked: false },
    ],
  })
  console.log(`  ✓ 行李清單 6 筆`)

  // 記帳（記帳 tab 顯示;付款人掛 demo 使用者）
  await prisma.expense.createMany({
    data: [
      {
        tripId: kansaiTrip.id,
        title: '南海電鐵 Rapi:t 車票',
        amount: 1490,
        category: 'transport',
        date: new Date('2026-10-10'),
        payerId: user.id,
      },
      {
        tripId: kansaiTrip.id,
        title: '蟹道樂晚餐',
        amount: 6000,
        category: 'food',
        date: new Date('2026-10-10'),
        payerId: user.id,
        note: '兩人會席',
      },
      {
        tripId: kansaiTrip.id,
        title: '心齋橋藥妝',
        amount: 8200,
        category: 'shopping',
        date: new Date('2026-10-10'),
      },
      {
        tripId: kansaiTrip.id,
        title: 'USJ 門票',
        amount: 8900,
        category: 'ticket',
        date: new Date('2026-10-12'),
        payerId: user.id,
        note: '線上購票',
      },
    ],
  })
  console.log(`  ✓ 記帳 4 筆`)

  console.log('\n✅ Seed 完成')
  console.log(`   登入用：${DEMO_EMAIL} / ${DEMO_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
