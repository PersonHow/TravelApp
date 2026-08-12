// 航班詳細頁：路線資訊、前往機場方式、行李清單
// 從總覽 tab / 交通住宿 tab 點航班卡進入（在 Tabs 註冊 href: null，不出現在 tab bar）
import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Luggage, Navigation, Pencil, Plane } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { FlightCard } from '@/components/trip/FlightCard'
import { FlightFormModal } from '@/components/trip/FlightFormModal'
import { PackingList } from '@/components/trip/PackingList'

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
          <>
            {/* 航班卡（含機場全名） */}
            <View className="mt-4">
              <FlightCard flight={flight} isReturn={isReturn} />
            </View>

            {/* 機型 */}
            {flight.aircraft && (
              <View className="flex-row items-center gap-2 mt-3 px-1">
                <Plane size={13} color="#8c89a8" />
                <Text className="text-muted dark:text-dark-muted text-[12.5px]">
                  機型 {flight.aircraft}
                </Text>
              </View>
            )}

            {/* 前往機場方式 */}
            <View className="flex-row items-center gap-1.5 mt-6 mb-2 px-0.5">
              <Navigation size={14} color="#6c7bd6" />
              <Text className="text-ink dark:text-dark-ink text-[15px] font-extrabold">
                前往機場
              </Text>
            </View>
            {flight.accessNote ? (
              <View className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] p-4">
                <Text className="text-ink dark:text-dark-ink text-[14px] leading-[22px]">
                  {flight.accessNote}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setEditing(true)}
                className="items-center py-5 border-[1.5px] border-dashed border-line dark:border-dark-line rounded-[14px] active:opacity-70"
              >
                <Text className="text-muted dark:text-dark-muted text-[13px]">
                  還沒寫怎麼去機場，點這裡到「編輯」補上
                </Text>
              </Pressable>
            )}

            {/* 行李清單 */}
            <View className="flex-row items-center gap-1.5 mt-6 mb-2 px-0.5">
              <Luggage size={14} color="#6c7bd6" />
              <Text className="text-ink dark:text-dark-ink text-[15px] font-extrabold">
                行李清單
              </Text>
              <Text className="text-muted dark:text-dark-muted text-[11px]">（整趟旅程共用）</Text>
            </View>
            <PackingList tripId={currentTrip.id} items={currentTrip.packingItems} />
          </>
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
