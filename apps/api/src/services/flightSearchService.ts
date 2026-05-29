import { AppError } from '../utils/AppError'

// AviationStack 即時航班端點
const AVIATION_API = 'https://api.aviationstack.com/v1/flights'

interface AviationStackResponse {
  data?: unknown[]
  error?: { code: string; message: string }
}

export const flightSearchService = {
  // 依航班號（IATA，如 BR189）查詢航班
  async search(params: { flightNumber?: string }) {
    const key = process.env.AVIATION_STACK_API_KEY
    if (!key) {
      throw new AppError(503, 'INTEGRATION_NOT_CONFIGURED', 'AviationStack API 金鑰尚未設定')
    }

    const qs = new URLSearchParams({ access_key: key })
    if (params.flightNumber) qs.set('flight_iata', params.flightNumber)

    const resp = await fetch(`${AVIATION_API}?${qs.toString()}`)
    if (!resp.ok) {
      throw new AppError(502, 'UPSTREAM_ERROR', 'AviationStack 服務回應異常')
    }

    const json = (await resp.json()) as AviationStackResponse
    return json.data ?? []
  },
}
