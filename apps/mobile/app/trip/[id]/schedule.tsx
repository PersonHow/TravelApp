// 行程 tab:kanban 看板(每天一欄,卡片是活動)
// 對應設計檔網頁版.html 的「行程」頁
import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { Plus } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { ActivityCard } from '@/components/trip/ActivityCard'
import { ActivityFormModal } from '@/components/trip/ActivityFormModal'
import { DayFormModal } from '@/components/trip/DayFormModal'
import { formatDate, tripLengthDays } from '@/utils/format'
import type { DayActivity, TripDay } from '@/types/api'

// 彈窗狀態:新增(指定哪一天)或編輯(指定活動)
type ModalState = { mode: 'create'; dayId: string } | { mode: 'edit'; activity: DayActivity } | null

export default function ScheduleScreen() {
  const isDesktop = useIsDesktop()
  // currentTrip 由 trip/[id]/_layout 保證載入完成
  const currentTrip = useTripStore((s) => s.currentTrip)
  const [modal, setModal] = useState<ModalState>(null)
  const [dayModal, setDayModal] = useState<{ day: TripDay | null } | null>(null)

  if (!currentTrip) return null
  const canAddDay =
    currentTrip.tripDays.length < tripLengthDays(currentTrip.startDate, currentTrip.endDate)

  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
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
        <View className="flex-row items-center justify-between">
          <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
            行程
          </Text>
          {canAddDay ? (
            <Pressable
              onPress={() => setDayModal({ day: null })}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-[10px] bg-accent dark:bg-dark-accent active:opacity-80"
            >
              <Plus size={15} color="#fff" />
              <Text className="text-white text-[13px] font-bold">新增一天</Text>
            </Pressable>
          ) : (
            <Text className="text-muted dark:text-dark-muted text-[12px]">已建立所有天數</Text>
          )}
        </View>
        <Text className="text-muted dark:text-dark-muted text-[13px] mt-1">
          每天一欄 · 點任一景點看細節或編輯
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
              onAdd={() => setModal({ mode: 'create', dayId: day.id })}
              onEdit={() => setDayModal({ day })}
              onPressActivity={(activity) => setModal({ mode: 'edit', activity })}
            />
          ))}
        </ScrollView>
      </ScrollView>

      <ActivityFormModal
        visible={modal !== null}
        onClose={() => setModal(null)}
        trip={currentTrip}
        activity={modal?.mode === 'edit' ? modal.activity : null}
        initialDayId={modal?.mode === 'create' ? modal.dayId : undefined}
      />
      <DayFormModal
        visible={dayModal !== null}
        onClose={() => setDayModal(null)}
        trip={currentTrip}
        day={dayModal?.day ?? null}
      />
    </View>
  )
}

// 一個 Day 欄
function DayColumn({
  day,
  currencySymbol,
  onAdd,
  onEdit,
  onPressActivity,
}: {
  day: TripDay
  currencySymbol: string | null
  onAdd: () => void
  onEdit: () => void
  onPressActivity: (activity: DayActivity) => void
}) {
  return (
    <View className="w-[290px] bg-surface-2 dark:bg-dark-surface-2 border border-line dark:border-dark-line rounded-[18px] p-3.5">
      {/* 欄頭:Day N | 主題 | 日期 */}
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`編輯 Day ${day.dayNumber}`}
        className="pb-3 border-b border-line dark:border-dark-line active:opacity-70"
      >
        <Text className="text-accent-2 text-[13px] font-black tracking-wider">
          Day {day.dayNumber}
        </Text>
        <Text className="text-ink dark:text-dark-ink text-[17px] font-extrabold mt-0.5">
          {day.theme ?? `第 ${day.dayNumber} 天`}
        </Text>
        <Text className="text-muted dark:text-dark-muted text-xs mt-0.5">
          {formatDate(day.date)}
        </Text>
        <Text className="text-accent text-[11px] font-semibold mt-1">點此編輯日期與主題</Text>
      </Pressable>

      {/* 活動卡片清單 */}
      <View className="gap-2.5 mt-3">
        {day.activities.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            currencySymbol={currencySymbol}
            onPress={() => onPressActivity(a)}
          />
        ))}
      </View>

      {/* 新增按鈕(虛線) */}
      <Pressable
        onPress={onAdd}
        className="flex-row items-center justify-center gap-1.5 mt-3 py-2.5 border-[1.5px] border-dashed border-line dark:border-dark-line rounded-[12px] active:opacity-70"
      >
        <Plus size={14} color="#6c7bd6" />
        <Text className="text-accent dark:text-dark-accent text-[13px] font-bold">新增景點</Text>
      </Pressable>
    </View>
  )
}
