import { AppError } from '../utils/AppError'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

// Google Routes API：大眾運輸路線查詢（computeRoutes）
const ROUTES_API = 'https://routes.googleapis.com/directions/v2:computeRoutes'

// 只要求用得到的欄位（FieldMask 是必填，漏填會整包回傳並多計費）
const FIELD_MASK = [
  'routes.duration',
  'routes.legs.steps.travelMode',
  'routes.legs.steps.staticDuration',
  'routes.legs.steps.navigationInstruction.instructions',
  'routes.legs.steps.transitDetails',
].join(',')

// Routes API 回傳的巢狀結構（只列用得到的欄位）
interface RouteStep {
  travelMode?: string
  staticDuration?: string
  navigationInstruction?: { instructions?: string }
  transitDetails?: {
    stopDetails?: { departureStop?: { name?: string }; arrivalStop?: { name?: string } }
    headsign?: string
    stopCount?: number
    transitLine?: { name?: string; nameShort?: string }
  }
}

interface RoutesResponse {
  routes?: { duration?: string; legs?: { steps?: RouteStep[] }[] }[]
}

// 正規化後的結果（對應 shared-types 的 TransitRoute / TransitStep）
export interface TransitStep {
  mode: 'WALK' | 'TRANSIT'
  instruction: string
  durationMinutes: number
  headsign: string | null
  departureStop: string | null
  arrivalStop: string | null
  stopCount: number | null
}

export interface TransitRoute {
  durationMinutes: number
  steps: TransitStep[]
}

// 目的地：有座標用座標（精準），沒座標退回文字（名稱＋地址）
export type TransitDestination = { lat: number; lng: number } | { text: string }

// 每次查詢都計費：同出發地＋目的地短時間內重複查詢吃快取
const CACHE_TTL_MS = 10 * 60 * 1000
const cache = new Map<string, { at: number; route: TransitRoute | null }>()
const MAX_CACHE_ENTRIES = 200

// "3600s" → 分鐘（無條件進位，路線時間寧可高估）
function toMinutes(duration: string | undefined): number {
  const seconds = Number((duration ?? '').replace(/s$/, ''))
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds / 60) : 0
}

// mock 模式（金鑰填 "mock"）：回替身資料，開發期不打真實 API（同 aviationStack 慣例）
function mockRoute(): TransitRoute {
  return {
    durationMinutes: 52,
    steps: [
      {
        mode: 'WALK',
        instruction: '步行至 模擬機場站',
        durationMinutes: 5,
        headsign: null,
        departureStop: null,
        arrivalStop: null,
        stopCount: null,
      },
      {
        mode: 'TRANSIT',
        instruction: '模擬空港線',
        durationMinutes: 40,
        headsign: '往模擬車站',
        departureStop: '模擬機場站',
        arrivalStop: '模擬車站',
        stopCount: 8,
      },
      {
        mode: 'WALK',
        instruction: '步行至目的地',
        durationMinutes: 7,
        headsign: null,
        departureStop: null,
        arrivalStop: null,
        stopCount: null,
      },
    ],
  }
}

function normalizeStep(s: RouteStep): TransitStep | null {
  const minutes = toMinutes(s.staticDuration)
  if (s.travelMode === 'TRANSIT') {
    const t = s.transitDetails
    return {
      mode: 'TRANSIT',
      instruction: t?.transitLine?.nameShort ?? t?.transitLine?.name ?? '搭乘大眾運輸',
      durationMinutes: minutes,
      headsign: t?.headsign ?? null,
      departureStop: t?.stopDetails?.departureStop?.name ?? null,
      arrivalStop: t?.stopDetails?.arrivalStop?.name ?? null,
      stopCount: t?.stopCount ?? null,
    }
  }
  if (s.travelMode === 'WALK') {
    // 沒有指示文字的零碎步行（如月台內移動）不列出
    if (minutes === 0) return null
    return {
      mode: 'WALK',
      instruction: s.navigationInstruction?.instructions ?? '步行',
      durationMinutes: minutes,
      headsign: null,
      departureStop: null,
      arrivalStop: null,
      stopCount: null,
    }
  }
  return null
}

export const transitRouteService = {
  // 查大眾運輸路線；查無路線回 null（老實告知，不編造）
  async search(origin: string, destination: TransitDestination): Promise<TransitRoute | null> {
    const key = process.env.GOOGLE_ROUTES_API_KEY
    if (!key) {
      throw new AppError(503, 'INTEGRATION_NOT_CONFIGURED', 'Google Routes API 金鑰尚未設定')
    }
    if (key === 'mock') return mockRoute()

    const cacheKey = `${origin}|${JSON.stringify(destination)}`
    const hit = cache.get(cacheKey)
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.route

    const resp = await fetchWithTimeout(ROUTES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination:
          'lat' in destination
            ? { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } }
            : { address: destination.text },
        travelMode: 'TRANSIT',
        languageCode: 'zh-TW',
      }),
    })
    if (!resp.ok) {
      throw new AppError(502, 'UPSTREAM_ERROR', 'Google Routes 服務回應異常')
    }

    const json = (await resp.json()) as RoutesResponse
    const first = json.routes?.[0]
    const route: TransitRoute | null = first
      ? {
          durationMinutes: toMinutes(first.duration),
          steps: (first.legs ?? [])
            .flatMap((l) => l.steps ?? [])
            .map(normalizeStep)
            .filter((s): s is TransitStep => s !== null),
        }
      : null

    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!)
    cache.set(cacheKey, { at: Date.now(), route })
    return route
  },
}
