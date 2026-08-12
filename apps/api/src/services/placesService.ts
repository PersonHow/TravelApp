import { AppError } from '../utils/AppError'

// Google Places Text Search 端點
const PLACES_TEXT_SEARCH = 'https://maps.googleapis.com/maps/api/place/textsearch/json'

// Google Places 回傳的單筆結果（只挑用得到的欄位）
interface GooglePlaceResult {
  place_id: string
  name: string
  formatted_address?: string
  geometry?: { location?: { lat: number; lng: number } }
  types?: string[]
}

interface GooglePlacesResponse {
  results?: GooglePlaceResult[]
  status?: string
}

export const placesService = {
  // 以關鍵字搜尋景點，回傳精簡後的結果（對應 Attraction 欄位）
  async search(query: string) {
    const key = process.env.GOOGLE_PLACES_API_KEY
    if (!key) {
      // 尚未設定金鑰：回 503，前端可顯示「搜尋功能尚未啟用」
      throw new AppError(503, 'INTEGRATION_NOT_CONFIGURED', 'Google Places API 金鑰尚未設定')
    }

    // language=zh-TW:名稱與地址盡量回繁體中文(使用者都是台灣家庭)
    const url = `${PLACES_TEXT_SEARCH}?query=${encodeURIComponent(query)}&language=zh-TW&key=${key}`
    const resp = await fetch(url)
    if (!resp.ok) {
      throw new AppError(502, 'UPSTREAM_ERROR', 'Google Places 服務回應異常')
    }

    const json = (await resp.json()) as GooglePlacesResponse
    return (json.results ?? []).map((r) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.formatted_address ?? null,
      lat: r.geometry?.location?.lat ?? null,
      lng: r.geometry?.location?.lng ?? null,
      category: r.types?.[0] ?? null,
    }))
  },
}
