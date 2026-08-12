// 航班卡：TPE 08:50 ✈ NRT 13:05 的路線排版
// 下方顯示班號＋航空公司，以及機場全名（常用機場對照表，查不到只顯示代碼）
import { View, Text, Pressable } from 'react-native'
import { ArrowUpRight, ArrowDownLeft, Plane } from 'lucide-react-native'
import { formatDate, formatTime } from '@/utils/format'
import { airportLabel } from '@/utils/airports'
import type { Flight } from '@/types/api'

interface FlightCardProps {
  flight: Flight
  isReturn?: boolean
  onPress?: () => void
}

export function FlightCard({ flight, isReturn, onPress }: FlightCardProps) {
  const accentColor = isReturn ? '#ef7a8e' : '#6c7bd6'
  const bgClass = isReturn ? 'bg-accent-2/15' : 'bg-accent-soft'
  const Icon = isReturn ? ArrowDownLeft : ArrowUpRight

  const depLabel = airportLabel(flight.departureAirport)
  const arrLabel = airportLabel(flight.arrivalAirport)

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-card p-3.5 active:opacity-80"
    >
      {/* 去程/回程 + 日期 */}
      <View className="flex-row items-center gap-2">
        <View className={`w-[26px] h-[26px] rounded-[8px] items-center justify-center ${bgClass}`}>
          <Icon size={14} color={accentColor} />
        </View>
        <Text className="text-muted dark:text-dark-muted text-[11px] font-bold tracking-wide">
          {isReturn ? '回程' : '去程'} · {formatDate(flight.departureTime)}
        </Text>
      </View>

      {/* 路線：起飛地(時間) ✈ 降落地(時間) */}
      <View className="flex-row items-center mt-2.5">
        <View>
          <Text className="text-ink dark:text-dark-ink text-[20px] font-black leading-[22px]">
            {flight.departureAirport}
          </Text>
          <Text className="text-muted dark:text-dark-muted text-[12.5px] font-bold mt-0.5">
            {formatTime(flight.departureTime)}
          </Text>
        </View>
        <View className="flex-1 flex-row items-center px-3">
          <View className="flex-1 h-[1px] bg-line dark:bg-dark-line" />
          <Plane
            size={14}
            color={accentColor}
            style={{ marginHorizontal: 4, transform: [{ rotate: '45deg' }] }}
          />
          <View className="flex-1 h-[1px] bg-line dark:bg-dark-line" />
        </View>
        <View className="items-end">
          <Text className="text-ink dark:text-dark-ink text-[20px] font-black leading-[22px]">
            {flight.arrivalAirport}
          </Text>
          <Text className="text-muted dark:text-dark-muted text-[12.5px] font-bold mt-0.5">
            {formatTime(flight.arrivalTime)}
          </Text>
        </View>
      </View>

      {/* 班號＋航空公司 */}
      <Text className="text-ink dark:text-dark-ink text-[12px] font-bold mt-2.5" numberOfLines={1}>
        {flight.flightNumber}
        {flight.airline ? `  ·  ${flight.airline}` : ''}
      </Text>

      {/* 機場全名（兩端都查不到就整行不顯示） */}
      {(depLabel || arrLabel) && (
        <Text className="text-muted dark:text-dark-muted text-[11px] mt-0.5" numberOfLines={1}>
          {depLabel ?? flight.departureAirport} → {arrLabel ?? flight.arrivalAirport}
        </Text>
      )}
    </Pressable>
  )
}
