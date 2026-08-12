import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { aiService, loadPrompt } from './aiService'
import { familyService } from './familyService'

// AI 規劃行程（第二批＋第三批專家鏈）
// 兩段式：generate 回草稿（不落地）→ 使用者確認 → apply 才寫 DB
// 專家鏈：規劃師產草稿 → 審核專家把關 → 有問題修一輪才回給使用者

const ACTIVITY_TYPES = ['spot', 'food', 'shop', 'move'] as const

// 偏好步調 → 給 prompt 的描述
const PACE_LABELS: Record<string, string> = {
  relaxed: '悠閒（每天 3–4 個活動）',
  moderate: '適中（每天 4–6 個活動）',
  packed: '緊湊（每天 6 個以上活動）',
}

// 顯示日期/時間給 AI 看時用的時區
// 已知簡化：使用者輸入時間時是以自己裝置的時區存成絕對時刻（目前使用者都在台灣）
const TZ = 'Asia/Taipei'
const fmtDate = (d: Date) => d.toLocaleDateString('sv-SE', { timeZone: TZ }) // YYYY-MM-DD
const fmtTime = (d: Date) =>
  d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })

export interface AiPlanPreferences {
  pace?: string
  interests?: string
  note?: string
}

// AI 輸出／草稿的形狀（wire format 見 shared-types）
interface DraftActivity {
  title: string
  type: string
  place: string
  startTime: string
  endTime: string
  note: string
}
interface DraftDay {
  dayNumber: number
  theme: string
  activities: DraftActivity[]
}
interface RawDraft {
  days: DraftDay[]
}

// 套用時前端送來的形狀（時間已由前端轉成 ISO，跟手動新增活動同一套語意）
export interface ApplyDay {
  dayNumber: number
  theme?: string
  activities: {
    title: string
    type?: string
    place?: string
    startTime?: string
    endTime?: string
    note?: string
  }[]
}

// 強制規劃師輸出的 JSON Schema
const DRAFT_SCHEMA = {
  type: 'object',
  properties: {
    days: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dayNumber: { type: 'integer' },
          theme: { type: 'string' },
          activities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                type: { type: 'string', enum: [...ACTIVITY_TYPES] },
                place: { type: 'string' },
                startTime: { type: 'string' },
                endTime: { type: 'string' },
                note: { type: 'string' },
              },
              required: ['title', 'type', 'place', 'startTime', 'endTime', 'note'],
              additionalProperties: false,
            },
          },
        },
        required: ['dayNumber', 'theme', 'activities'],
        additionalProperties: false,
      },
    },
  },
  required: ['days'],
  additionalProperties: false,
}

// 強制審核專家輸出的 JSON Schema
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    approved: { type: 'boolean' },
    issues: { type: 'array', items: { type: 'string' } },
  },
  required: ['approved', 'issues'],
  additionalProperties: false,
}

// ANTHROPIC_API_KEY=mock 時的替身草稿（跑通「生成→預覽→套用」全流程用）
const MOCK_DRAFT: RawDraft = {
  days: [
    {
      dayNumber: 1,
      theme: '抵達・淺草',
      activities: [
        {
          title: '飯店寄放行李',
          type: 'move',
          place: '上野',
          startTime: '15:00',
          endTime: '15:30',
          note: '',
        },
        {
          title: '淺草寺・仲見世通',
          type: 'spot',
          place: '台東区浅草',
          startTime: '16:00',
          endTime: '18:00',
          note: '雷門拍照、逛小吃',
        },
        {
          title: '晚餐：一蘭拉麵',
          type: 'food',
          place: '上野',
          startTime: '18:30',
          endTime: '19:30',
          note: '',
        },
      ],
    },
    {
      dayNumber: 2,
      theme: '上野・秋葉原',
      activities: [
        {
          title: '上野恩賜公園',
          type: 'spot',
          place: '上野',
          startTime: '09:00',
          endTime: '11:00',
          note: '',
        },
        {
          title: '午餐：阿美橫丁小吃',
          type: 'food',
          place: '上野',
          startTime: '11:30',
          endTime: '12:30',
          note: '',
        },
        {
          title: '秋葉原電器街',
          type: 'shop',
          place: '秋葉原',
          startTime: '13:30',
          endTime: '17:00',
          note: '',
        },
      ],
    },
  ],
}

