// 交通住宿 tab:目前行程的航班與飯店清單,可新增/編輯/刪除
import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Plane, Home, Plus } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { FlightCard } from '@/components/trip/FlightCard'
import { HotelCard } from '@/components/trip/HotelCard'
import { FlightFormModal } from '@/components/trip/FlightFormModal'
import { HotelFormModal } from '@/components/trip/HotelFormModal'
import type { Flight, Hotel } from '@/types/api'

// 彈窗狀態:開哪種表單、'create' 或要編輯的那筆
type ModalState =
  { kind: 'flight'; flight: Flight | null } | { kind: 'hotel'; hotel: Hotel | null } | null

export default function TransportScreen() {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  // currentTrip 由 trip/[id]/_layout 保證載入完成
  const currentTrip = useTripStore((s) => s.currentTrip)
  const [modal, setModal] = useState<ModalState>(null)

  if (!currentTrip) return null

  // 依出發時間排序,首班當去程色、其餘回程色(與首頁慣例一致)
  const flights = [...currentTrip.flights].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
  )
  const hotels = [...currentTrip.hotels].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
  )

  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 34 : 10,
          paddingBottom: 40,
          maxWidth: 760,
          width: '100%',
          alignSelf: isDesktop ? 'flex-start' : 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
          交通住宿
        </Text>
        <Text className="text-muted dark:text-dark-muted text-[13px] mt-1">
          {currentTrip.title} · 點任一卡片編輯
        </Text>

        {/* 航班 */}
        <SectionHeader
          icon={<Plane size={15} color="#6c7bd6" />}
          title="航班"
          onAdd={() => setModal({ kind: 'flight', flight: null })}
        />
        {flights.length === 0 ? (
          <EmptyHint text="尚未加入航班" />
        ) : (
          <View className="gap-2.5">
            {flights.map((f, idx) => (
              <FlightCard
                key={f.id}
                flight={f}
                isReturn={idx > 0}
                // 點卡片進詳細頁（前往方式/行李清單）,編輯功能在詳細頁裡
                onPress={() =>
                  router.push({
                    pathname: '/trip/[id]/flight/[flightId]',
                    params: { id: currentTrip.id, flightId: f.id },
                  })
                }
              />
            ))}
          </View>
        )}

        {/* 飯店 */}
        <SectionHeader
          icon={<Home size={15} color="#6c7bd6" />}
          title="飯店"
          onAdd={() => setModal({ kind: 'hotel', hotel: null })}
        />
        {hotels.length === 0 ? (
          <EmptyHint text="尚未加入飯店" />
        ) : (
          <View className="gap-2.5">
            {hotels.map((h) => (
              <HotelCard
                key={h.id}
                hotel={h}
                onPress={() => setModal({ kind: 'hotel', hotel: h })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <FlightFormModal
        visible={modal?.kind === 'flight'}
        onClose={() => setModal(null)}
        tripId={currentTrip.id}
        flight={modal?.kind === 'flight' ? modal.flight : null}
      />
      <HotelFormModal
        visible={modal?.kind === 'hotel'}
        onClose={() => setModal(null)}
        tripId={currentTrip.id}
        hotel={modal?.kind === 'hotel' ? modal.hotel : null}
      />
    </View>
  )
}

// 區塊標題 + 右側新增鈕
function SectionHeader({
  icon,
  title,
  onAdd,
}: {
  icon: React.ReactNode
  title: string
  onAdd: () => void
}) {
  return (
    <View className="flex-row items-center justify-between mt-7 mb-3">
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-ink dark:text-dark-ink text-[16px] font-extrabold">{title}</Text>
      </View>
      <Pressable
        onPress={onAdd}
        className="flex-row items-center gap-1 bg-accent dark:bg-dark-accent rounded-full px-3 py-1.5 active:opacity-80"
      >
        <Plus size={13} color="#fff" />
        <Text className="text-white text-xs font-bold">新增</Text>
      </Pressable>
    </View>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <View className="items-center py-6 border-[1.5px] border-dashed border-line dark:border-dark-line rounded-[14px]">
      <Text className="text-muted dark:text-dark-muted text-[13px]">{text}</Text>
    </View>
  )
}
