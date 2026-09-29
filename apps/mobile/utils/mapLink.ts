// 產生 Google Maps 深層連結（免金鑰）：手機會開 Google Maps App、網頁開新分頁
// 有座標用座標定位（加 place_id 可顯示店家卡片），沒座標退回「名稱＋地點」文字搜尋

interface MapTarget {
  title: string
  place: string | null
  lat: number | null
  lng: number | null
  placeId: string | null
}

// 產生 Google Maps「導航」深層連結（免金鑰）：大眾運輸模式規劃到目標的路線
export function googleMapsDirectionsUrl(target: MapTarget): string | null {
  const destination =
    target.lat != null && target.lng != null
      ? `${target.lat},${target.lng}`
      : [target.title, target.place].filter(Boolean).join(' ').trim()
  if (!destination) return null
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=transit`
}

export function googleMapsUrl(target: MapTarget): string | null {
  if (target.lat != null && target.lng != null) {
    const base = `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`
    return target.placeId ? `${base}&query_place_id=${encodeURIComponent(target.placeId)}` : base
  }
  const query = [target.title, target.place].filter(Boolean).join(' ').trim()
  if (!query) return null
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
