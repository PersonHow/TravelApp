// 旅程總覽 tab：Hero + Day rows + Flights + Hotels
// currentTrip 由 trip/[id]/_layout 保證載入完成；響應式：窄螢幕單欄、寬螢幕 3 欄
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Pencil, Sparkles } from 'lucide-react-native'
import { familyService } from '@/services/familyService'
import { useAuthStore } from '@/store/useAuthStore'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { HeroCard } from '@/components/trip/HeroCard'
import { DayRow } from '@/components/trip/DayRow'
import { FlightCard } from '@/components/trip/FlightCard'
import { HotelCard } from '@/components/trip/HotelCard'
import { AiPlanModal } from '@/components/trip/AiPlanModal'
import { TripFormModal } from '@/components/trip/TripFormModal'
import { DayDetailModal } from '@/components/trip/DayDetailModal'
import { ActivityFormModal } from '@/components/trip/ActivityFormModal'
import type { DayActivity } from '@/types/api'

// 活動彈窗狀態:新增或編輯（由 DAY 詳情彈窗開啟）
type ActivityModal = { mode: 'create' } | { mode: 'edit'; activity: DayActivity } | null

export default function TripOverviewScreen() {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const currentTrip = useTripStore((s) => s.currentTrip)
  const userId = useAuthStore((s) => s.user?.id)
  const [editing, setEditing] = useState(false)
  // DAY 詳情:記 id 不記物件,活動增刪改後跟著 currentTrip 更新
  const [dayId, setDayId] = useState<string | null>(null)
  const [activityModal, setActivityModal] = useState<ActivityModal>(null)
  // AI 幫我排:僅 OWNER/ADMIN 顯示按鈕(一般成員直接打 API 也會被後端 403 擋下)
  const [aiPlanOpen, setAiPlanOpen] = useState(false)
  const [canAiPlan, setCanAiPlan] = useState(false)
  const familyId = currentTrip?.familyId

  useEffect(() => {
    if (!familyId || !userId) return
    let mounted = true
    familyService
      .list()
      .then((families) => {
        const role = families
          .find((f) => f.id === familyId)
          ?.members.find((m) => m.userId === userId)?.role
        if (mounted) setCanAiPlan(role === 'OWNER' || role === 'ADMIN')
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [familyId, userId])

  if (!currentTrip) return null

  const selectedDay = currentTrip.tripDays.find((d) => d.id === dayId) ?? null

  const totalActivities = currentTrip.tripDays.reduce((sum, d) => sum + d.activities.length, 0)
  // 按出發時間排序:最早的是去程、最晚的是回程
  const sortedFlights = [...currentTrip.flights].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
  )
  const outbound = sortedFlights[0]
  const returning = sortedFlights.length > 1 ? sortedFlights[sortedFlights.length - 1] : undefined

  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 34 : 12,
          paddingBottom: 60,
          maxWidth: 1180,
          width: '100%',
          alignSelf: isDesktop ? 'flex-start' : 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-1.5">
          <HeroCard
            title={currentTrip.title}
            startDate={currentTrip.startDate}
            endDate={currentTrip.endDate}
            activityCount={totalActivities}
          />
        </View>

        {/* AI 幫我排（限 OWNER/ADMIN）＋ 編輯行程資訊（改名／改日期／刪除） */}
        <View className="flex-row items-center gap-2 self-end mt-2">
          {canAiPlan && (
            <Pressable
              onPress={() => setAiPlanOpen(true)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent dark:bg-dark-accent active:opacity-80"
            >
              <Sparkles size={12} color="#fff" />
              <Text className="text-white text-[12px] font-bold">AI 幫我排</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => setEditing(true)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
          >
            <Pencil size={12} color="#8c89a8" />
            <Text className="text-muted dark:text-dark-muted text-[12px] font-bold">
              編輯行程資訊
            </Text>
          </Pressable>
        </View>

        {/* DAY 列表:寬螢幕 3 欄,窄螢幕單欄 */}
        <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mt-4 mb-1 px-0.5">
          DAY 規劃
        </Text>
        <View className={isDesktop ? 'flex-row flex-wrap gap-3' : ''}>
          {currentTrip.tripDays.map((d) => (
            <View key={d.id} style={isDesktop ? { flexBasis: '32%', flexGrow: 1 } : undefined}>
              <DayRow
                dayNumber={d.dayNumber}
                date={d.date}
                activityCount={d.activities.length}
                theme={d.theme ?? undefined}
                onPress={() => setDayId(d.id)}
              />
            </View>
          ))}
        </View>

        {/* 航班 */}
        {(outbound || returning) && (
          <>
            <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mt-6 mb-2 px-0.5">
              航班
            </Text>
            <View className={isDesktop ? 'flex-row gap-2.5' : 'gap-2.5'}>
              {outbound && (
                <View className={isDesktop ? 'flex-1' : ''}>
                  <FlightCard
                    flight={outbound}
                    onPress={() =>
                      router.push({
                        pathname: '/trip/[id]/flight/[flightId]',
                        params: { id: currentTrip.id, flightId: outbound.id },
                      })
                    }
                  />
                </View>
              )}
              {returning && (
                <View className={isDesktop ? 'flex-1' : ''}>
                  <FlightCard
                    flight={returning}
                    isReturn
                    onPress={() =>
                      router.push({
                        pathname: '/trip/[id]/flight/[flightId]',
                        params: { id: currentTrip.id, flightId: returning.id },
                      })
                    }
                  />
                </View>
              )}
            </View>
          </>
        )}

        {/* 住宿 */}
        {currentTrip.hotels.length > 0 && (
          <>
            <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mt-6 mb-2 px-0.5">
              住宿
            </Text>
            {currentTrip.hotels.map((h) => (
              <View key={h.id} className="mb-2.5">
                <HotelCard hotel={h} />
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <TripFormModal
        visible={editing}
        onClose={() => setEditing(false)}
        trip={currentTrip}
        onDeleted={() => router.replace('/trips')}
      />

      <AiPlanModal visible={aiPlanOpen} onClose={() => setAiPlanOpen(false)} trip={currentTrip} />

      {/* DAY 詳情;開活動表單時先隱藏,關表單後自動回到清單 */}
      <DayDetailModal
        visible={selectedDay !== null && activityModal === null}
        onClose={() => setDayId(null)}
        day={selectedDay}
        currencySymbol={currentTrip.symbol}
        onPressActivity={(a) => setActivityModal({ mode: 'edit', activity: a })}
        onAdd={() => setActivityModal({ mode: 'create' })}
      />
      <ActivityFormModal
        visible={activityModal !== null}
        onClose={() => setActivityModal(null)}
        trip={currentTrip}
        activity={activityModal?.mode === 'edit' ? activityModal.activity : null}
        initialDayId={dayId ?? undefined}
      />
    </View>
  )
}