// 旅程天數（含頭含尾）
function tripDayCount(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1
}

// 第 n 天的日期（給新建 TripDay 用）
function dateOfDay(start: Date, dayNumber: number): Date {
  return new Date(start.getTime() + (dayNumber - 1) * 86400000)
}

// 授權＋撈行程完整資料（限 OWNER/ADMIN；行程不存在 404、非成員/一般成員 403）
async function assertPlanner(tripId: string, userId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      tripDays: { include: { activities: true }, orderBy: { dayNumber: 'asc' } },
      hotels: true,
      flights: true,
    },
  })
  if (!trip) throw AppError.notFound('找不到此行程')
  await familyService.assertRole(userId, trip.familyId, ['OWNER', 'ADMIN'])
  return trip
}

type PlannerTrip = Awaited<ReturnType<typeof assertPlanner>>

// 把行程現況＋偏好組成餵給 AI 的內容
function buildContext(trip: PlannerTrip, prefs: AiPlanPreferences, dayCount: number): string {
  const lines: string[] = [
    `目的地：${trip.destination}`,
    `日期：${fmtDate(trip.startDate)} ~ ${fmtDate(trip.endDate)}（共 ${dayCount} 天，dayNumber 1~${dayCount}）`,
  ]

  const pace = prefs.pace ? PACE_LABELS[prefs.pace] : undefined
  if (pace) lines.push(`步調偏好：${pace}`)
  if (prefs.interests?.trim()) lines.push(`興趣：${prefs.interests.trim()}`)
  if (prefs.note?.trim()) lines.push(`備註：${prefs.note.trim()}`)

  if (trip.flights.length > 0) {
    lines.push('', '## 航班（機場日請保守安排）')
    for (const f of trip.flights) {
      lines.push(
        `- ${f.flightNumber} ${f.departureAirport} ${fmtTime(f.departureTime)} → ${f.arrivalAirport} ${fmtTime(f.arrivalTime)}（${fmtDate(f.departureTime)}）`,
      )
    }
  }

  if (trip.hotels.length > 0) {
    lines.push('', '## 住宿')
    for (const h of trip.hotels) {
      lines.push(
        `- ${h.name}${h.address ? `（${h.address}）` : ''} 入住 ${fmtDate(h.checkIn)} ~ 退房 ${fmtDate(h.checkOut)}`,
      )
    }
  }

  const daysWithActivities = trip.tripDays.filter((d) => d.activities.length > 0)
  if (daysWithActivities.length > 0) {
    lines.push('', '## 既有安排（不要重複、不要衝突，新活動排在空檔）')
    for (const d of daysWithActivities) {
      lines.push(`第 ${d.dayNumber} 天${d.theme ? `（${d.theme}）` : ''}：`)
      for (const a of d.activities) {
        lines.push(`- ${a.startTime ? `${fmtTime(a.startTime)} ` : ''}${a.title}`)
      }
    }
  }

  return lines.join('\n')
}

// AI 輸出是外部邊界：夾掉範圍外的天、缺標題的活動，空字串轉 null
function normalizeDraft(raw: RawDraft, dayCount: number) {
  const days = (raw.days ?? [])
    .filter((d) => Number.isInteger(d.dayNumber) && d.dayNumber >= 1 && d.dayNumber <= dayCount)
    .map((d) => ({
      dayNumber: d.dayNumber,
      theme: d.theme?.trim() || null,
      activities: (d.activities ?? [])
        .filter((a) => a.title?.trim())
        .map((a) => ({
          title: a.title.trim(),
          type: (ACTIVITY_TYPES as readonly string[]).includes(a.type) ? a.type : null,
          place: a.place?.trim() || null,
          startTime: /^\d{2}:\d{2}$/.test(a.startTime) ? a.startTime : null,
          endTime: /^\d{2}:\d{2}$/.test(a.endTime) ? a.endTime : null,
          note: a.note?.trim() || null,
        })),
    }))
    .filter((d) => d.activities.length > 0)
    .sort((a, b) => a.dayNumber - b.dayNumber)
  return { days }
}

