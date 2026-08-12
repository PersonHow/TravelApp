// API 請求／回應型別（前後端共用的合約）
import type { ActivityType, User } from './models'

// 統一回應格式：{ success: true, data } 或 { success: false, error }
export interface ApiSuccess<T> {
  success: true
  data: T
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody

// 認證端點回應（register / login / refresh 共用）
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// ─── 請求 payload ───
// 命名規則：Create 為必填欄位齊全；Update 全部可選（只更新有傳的欄位）

export interface CreateFamilyPayload {
  name: string
}

// 用 email 邀請成員加入家庭
export interface AddFamilyMemberPayload {
  email: string
}

export interface CreateTripPayload {
  title: string
  startDate: string
  endDate: string
  familyId: string
  destination?: string
}

export interface UpdateTripPayload {
  title?: string
  startDate?: string
  endDate?: string
  destination?: string | null
}

export interface CreateTripDayPayload {
  date: string
  dayNumber: number
  theme?: string
}

export interface UpdateTripDayPayload {
  date?: string
  dayNumber?: number
  theme?: string | null
}

export interface CreateDayActivityPayload {
  title: string
  startTime?: string
  endTime?: string
  note?: string
  order?: number
  type?: ActivityType
  place?: string
  hours?: string
  price?: number
  placeId?: string
  lat?: number
  lng?: number
}

export interface UpdateDayActivityPayload {
  title?: string
  startTime?: string | null
  endTime?: string | null
  note?: string | null
  order?: number
  type?: ActivityType | null
  place?: string | null
  hours?: string | null
  price?: number | null
  placeId?: string | null
  lat?: number | null
  lng?: number | null
  tripDayId?: string // 傳入可把活動搬到同行程的另一天
}

export interface CreateHotelPayload {
  name: string
  checkIn: string
  checkOut: string
  address?: string
  lat?: number
  lng?: number
  bookingRef?: string
}

export interface UpdateHotelPayload {
  name?: string
  checkIn?: string
  checkOut?: string
  address?: string | null
  lat?: number | null
  lng?: number | null
  bookingRef?: string | null
}

export interface CreateFlightPayload {
  flightNumber: string
  departureAirport: string
  arrivalAirport: string
  departureTime: string
  arrivalTime: string
  airline?: string
  aircraft?: string
  accessNote?: string
}

export interface UpdateFlightPayload {
  flightNumber?: string
  departureAirport?: string
  arrivalAirport?: string
  departureTime?: string
  arrivalTime?: string
  airline?: string | null
  aircraft?: string | null
  accessNote?: string | null
}

// GET /api/attractions/search 的單筆結果（來自 Google Places，未存 DB）
export interface AttractionSearchResult {
  placeId: string
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  category: string | null
}

// ─── AI 規劃行程（兩段式：生成草稿 → 確認套用）───

export type AiPlanPace = 'relaxed' | 'moderate' | 'packed'

export interface AiPlanPreferencesPayload {
  pace?: AiPlanPace
  interests?: string
  note?: string
}

// 草稿活動：時間為 "HH:MM" 顯示字串（套用時前端才轉 ISO）
export interface AiPlanDraftActivity {
  title: string
  type: ActivityType | null
  place: string | null
  startTime: string | null
  endTime: string | null
  note: string | null
}

export interface AiPlanDraftDay {
  dayNumber: number
  theme: string | null
  activities: AiPlanDraftActivity[]
}

export interface AiPlanDraft {
  days: AiPlanDraftDay[]
}

// 套用 payload：時間已轉 ISO（跟手動新增活動同一套語意）
export interface ApplyAiPlanActivity {
  title: string
  type?: ActivityType
  place?: string
  startTime?: string
  endTime?: string
  note?: string
}

export interface ApplyAiPlanDay {
  dayNumber: number
  theme?: string
  activities: ApplyAiPlanActivity[]
}

export interface ApplyAiPlanPayload {
  days: ApplyAiPlanDay[]
}

export interface CreatePackingItemPayload {
  name: string
}

export interface UpdatePackingItemPayload {
  name?: string
  checked?: boolean
}
