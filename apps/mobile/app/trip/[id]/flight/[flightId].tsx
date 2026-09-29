// 航班詳細頁：路線資訊、前往機場方式、行李清單
// 從總覽 tab / 交通住宿 tab 點航班卡進入（在 Tabs 註冊 href: null，不出現在 tab bar）
import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Pencil, Plane } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { FlightDetail } from '@/components/trip/FlightDetail'
import { FlightFormModal } from '@/components/trip/FlightFormModal'

export default function FlightDetailScreen() {
  const { flightId } = useLocalSearchParams<{ flightId: string }>()
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const currentTrip = useTripStore((s) => s.currentTrip)
  const [editing, setEditing] = useState(false)

  if (!currentTrip) return null
  const flight = currentTrip.flights.find((f) => f.id === flightId)

  // 依出發時間判斷去程/回程（與總覽、交通住宿頁同一套規則）
  const sorted = [...currentTrip.flights].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
  )
  const isReturn = flight ? sorted.indexOf(flight) > 0 : false

  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 30 : 12,
          paddingBottom: 60,
          maxWidth: 760,
          width: '100%',
          alignSelf: isDesktop ? 'flex-start' : 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 返回 + 標題 + 編輯 */}
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace({
                    pathname: '/trip/[id]/transport',
                    params: { id: currentTrip.id },
                  })
            }
            className="p-1.5 rounded-full active:opacity-60"
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#8c89a8" />
          </Pressable>
          <Text className="text-ink dark:text-dark-ink text-[20px] font-black tracking-tight flex-1">
            航班詳細
          </Text>
          {flight && (
            <Pressable
              onPress={() => setEditing(true)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
            >
              <Pencil size={12} color="#8c89a8" />
              <Text className="text-muted dark:text-dark-muted text-[12px] font-bold">編輯</Text>
            </Pressable>
          )}
        </View>

        {!flight ? (
          <View className="items-center mt-16">
            <Plane size={42} color="#a0c4ff" />
            <Text className="text-muted dark:text-dark-muted text-sm mt-4">
              找不到此航班（可能已被刪除）
            </Text>
          </View>
        ) : (
          <View className="mt-4">
            <FlightDetail
              flight={flight}
              isReturn={isReturn}
              tripId={currentTrip.id}
              packingItems={currentTrip.packingItems}
              onEdit={() => setEditing(true)}
            />
          </View>
        )}
      </ScrollView>

      {flight && (
        <FlightFormModal
          visible={editing}
          onClose={() => setEditing(false)}
          tripId={currentTrip.id}
          flight={flight}
        />
      )}
    </View>
  )
}