export const aiPlanService = {
  // 生成草稿（不寫 DB）：規劃師 → 審核專家 → 有問題修一輪
  async generate(tripId: string, userId: string, prefs: AiPlanPreferences) {
    const trip = await assertPlanner(tripId, userId)
    if (!trip.destination) {
      throw AppError.badRequest('請先在行程資訊填寫目的地，AI 才能規劃行程')
    }

    const dayCount = tripDayCount(trip.startDate, trip.endDate)
    const context = buildContext(trip, prefs, dayCount)
    const plannerSystem = loadPrompt('planTrip')

    // 1. 規劃師產草稿
    let draft = await aiService.generateJson<RawDraft>({
      system: plannerSystem,
      user: context,
      schema: DRAFT_SCHEMA,
      mock: MOCK_DRAFT,
    })

    // 2. 審核專家把關（第三批：太趕／繞路／忘了吃飯／航班衝突）
    const review = await aiService.generateJson<{ approved: boolean; issues: string[] }>({
      system: loadPrompt('reviewTrip'),
      user: `${context}\n\n## 待審核草稿\n${JSON.stringify(draft.days)}`,
      schema: REVIEW_SCHEMA,
      mock: { approved: true, issues: [] },
    })

    // 3. 有問題就讓規劃師照審核意見修一輪（最多一輪，控制成本）
    if (!review.approved && review.issues.length > 0) {
      draft = await aiService.generateJson<RawDraft>({
        system: plannerSystem,
        user: `${context}\n\n## 你的前一版草稿\n${JSON.stringify(draft.days)}\n\n## 審核意見（請逐條修正後重新輸出完整行程）\n${review.issues.map((i) => `- ${i}`).join('\n')}`,
        schema: DRAFT_SCHEMA,
        mock: MOCK_DRAFT,
      })
    }

    const normalized = normalizeDraft(draft, dayCount)
    if (normalized.days.length === 0) {
      throw new AppError(502, 'UPSTREAM_ERROR', 'AI 未產生有效行程，請稍後再試')
    }
    return normalized
  },

  // 套用草稿：確認後才寫 DB；dayNumber 已存在則把活動加進該天（order 接在既有活動後面）
  async apply(tripId: string, userId: string, days: ApplyDay[]) {
    const trip = await assertPlanner(tripId, userId)
    const dayCount = tripDayCount(trip.startDate, trip.endDate)

    for (const d of days) {
      if (!Number.isInteger(d.dayNumber) || d.dayNumber < 1 || d.dayNumber > dayCount) {
        throw AppError.badRequest(`dayNumber 必須在 1~${dayCount} 之間`)
      }
      if (!Array.isArray(d.activities) || d.activities.some((a) => !a.title?.trim())) {
        throw AppError.badRequest('每個活動都要有 title')
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const d of days) {
        const existing = trip.tripDays.find((x) => x.dayNumber === d.dayNumber)
        const day =
          existing ??
          (await tx.tripDay.create({
            data: {
              tripId,
              dayNumber: d.dayNumber,
              date: dateOfDay(trip.startDate, d.dayNumber),
              theme: d.theme?.trim() || null,
            },
          }))

        let order = existing ? existing.activities.length : 0
        for (const a of d.activities) {
          await tx.dayActivity.create({
            data: {
              tripDayId: day.id,
              title: a.title.trim(),
              type: (ACTIVITY_TYPES as readonly string[]).includes(a.type ?? '') ? a.type : null,
              place: a.place?.trim() || null,
              startTime: a.startTime ? new Date(a.startTime) : null,
              endTime: a.endTime ? new Date(a.endTime) : null,
              note: a.note?.trim() || null,
              order: order++,
            },
          })
        }
      }
    })

    return prisma.tripDay.findMany({
      where: { tripId },
      include: { activities: true },
      orderBy: { dayNumber: 'asc' },
    })
  },
}
