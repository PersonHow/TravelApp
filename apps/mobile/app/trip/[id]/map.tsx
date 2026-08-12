// 地圖 tab：所有帶座標的活動 pin（依 DAY 上色），點 pin 標題可跳 Google 地圖
// Web 版內嵌地圖尚未支援 → 降級成清單（每筆附「開啟地圖」連結）
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { MapCanvas } from '@/components/map/MapCanvas'
import { googleMapsUrl } from '@/utils/mapLink'
import type { DayActivity } from '@/types/api'

// DAY 1、2、3… 的 pin 顏色（輪用）
const DAY_COLORS = [
  '#e63946',
  '#f4a261',
  '#2a9d8f',
  '#457b9d',
  '#8338ec',
  '#ff006e',
  '#3a86ff',
  '#fb5607',
]

interface MapItem {
  activity: DayActivity
  dayNumber: number
  lat: number
  lng: number
  color: string
}

export default function TripMapScreen() {
  const isDesktop = useIsDesktop()
  // currentTrip 由 trip/[id]/_layout 保證載入完成
  const currentTrip = useTripStore((s) => s.currentTrip)
  if (!currentTrip) return null

  // 撈出所有帶座標的活動，依 DAY 上色
  const items: MapItem[] = currentTrip.tripDays.flatMap((d) =>
    d.activities
      .filter((a) => a.lat != null && a.lng != null)
      .map((a) => ({
        activity: a,
        dayNumber: d.dayNumber,
        lat: a.lat!,
        lng: a.lng!,
        color: DAY_COLORS[(d.dayNumber - 1) % DAY_COLORS.length],
      })),
  )
  const daysWithPins = [...new Set(items.map((i) => i.dayNumber))].sort((a, b) => a - b)

  function openInGoogleMaps(item: MapItem) {
    const url = googleMapsUrl({
      title: item.activity.title,
      place: item.activity.place,
      lat: item.lat,
      lng: item.lng,
      placeId: item.activity.placeId,
    })
    if (url) Linking.openURL(url)
  }

  // 空狀態：還沒有帶座標的活動
  if (items.length === 0) {
    return (
      <View className="flex-1 bg-bg dark:bg-dark-bg items-center justify-center px-8">
        <MapPin size={44} color="#a0c4ff" />
        <Text className="text-ink dark:text-dark-ink text-[15px] font-bold mt-4">還沒有地圖點</Text>
        <Text className="text-muted dark:text-dark-muted text-[13px] mt-1.5 text-center">
          在活動表單用「搜尋景點」帶入，或用「地圖選點」指定位置後，就會出現在這裡
        </Text>
      </View>
    )
  }

  // Web：降級成清單
  if (Platform.OS === 'web') {
    return (
      <View className="flex-1 bg-bg dark:bg-dark-bg">
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: isDesktop ? 40 : 16,
            paddingTop: isDesktop ? 34 : 10,
            paddingBottom: 40,
            maxWidth: 760,
            width: '100%',
            alignSelf: isDesktop ? 'flex-start' : 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
            地圖
          </Text>
          <Text className="text-muted dark:text-dark-muted text-[13px] mt-1 mb-5">
            網頁版內嵌地圖尚未支援，點任一筆在 Google 地圖開啟
          </Text>
          <View className="gap-2">
            {items.map((item) => (
              <Pressable
                key={item.activity.id}
                onPress={() => openInGoogleMaps(item)}
                className="flex-row items-center gap-3 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[14px] px-4 py-3 active:opacity-70"
              >
                <View
                  className="w-[10px] h-[10px] rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <View className="flex-1">
                  <Text className="text-ink dark:text-dark-ink text-[14px] font-bold">
                    {item.activity.title}
                  </Text>
                  <Text className="text-muted dark:text-dark-muted text-[11.5px] mt-0.5">
                    DAY {item.dayNumber}
                    {item.activity.place ? `  ·  ${item.activity.place}` : ''}
                  </Text>
                </View>
                <MapPin size={14} color="#6c7bd6" />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    )
  }

  // 原生：內嵌地圖 + DAY 圖例
  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
      {/* DAY 圖例 */}
      <View className="flex-row flex-wrap gap-x-3 gap-y-1 px-4 py-2.5">
        {daysWithPins.map((n) => (
          <View key={n} className="flex-row items-center gap-1.5">
            <View
              className="w-[9px] h-[9px] rounded-full"
              style={{ backgroundColor: DAY_COLORS[(n - 1) % DAY_COLORS.length] }}
            />
            <Text className="text-muted dark:text-dark-muted text-[11.5px] font-bold">DAY {n}</Text>
          </View>
        ))}
      </View>
      <MapCanvas
        style={{ flex: 1 }}
        center={{ lat: items[0].lat, lng: items[0].lng }}
        zoomDelta={0.12}
        pins={items.map((i) => ({
          id: i.activity.id,
          lat: i.lat,
          lng: i.lng,
          title: i.activity.title,
          color: i.color,
        }))}
        // 點 pin 的標題泡泡 → 跳 Google 地圖看詳細
        onPressPin={(id) => {
          const item = items.find((i) => i.activity.id === id)
          if (item) openInGoogleMaps(item)
        }}
      />
    </View>
  )
}
