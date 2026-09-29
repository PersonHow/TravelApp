// 首頁的單日卡片：上方 DAY 徽章＋日期、主題標題、分隔線下方預覽當天前 3 個活動
// isToday 時亮燈：主色外框＋「今天」徽章
import { View, Text, Pressable } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { formatDate } from '@/utils/format'
import type { DayActivity } from '@/types/api'

// 卡片上最多預覽幾個活動，其餘收進「+N 項」
const PREVIEW_COUNT = 3

interface DayCardProps {
  dayNumber: number
  date: string
  activities: DayActivity[]
  theme?: string
  isToday?: boolean
  onPress?: () => void
}

export function DayCard({ dayNumber, date, activities, theme, isToday, onPress }: DayCardProps) {
  const preview = activities.slice(0, PREVIEW_COUNT)
  const rest = activities.length - preview.length

  return (
    <Pressable
      onPress={onPress}
      className={
        isToday
          ? 'grow bg-surface dark:bg-dark-surface border-2 border-accent dark:border-dark-accent rounded-card p-3.5 mt-2.5 active:opacity-80 shadow-md shadow-accent/30'
          : 'grow bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-card p-3.5 mt-2.5 active:opacity-80'
      }
    >
      <View className="flex-row items-center gap-2.5">
        <View className="w-9 h-9 rounded-card bg-accent-soft dark:bg-accent/25 items-center justify-center">
          <Text className="text-accent dark:text-dark-accent font-black text-[15px]">
            {dayNumber}
          </Text>
        </View>
        <Text className="text-muted dark:text-dark-muted text-xs">{formatDate(date)}</Text>
        {isToday && (
          <View className="ml-auto px-2 py-0.5 rounded-full bg-accent dark:bg-dark-accent">
            <Text className="text-white dark:text-dark-bg text-[10px] font-bold">今天</Text>
          </View>
        )}
      </View>

      <Text
        numberOfLines={1}
        className="text-ink dark:text-dark-ink font-bold text-[14.5px] mt-2.5"
      >
        {theme ?? `Day ${dayNumber}`}
      </Text>

      <View className="h-px bg-line dark:bg-dark-line my-2.5" />

      {preview.length === 0 ? (
        <Text className="text-muted dark:text-dark-muted text-xs leading-5">尚未安排活動</Text>
      ) : (
        preview.map((a) => (
          <Text
            key={a.id}
            numberOfLines={1}
            className="text-muted dark:text-dark-muted text-xs leading-5"
          >
            · {a.title}
          </Text>
        ))
      )}

      {/* mt-auto 貼底:活動較少的卡片被拉到同列等高時,項目數固定在右下角 */}
      <View className="mt-auto flex-row items-center justify-end gap-1 pt-2">
        <Text className="text-muted dark:text-dark-muted text-xs">
          {rest > 0 ? `+${rest} 項` : `共 ${activities.length} 項`}
        </Text>
        <ChevronRight size={16} color="#8c89a8" />
      </View>
    </Pressable>
  )
}
