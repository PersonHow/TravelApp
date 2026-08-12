// 首頁的飯店卡：名稱 + 區域 + check-in/out 大時間
import { View, Text, Pressable } from 'react-native'
import { Home, MapPin, ArrowRight } from 'lucide-react-native'
import { formatDate, formatTime } from '@/utils/format'
import type { Hotel } from '@/types/api'

interface HotelCardProps {
  hotel: Hotel
  onPress?: () => void
}

export function HotelCard({ hotel, onPress }: HotelCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-card p-3.5 active:opacity-80"
    >
      <View className="flex-row items-start gap-2">
        <Home size={18} color="#6c7bd6" style={{ marginTop: 2 }} />
        <View className="flex-1">
          <Text className="text-ink dark:text-dark-ink text-base font-extrabold leading-[20px]">
            {hotel.name}
          </Text>
          {hotel.address && (
            <View className="flex-row items-center gap-1 mt-1">
              <MapPin size={11} color="#8c89a8" />
              <Text className="text-muted dark:text-dark-muted text-xs">{hotel.address}</Text>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-2.5 mt-3 bg-surface-2 dark:bg-dark-surface-2 rounded-[11px] p-3">
        <View className="flex-1">
          <Text className="text-muted dark:text-dark-muted text-[10px] font-bold tracking-wide">
            CHECK-IN
          </Text>
          <Text className="text-ink dark:text-dark-ink text-[13px] font-bold mt-0.5">
            {formatDate(hotel.checkIn)}
          </Text>
          <Text className="text-accent dark:text-dark-accent text-[19px] font-black leading-[20px] mt-0.5">
            {formatTime(hotel.checkIn)}
          </Text>
        </View>
        <ArrowRight size={16} color="#8c89a8" />
        <View className="flex-1 items-end">
          <Text className="text-muted dark:text-dark-muted text-[10px] font-bold tracking-wide">
            CHECK-OUT
          </Text>
          <Text className="text-ink dark:text-dark-ink text-[13px] font-bold mt-0.5">
            {formatDate(hotel.checkOut)}
          </Text>
          <Text className="text-accent dark:text-dark-accent text-[19px] font-black leading-[20px] mt-0.5">
            {formatTime(hotel.checkOut)}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}
