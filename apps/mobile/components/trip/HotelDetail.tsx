// 飯店詳細內容：飯店卡＋訂房編號＋地圖/導航連結＋如何抵達筆記＋大眾運輸路線查詢
// 桌面交通住宿右側面板與手機的飯店詳情彈窗共用
import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native'
import { Footprints, MapPin, Navigation, Search, Ticket, TrainFront } from 'lucide-react-native'
import { HotelCard } from '@/components/trip/HotelCard'
import { ApiError } from '@/services/api'
import { tripService } from '@/services/tripService'
import { googleMapsDirectionsUrl, googleMapsUrl } from '@/utils/mapLink'
import type { Hotel, TransitRoute } from '@/types/api'

interface HotelDetailProps {
  hotel: Hotel
  tripId: string
  // 路線查詢的預設出發地（如去程航班的抵達機場），可留空
  defaultOrigin?: string
  // 「還沒寫怎麼抵達」提示點下去開編輯表單
  onEdit: () => void
}

export function HotelDetail({ hotel, tripId, defaultOrigin, onEdit }: HotelDetailProps) {
  const [origin, setOrigin] = useState(defaultOrigin ?? '')
  const [searching, setSearching] = useState(false)
  // undefined＝還沒查過；null＝查了但沒有路線
  const [route, setRoute] = useState<TransitRoute | null | undefined>(undefined)
  const [routeError, setRouteError] = useState<string | null>(null)

  // 切換選中的飯店時重置查詢狀態
  useEffect(() => {
    setOrigin(defaultOrigin ?? '')
    setRoute(undefined)
    setRouteError(null)
  }, [hotel.id, defaultOrigin])

  const target = {
    title: hotel.name,
    place: hotel.address,
    lat: hotel.lat,
    lng: hotel.lng,
    placeId: null,
  }
  const mapUrl = googleMapsUrl(target)
  const directionsUrl = googleMapsDirectionsUrl(target)

  async function handleSearchRoute() {
    const from = origin.trim()
    if (!from || searching) return
    setSearching(true)
    setRouteError(null)
    try {
      setRoute(await tripService.getHotelTransitRoute(tripId, hotel.id, from))
    } catch (e) {
      setRoute(undefined)
      setRouteError(e instanceof ApiError ? e.message : '查詢失敗，請稍後再試')
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <HotelCard hotel={hotel} />

      {hotel.bookingRef && (
        <View className="flex-row items-center gap-2 mt-3 px-1">
          <Ticket size={13} color="#8c89a8" />
          <Text className="text-muted dark:text-dark-muted text-[12.5px]">
            訂房編號 {hotel.bookingRef}
          </Text>
        </View>
      )}

      {/* 地圖與導航（免金鑰 deep link） */}
      {(mapUrl || directionsUrl) && (
        <View className="flex-row flex-wrap items-center gap-2 mt-3">
          {mapUrl && (
            <Pressable
              onPress={() => Linking.openURL(mapUrl)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
            >
              <MapPin size={12} color="#6c7bd6" />
              <Text className="text-accent dark:text-dark-accent text-[12px] font-bold">
                在 Google 地圖開啟
              </Text>
            </Pressable>
          )}
          {directionsUrl && (
            <Pressable
              onPress={() => Linking.openURL(directionsUrl)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
            >
              <Navigation size={12} color="#6c7bd6" />
              <Text className="text-accent dark:text-dark-accent text-[12px] font-bold">
                導航到這裡
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* 如何抵達（自由筆記，同航班「前往機場」慣例） */}
      <View className="flex-row items-center gap-1.5 mt-6 mb-2 px-0.5">
        <Navigation size={14} color="#6c7bd6" />
        <Text className="text-ink dark:text-dark-ink text-[15px] font-extrabold">如何抵達</Text>
      </View>
      {hotel.accessNote ? (
        <View className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] p-4">
          <Text className="text-ink dark:text-dark-ink text-[14px] leading-[22px]">
            {hotel.accessNote}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={onEdit}
          className="items-center py-5 border-[1.5px] border-dashed border-line dark:border-dark-line rounded-[14px] active:opacity-70"
        >
          <Text className="text-muted dark:text-dark-muted text-[13px]">
            還沒寫怎麼抵達飯店，點這裡到「編輯」補上
          </Text>
        </Pressable>
      )}

      {/* 大眾運輸路線查詢（Google Routes API，按鈕觸發才查） */}
      <View className="flex-row items-center gap-1.5 mt-6 mb-2 px-0.5">
        <TrainFront size={14} color="#6c7bd6" />
        <Text className="text-ink dark:text-dark-ink text-[15px] font-extrabold">大眾運輸路線</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <TextInput
          value={origin}
          onChangeText={setOrigin}
          onSubmitEditing={handleSearchRoute}
          placeholder="出發地，例如：關西國際機場"
          placeholderTextColor="#8c89a8"
          className="flex-1 bg-surface-2 dark:bg-dark-surface-2 border border-line dark:border-dark-line rounded-[11px] px-3.5 py-3 text-ink dark:text-dark-ink text-[14px]"
        />
        <Pressable
          onPress={handleSearchRoute}
          disabled={searching || !origin.trim()}
          className="p-3 rounded-[11px] bg-accent dark:bg-dark-accent active:opacity-80 disabled:opacity-40"
        >
          {searching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Search size={16} color="#fff" />
          )}
        </Pressable>
      </View>
      {routeError && <Text className="text-[#e05b6d] text-[12.5px] mt-2">{routeError}</Text>}
      {route === null && (
        <Text className="text-muted dark:text-dark-muted text-[12.5px] mt-2">
          查不到大眾運輸路線，改用「導航到這裡」在 Google 地圖看看
        </Text>
      )}
      {route && (
        <View className="mt-2.5 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] p-4">
          <Text className="text-ink dark:text-dark-ink text-[13.5px] font-extrabold mb-2.5">
            全程約 {route.durationMinutes} 分鐘
          </Text>
          {route.steps.map((s, i) => (
            <View
              key={i}
              className={`flex-row gap-2.5 ${i > 0 ? 'mt-2.5 pt-2.5 border-t border-line dark:border-dark-line' : ''}`}
            >
              {s.mode === 'WALK' ? (
                <Footprints size={15} color="#8c89a8" style={{ marginTop: 1 }} />
              ) : (
                <TrainFront size={15} color="#6c7bd6" style={{ marginTop: 1 }} />
              )}
              <View className="flex-1">
                <Text className="text-ink dark:text-dark-ink text-[13px] font-bold">
                  {s.instruction}
                  {s.headsign ? `（往${s.headsign}）` : ''}
                </Text>
                {s.mode === 'TRANSIT' && s.departureStop && s.arrivalStop && (
                  <Text className="text-muted dark:text-dark-muted text-[11.5px] mt-0.5">
                    {s.departureStop} → {s.arrivalStop}
                    {s.stopCount != null ? ` · ${s.stopCount} 站` : ''}
                  </Text>
                )}
              </View>
              <Text className="text-muted dark:text-dark-muted text-[11.5px]">
                {s.durationMinutes} 分
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  )
}
