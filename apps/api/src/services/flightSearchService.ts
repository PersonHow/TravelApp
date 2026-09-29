import { AppError } from '../utils/AppError'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

// AviationStack 即時航班端點
const AVIATION_API = 'https://api.aviationstack.com/v1/flights'

// AviationStack 回傳的單筆航班（只列用得到的欄位）
interface AviationFlight {
  flight?: { iata?: string | null }
  airline?: { name?: string | null }
  departure?: { iata?: string | null; airport?: string | null; scheduled?: string | null }
  arrival?: { iata?: string | null; airport?: string | null; scheduled?: string | null }
  aircraft?: { iata?: string | null } | null
  flight_status?: string | null
}

interface AviationStackResponse {
  data?: AviationFlight[]
  error?: { code: string; message: string }
}

// 正規化後的搜尋結果（對應 shared-types 的 FlightSearchResult）
export interface FlightSearchResult {
  flightNumber: string
  airline: string | null
  departureAirport: string | null
  arrivalAirport: string | null
  departureTime: string | null // ISO；免費方案只有表定時間
  arrivalTime: string | null
  aircraft: string | null
  status: string | null // scheduled / active / landed / cancelled...
}

// 免費額度僅 100 次／月：同航班短時間內重複查詢吃快取，不重打 API
const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; results: FlightSearchResult[] }>()
const MAX_CACHE_ENTRIES = 200

// mock 模式（金鑰填 "mock"）：回替身資料，開發期不打真實 API（同 aiService 慣例）
function mockResults(flightNumber: string): FlightSearchResult[] {
  return [
    {
      flightNumber,
      airline: '模擬航空',
      departureAirport: 'TPE',
      arrivalAirport: 'NRT',
      departureTime: '2026-10-10T00:50:00.000Z',
      arrivalTime: '2026-10-10T04:20:00.000Z',
      aircraft: 'A350-900',
      status: 'scheduled',
    },
  ]
}

function normalize(f: AviationFlight): FlightSearchResult {
  return {
    flightNumber: f.flight?.iata ?? '',
    airline: f.airline?.name ?? null,
    departureAirport: f.departure?.iata ?? null,
    arrivalAirport: f.arrival?.iata ?? null,
    departureTime: f.departure?.scheduled ?? null,
    arrivalTime: f.arrival?.scheduled ?? null,
    aircraft: f.aircraft?.iata ?? null,
    status: f.flight_status ?? null,
  }
}

export const flightSearchService = {
  // 依航班號（IATA，如 BR189）查詢航班
  async search(params: { flightNumber: string }): Promise<FlightSearchResult[]> {
    const key = process.env.AVIATION_STACK_API_KEY
    if (!key) {
      throw new AppError(503, 'INTEGRATION_NOT_CONFIGURED', 'AviationStack API 金鑰尚未設定')
    }

    const flightNumber = params.flightNumber.replace(/\s+/g, '').toUpperCase()
    if (key === 'mock') return mockResults(flightNumber)

    const hit = cache.get(flightNumber)
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.results

    const qs = new URLSearchParams({ access_key: key, flight_iata: flightNumber })
    const resp = await fetchWithTimeout(`${AVIATION_API}?${qs.toString()}`)
    if (!resp.ok) {
      throw new AppError(502, 'UPSTREAM_ERROR', 'AviationStack 服務回應異常')
    }

    const json = (await resp.json()) as AviationStackResponse
    if (json.error) {
      throw new AppError(502, 'UPSTREAM_ERROR', 'AviationStack 服務回應異常')
    }

    // 過濾掉沒有航班號的雜訊資料
    const results = (json.data ?? []).map(normalize).filter((r) => r.flightNumber)
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!)
    cache.set(flightNumber, { at: Date.now(), results })
    return results
  },
}
