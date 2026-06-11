// 首頁的單日列：左邊方塊 day 編號，右邊主題+日期+項目數
import { View, Text, Pressable } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { formatDate } from '@/utils/format'

interface DayRowProps {
  dayNumber: number
  date: string
  activityCount: number
  theme?: string
  onPress?: () => void
}

export function DayRow({ dayNumber, date, activityCount, theme, onPress }: DayRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-card p-3.5 mt-2.5 active:opacity-80"
    >
      <View className="w-10 h-10 rounded-card bg-accent-soft dark:bg-accent/25 items-center justify-center">
        <Text className="text-accent dark:text-dark-accent font-black text-[15px]">{dayNumber}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-ink dark:text-dark-ink font-bold text-[14.5px]">
          {theme ?? `Day ${dayNumber}`}
        </Text>
        <Text className="text-muted dark:text-dark-muted text-xs mt-0.5">{formatDate(date)}</Text>
      </View>
      <Text className="text-muted dark:text-dark-muted text-xs mr-1">{activityCount} 項</Text>
      <ChevronRight size={18} color="#8c89a8" />
    </Pressable>
  )
}
