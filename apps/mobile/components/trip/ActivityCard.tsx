// 行程 kanban 的單一卡片:時間 | 類別徽章 | 標題 | 地點 | 營業時間 | 價錢
import { View, Text, Pressable } from 'react-native'
import { MapPin, Clock } from 'lucide-react-native'
import { formatTime } from '@/utils/format'
import { categoryStyle, formatPrice } from '@/utils/activityCategory'
import type { DayActivity } from '@/types/api'

interface ActivityCardProps {
  activity: DayActivity
  currencySymbol: string | null
  onPress?: () => void
}

export function ActivityCard({ activity, currencySymbol, onPress }: ActivityCardProps) {
  const cat = categoryStyle(activity.type)
  const priceText = formatPrice(activity.price, currencySymbol)

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[13px] p-3 active:opacity-80"
    >
      {/* 上排:時間(accent)/ 類別徽章 */}
      <View className="flex-row items-center justify-between">
        {activity.startTime && (
          <Text className="text-accent dark:text-dark-accent text-[12.5px] font-extrabold">
            {formatTime(activity.startTime)}
          </Text>
        )}
        <Text className="text-[11px] font-bold" style={{ color: cat.color }}>
          {cat.label}
        </Text>
      </View>

      {/* 標題 */}
      <Text className="text-ink dark:text-dark-ink text-[14.5px] font-bold leading-[20px] mt-1.5">
        {activity.title}
      </Text>

      {/* 地點 */}
      {activity.place && (
        <View className="flex-row items-center gap-1 mt-1.5">
          <MapPin size={11} color="#8c89a8" />
          <Text className="text-muted dark:text-dark-muted text-[11.5px]" numberOfLines={1}>
            {activity.place}
          </Text>
        </View>
      )}

      {/* 下排:營業時間 / 價錢 */}
      {(activity.hours || priceText) && (
        <View className="flex-row items-center justify-between mt-2">
          {activity.hours ? (
            <View className="flex-row items-center gap-1">
              <Clock size={10} color="#8c89a8" />
              <Text className="text-muted dark:text-dark-muted text-[11px]">{activity.hours}</Text>
            </View>
          ) : (
            <View />
          )}
          {priceText && (
            <Text className="text-ink dark:text-dark-ink text-[12.5px] font-extrabold">
              {priceText}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  )
}
