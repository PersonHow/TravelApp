// 首頁的航班簡卡：去程/回程 兩格並排（trip-key 2x2）
import { View, Text, Pressable } from 'react-native'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native'
import { formatTime } from '@/utils/format'
import type { Flight } from '@/types/api'

interface FlightCardProps {
  flight: Flight
  isReturn?: boolean
  onPress?: () => void
}

export function FlightCard({ flight, isReturn, onPress }: FlightCardProps) {
  const accentClass = isReturn ? 'text-accent-2' : 'text-accent'
  const bgClass = isReturn ? 'bg-accent-2/15' : 'bg-accent-soft'
  const Icon = isReturn ? ArrowDownLeft : ArrowUpRight

  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center gap-2.5 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-card p-3 active:opacity-80"
    >
      <View className={`w-[34px] h-[34px] rounded-[10px] items-center justify-center ${bgClass}`}>
        <Icon size={18} color={isReturn ? '#ef7a8e' : '#6c7bd6'} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-muted dark:text-dark-muted text-[10.5px] font-bold tracking-wide">
          {isReturn ? '回程' : '去程'}
        </Text>
        <Text className="text-ink dark:text-dark-ink text-[17px] font-black leading-[19px] mt-0.5">
          {formatTime(flight.departureTime)}
        </Text>
        <Text className={`text-[11px] font-bold ${accentClass}`}>
          {flight.departureAirport} → {flight.arrivalAirport}
        </Text>
        <Text className="text-muted dark:text-dark-muted text-[10.5px] mt-0.5" numberOfLines={1}>
          {flight.flightNumber}
        </Text>
      </View>
    </Pressable>
  )
}
