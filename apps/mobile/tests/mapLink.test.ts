import { googleMapsUrl } from '../utils/mapLink'

// Google Maps 深層連結：有座標用座標（可帶 place_id），沒座標退回文字搜尋

describe('googleMapsUrl', () => {
  it('有座標＋placeId：用座標定位並帶 query_place_id', () => {
    const url = googleMapsUrl({
      title: '淺草寺',
      place: '台東区浅草',
      lat: 35.7147651,
      lng: 139.7966553,
      placeId: 'ChIJ8T1GpMGOGGARDYGSgpooDWw',
    })
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=35.7147651,139.7966553&query_place_id=ChIJ8T1GpMGOGGARDYGSgpooDWw',
    )
  })

  it('有座標沒 placeId：只用座標', () => {
    const url = googleMapsUrl({ title: 'x', place: null, lat: 35.5, lng: 139.5, placeId: null })
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=35.5,139.5')
  })

  it('沒座標：用「名稱＋地點」文字搜尋', () => {
    const url = googleMapsUrl({
      title: '淺草寺',
      place: '台東区浅草',
      lat: null,
      lng: null,
      placeId: null,
    })
    expect(url).toBe(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('淺草寺 台東区浅草')}`,
    )
  })

  it('什麼都沒有：回 null（不顯示按鈕）', () => {
    expect(
      googleMapsUrl({ title: '', place: null, lat: null, lng: null, placeId: null }),
    ).toBeNull()
  })
})
