// 資料模型（wire format）：API 經 JSON 序列化後的形狀，日期一律為 ISO 字串
// 後端 Prisma 回傳的 Date 經 res.json() 後就是這個格式，前端直接以此為準

export interface User {
  id: string
  email: string
  name: string
}

export interface Family {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export type FamilyRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface FamilyMember {
  id: string
  userId: string
  familyId: string
  role: FamilyRole
  joinedAt: string
}

// 帶使用者資訊的成員（家庭管理 UI 顯示名字/email 用）
export interface FamilyMemberWithUser extends FamilyMember {
  user: User
}

// GET/POST /api/families 回傳（後端 include members + user）
export interface FamilyWithMembers extends Family {
  members: FamilyMemberWithUser[]
}

// 活動類別：對應設計檔卡片上的彩色徽章
export type ActivityType = 'spot' | 'food' | 'shop' | 'move'

export interface DayActivity {
  id: string
  tripDayId: string
  title: string
  startTime: string | null
  endTime: string | null
  attractionId: string | null
  note: string | null
  order: number
  type: ActivityType | null
  place: string | null
  hours: string | null
  price: number | null
  // 精確位置（景點搜尋帶入時一併存，給「開啟地圖」與內嵌地圖 pin 用）
  placeId: string | null
  lat: number | null
  lng: number | null
}

export interface TripDay {
  id: string
  tripId: string
  date: string
  dayNumber: number
  theme: string | null
  activities: DayActivity[]
}

export interface Flight {
  id: string
  tripId: string
  flightNumber: string
  airline: string | null
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  aircraft: string | null
  accessNote: string | null
}

// 行李清單項目（跟著 Trip，航班詳細頁顯示與勾選）
export interface PackingItem {
  id: string
  tripId: string
  name: string
  checked: boolean
}

export interface Hotel {
  id: string
  tripId: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  checkIn: string
  checkOut: string
  bookingRef: string | null
  // 房型與間數（自由文字，如「雙床房 ×2」）
  roomInfo: string | null
  // 房號（入住後填，如「1204、1206」）
  roomNumber: string | null
  // 如何抵達飯店（自由文字，同 Flight.accessNote 慣例）
  accessNote: string | null
}

export interface Attraction {
  id: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  placeId: string | null
  category: string | null
}

export interface TripAttraction {
  id: string
  tripId: string
  attractionId: string
  order: number
  note: string | null
  attraction: Attraction
}

// 旅遊短句分類（固定五種，後端 prompt 與前端顯示共用）
export type PhraseCategory = 'greeting' | 'dining' | 'transport' | 'shopping' | 'emergency'

// 旅遊短句（AI 生成，跟著 Trip）
export interface Phrase {
  id: string
  tripId: string
  category: PhraseCategory
  text: string
  reading: string | null
  meaning: string
  order: number
}

// 記帳分類（前端 ChipSelect 與後端驗證共用）
export type ExpenseCategory = 'food' | 'transport' | 'ticket' | 'shopping' | 'lodging' | 'other'

// 記帳（跟著 Trip；金額單位為 Trip.currency）
export interface Expense {
  id: string
  tripId: string
  title: string
  amount: number
  category: ExpenseCategory
  date: string
  payerId: string | null
  note: string | null
  // 誰付的（帶基本資料給列表顯示；成員被刪除時為 null）
  payer: User | null
}

export interface TripSummary {
  id: string
  title: string
  startDate: string
  endDate: string
  familyId: string
  destination: string | null
  currency: string | null
  symbol: string | null
  fx: number | null
}

export interface TripDetail extends TripSummary {
  tripDays: TripDay[]
  flights: Flight[]
  hotels: Hotel[]
  tripAttractions: TripAttraction[]
  packingItems: PackingItem[]
  expenses: Expense[]
}
