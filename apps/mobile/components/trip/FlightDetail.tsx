// 航班詳細內容：航班卡＋機型＋前往機場方式＋行李清單
// 手機的航班詳細頁（trip/[id]/flight/[flightId]）與桌面交通住宿右側面板共用
import { View, Text, Pressable } from 'react-native'
import { Luggage, Navigation, Plane } from 'lucide-react-native'
import { FlightCard } from '@/components/trip/FlightCard'
import { PackingList } from '@/components/trip/PackingList'
import type { Flight, PackingItem } from '@/types/api'

interface FlightDetailProps {
  flight: Flight
  isReturn: boolean
  tripId: string
  packingItems: PackingItem[]
  // 「還沒寫怎麼去機場」提示點下去開編輯表單
  onEdit: () => void
}

export function FlightDetail({
  flight,
  isReturn,
  tripId,
  packingItems,
  onEdit,
}: FlightDetailProps) {
  return (
    <>
      {/* 航班卡（含機場全名） */}
      <FlightCard flight={flight} isReturn={isReturn} />

      {/* 機型 */}
      {flight.aircraft && (
        <View className="flex-row items-center gap-2 mt-3 px-1">
          <Plane size={13} color="#8c89a8" />
          <Text className="text-muted dark:text-dark-muted text-[12.5px]">
            機型 {flight.aircraft}
          </Text>
        </View>
      )}

      {/* 前往機場方式 */}
      <View className="flex-row items-center gap-1.5 mt-6 mb-2 px-0.5">
        <Navigation size={14} color="#6c7bd6" />
        <Text className="text-ink dark:text-dark-ink text-[15px] font-extrabold">前往機場</Text>
      </View>
      {flight.accessNote ? (
        <View className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] p-4">
          <Text className="text-ink dark:text-dark-ink text-[14px] leading-[22px]">
            {flight.accessNote}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={onEdit}
          className="items-center py-5 border-[1.5px] border-dashed border-line dark:border-dark-line rounded-[14px] active:opacity-70"
        >
          <Text className="text-muted dark:text-dark-muted text-[13px]">
            還沒寫怎麼去機場，點這裡到「編輯」補上
          </Text>
        </Pressable>
      )}

      {/* 行李清單 */}
      <View className="flex-row items-center gap-1.5 mt-6 mb-2 px-0.5">
        <Luggage size={14} color="#6c7bd6" />
        <Text className="text-ink dark:text-dark-ink text-[15px] font-extrabold">行李清單</Text>
        <Text className="text-muted dark:text-dark-muted text-[11px]">（整趟旅程共用）</Text>
      </View>
      <PackingList tripId={tripId} items={packingItems} />
    </>
  )
}
