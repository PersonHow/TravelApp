import { prisma } from '../prisma/client'
import { AppError } from '../utils/AppError'
import { aiService, loadPrompt } from './aiService'
import { tripService } from './tripService'

// 旅遊短句商業邏輯（AI 生成後存 DB，全家讀 DB 不重複計費）

const CATEGORIES = ['greeting', 'dining', 'transport', 'shopping', 'emergency'] as const

// AI 輸出的單句形狀（存 DB 前的中間格式）
interface GeneratedPhrase {
  category: string
  text: string
  reading: string
  meaning: string
}

// 強制模型輸出的 JSON Schema（structured output）
const PHRASES_SCHEMA = {
  type: 'object',
  properties: {
    phrases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: [...CATEGORIES] },
          text: { type: 'string' },
          reading: { type: 'string' },
          meaning: { type: 'string' },
        },
        required: ['category', 'text', 'reading', 'meaning'],
        additionalProperties: false,
      },
    },
  },
  required: ['phrases'],
  additionalProperties: false,
}

// ANTHROPIC_API_KEY=mock 時的替身資料（開發期跑通「生成→存 DB→前端顯示」全流程用）
const MOCK_PHRASES: GeneratedPhrase[] = [
  { category: 'greeting', text: 'こんにちは', reading: 'konnichiwa', meaning: '你好' },
  {
    category: 'greeting',
    text: 'ありがとうございます',
    reading: 'arigatou gozaimasu',
    meaning: '謝謝',
  },
  {
    category: 'dining',
    text: 'おすすめは何ですか',
    reading: 'osusume wa nan desu ka',
    meaning: '有什麼推薦的嗎？',
  },
  {
    category: 'dining',
    text: 'お会計お願いします',
    reading: 'okaikei onegaishimasu',
    meaning: '麻煩結帳',
  },
  {
    category: 'transport',
    text: '駅はどこですか',
    reading: 'eki wa doko desu ka',
    meaning: '車站在哪裡？',
  },
  { category: 'shopping', text: 'いくらですか', reading: 'ikura desu ka', meaning: '多少錢？' },
  {
    category: 'emergency',
    text: '助けてください',
    reading: 'tasukete kudasai',
    meaning: '請幫幫我',
  },
]

// 依分類＋順序取出（前端分類顯示）
function findByTrip(tripId: string) {
  return prisma.phrase.findMany({
    where: { tripId },
    orderBy: { order: 'asc' },
  })
}

export const phraseService = {
  // 取得行程的所有短句（未生成過則為空陣列）
  async list(tripId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    return findByTrip(tripId)
  },

  // 生成短句：呼叫 AI → 清掉舊的 → 寫入新的（重生成不累積）
  async generate(tripId: string, userId: string) {
    await tripService.assertAccess(tripId, userId)
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { destination: true },
    })
    if (!trip?.destination) {
      throw AppError.badRequest('請先在行程資訊填寫目的地，AI 才知道要生成哪種語言')
    }

    const result = await aiService.generateJson<{ phrases: GeneratedPhrase[] }>({
      system: loadPrompt('generatePhrases'),
      user: `目的地：${trip.destination}`,
      schema: PHRASES_SCHEMA,
      mock: { phrases: MOCK_PHRASES },
    })

    // AI 輸出是外部邊界：只收合法分類且必填欄位齊全的句子
    const valid = result.phrases.filter(
      (p) => (CATEGORIES as readonly string[]).includes(p.category) && p.text && p.meaning,
    )
    if (valid.length === 0) {
      throw new AppError(502, 'UPSTREAM_ERROR', 'AI 未產生有效短句，請稍後再試')
    }

    await prisma.$transaction([
      prisma.phrase.deleteMany({ where: { tripId } }),
      prisma.phrase.createMany({
        data: valid.map((p, i) => ({
          tripId,
          category: p.category,
          text: p.text,
          reading: p.reading || null,
          meaning: p.meaning,
          order: i,
        })),
      }),
    ])
    return findByTrip(tripId)
  },
}
