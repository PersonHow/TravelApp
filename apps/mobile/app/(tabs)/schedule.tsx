// 行程 tab:kanban 看板(每天一欄,卡片是活動)
// 對應設計檔網頁版.html 的「行程」頁
import { useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Calendar, Plus } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { ActivityCard } from '@/components/trip/ActivityCard'
import { formatDate } from '@/utils/format'
import type { TripDay } from '@/types/api'

export default function ScheduleScreen() {
  const isDesktop = useIsDesktop()
  const { currentTrip, loading, loadTrips } = useTripStore()

  useEffect(() => {
    if (!currentTrip) loadTrips()
  }, [currentTrip, loadTrips])

  if (loading && !currentTrip) {
    return (
      <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg items-center justify-center" edges={isDesktop ? [] : ['top']}>
        <ActivityIndicator color="#6c7bd6" />
      </SafeAreaView>
    )
  }

  if (!currentTrip) {
    return (
      <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg items-center justify-center px-6" edges={isDesktop ? [] : ['top']}>
        <Calendar size={42} color="#bdb2ff" />
        <Text className="text-ink dark:text-dark-ink text-base font-bold mt-4">尚未選擇行程</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg" edges={isDesktop ? [] : ['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 34 : 10,
          paddingBottom: 40,
          maxWidth: 1180,
          width: '100%',
          alignSelf: isDesktop ? 'flex-start' : 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 標題 */}
        <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
          行程
        </Text>
        <Text className="text-muted dark:text-dark-muted text-[13px] mt-1">
          每天一欄  ·  點任一景點看細節或編輯
        </Text>

        {/* Kanban 看板:橫向滾動,每天一欄 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingVertical: 24, paddingRight: 16 }}
        >
          {currentTrip.tripDays.map((day) => (
            <DayColumn
              key={day.id}
              day={day}
              currencySymbol={currentTrip.symbol}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  )
}

// 一個 Day 欄
function DayColumn({
  day,
  currencySymbol,
}: {
  day: TripDay
  currencySymbol: string | null
}) {
  return (
    <View className="w-[290px] bg-surface-2 dark:bg-dark-surface-2 border border-line dark:border-dark-line rounded-[18px] p-3.5">
      {/* 欄頭:Day N | 主題 | 日期 */}
      <View className="pb-3 border-b border-line dark:border-dark-line">
        <Text className="text-accent-2 text-[13px] font-black tracking-wider">
          Day {day.dayNumber}
        </Text>
        <Text className="text-ink dark:text-dark-ink text-[17px] font-extrabold mt-0.5">
          {day.theme ?? `第 ${day.dayNumber} 天`}
        </Text>
        <Text className="text-muted dark:text-dark-muted text-xs mt-0.5">{formatDate(day.date)}</Text>
      </View>

      {/* 活動卡片清單 */}
      <View className="gap-2.5 mt-3">
        {day.activities.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            currencySymbol={currencySymbol}
          />
        ))}
      </View>

      {/* 新增按鈕(虛線) */}
      <Pressable className="flex-row items-center justify-center gap-1.5 mt-3 py-2.5 border-[1.5px] border-dashed border-line dark:border-dark-line rounded-[12px] active:opacity-70">
        <Plus size={14} color="#6c7bd6" />
        <Text className="text-accent dark:text-dark-accent text-[13px] font-bold">新增景點</Text>
      </Pressable>
    </View>
  )
}
