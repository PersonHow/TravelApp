// DAY 詳情彈窗：旅程總覽 tab 點 DAY 卡打開，看當天安排、點活動編輯、可新增
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Plus, X } from 'lucide-react-native'
import { ActivityCard } from './ActivityCard'
import { formatDate } from '@/utils/format'
import type { DayActivity, TripDay } from '@/types/api'

interface DayDetailModalProps {
  visible: boolean
  onClose: () => void
  day: TripDay | null
  currencySymbol: string | null
  onPressActivity: (a: DayActivity) => void
  onAdd: () => void
}

export function DayDetailModal({
  visible,
  onClose,
  day,
  currencySymbol,
  onPressActivity,
  onAdd,
}: DayDetailModalProps) {
  if (!day) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/45 px-4">
        <View className="w-full max-w-[440px] max-h-[86%] bg-surface dark:bg-dark-surface rounded-[20px] overflow-hidden">
          {/* 標題列 */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-line dark:border-dark-line">
            <View>
              <Text className="text-accent-2 text-[12px] font-black tracking-wider">
                Day {day.dayNumber}
              </Text>
              <Text className="text-ink dark:text-dark-ink text-[17px] font-extrabold mt-0.5">
                {day.theme ?? `第 ${day.dayNumber} 天`}
                <Text className="text-muted dark:text-dark-muted text-[12px] font-medium">
                  {'  '}
                  {formatDate(day.date)}
                </Text>
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-1 active:opacity-60" hitSlop={8}>
              <X size={18} color="#8c89a8" />
            </Pressable>
          </View>

          {/* 當天活動清單 */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}
          >
            {day.activities.length === 0 ? (
              <Text className="text-muted dark:text-dark-muted text-[13px] text-center py-6">
                這天還沒安排
              </Text>
            ) : (
              day.activities.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  currencySymbol={currencySymbol}
                  onPress={() => onPressActivity(a)}
                />
              ))
            )}
            <Pressable
              onPress={onAdd}
              className="flex-row items-center justify-center gap-1.5 py-2.5 border-[1.5px] border-dashed border-line dark:border-dark-line rounded-[12px] active:opacity-70"
            >
              <Plus size={14} color="#6c7bd6" />
              <Text className="text-accent dark:text-dark-accent text-[13px] font-bold">
                新增景點
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}
