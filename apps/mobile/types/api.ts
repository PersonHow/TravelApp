// 與後端對齊的 API 型別（之後可改用 packages/shared-types 統一）

export interface User {
  id: string
  email: string
  name: string
}

// 後端目前回傳形狀：扁平在 data 底下（user + accessToken + refreshToken）
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

// 活動類別:對應設計檔卡片上的彩色徽章
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
  // 設計檔顯示用
  type: ActivityType | null
  place: string | null
  hours: string | null
  price: number | null
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
}

export interface Hotel {
  id: string
  tripId: string
  name: string
  address: string | null
  checkIn: string
  checkOut: string
  bookingRef: string | null
}

export interface TripSummary {
  id: string
  title: string
  startDate: string
  endDate: string
  familyId: string
  currency: string | null
  symbol: string | null
  fx: number | null
}

export interface TripDetail extends TripSummary {
  tripDays: TripDay[]
  flights: Flight[]
  hotels: Hotel[]
  tripAttractions: unknown[]
}

// 統一回應格式
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
