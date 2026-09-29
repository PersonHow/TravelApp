// 交通住宿 tab:目前行程的航班與飯店,可新增/編輯/刪除
// 桌面:左側縮小清單＋右側詳細面板(點清單切換);手機:維持大卡片,點航班進詳細頁
import { useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Plane, Home, Plus, Pencil } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { FlightCard } from '@/components/trip/FlightCard'
import { HotelCard } from '@/components/trip/HotelCard'
import { FlightDetail } from '@/components/trip/FlightDetail'
import { HotelDetail } from '@/components/trip/HotelDetail'
import { HotelDetailModal } from '@/components/trip/HotelDetailModal'
import { FlightFormModal } from '@/components/trip/FlightFormModal'
import { HotelFormModal } from '@/components/trip/HotelFormModal'
import { airportLabel } from '@/utils/airports'
import { formatDate, formatTime } from '@/utils/format'
import type { Flight, Hotel } from '@/types/api'

// 彈窗狀態:開哪種表單、'create' 或要編輯的那筆
type ModalState =
  { kind: 'flight'; flight: Flight | null } | { kind: 'hotel'; hotel: Hotel | null } | null

// 桌面右側面板目前選中的項目
type Selected = { kind: 'flight'; id: string } | { kind: 'hotel'; id: string } | null

export default function TransportScreen() {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  // currentTrip 由 trip/[id]/_layout 保證載入完成
  const currentTrip = useTripStore((s) => s.currentTrip)
  const [modal, setModal] = useState<ModalState>(null)
  const [selected, setSelected] = useState<Selected>(null)
  // 手機:點飯店卡開詳情彈窗(桌面用右側面板,不用這個)
  const [detailHotelId, setDetailHotelId] = useState<string | null>(null)

  if (!currentTrip) return null

  // 依出發時間排序,首班當去程色、其餘回程色(與首頁慣例一致)
  const flights = [...currentTrip.flights].sort(
    (a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime(),
  )
  const hotels = [...currentTrip.hotels].sort(
    (a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime(),
  )

  // 選中項失效(被刪除)或尚未選時,退回第一筆航班、再退飯店
  const selFlight =
    selected?.kind === 'flight' ? flights.find((f) => f.id === selected.id) : undefined
  const selHotel = selected?.kind === 'hotel' ? hotels.find((h) => h.id === selected.id) : undefined
  const effective: { flight?: Flight; hotel?: Hotel } =
    selFlight || selHotel
      ? { flight: selFlight, hotel: selHotel }
      : flights[0]
        ? { flight: flights[0] }
        : hotels[0]
          ? { hotel: hotels[0] }
          : {}

  const sectionPad = {
    paddingTop: isDesktop ? 34 : 10,
    paddingBottom: 40,
  }

  // 路線查詢的預設出發地:去程航班的抵達機場（查不到對照表就用代碼）
  const defaultOrigin = flights[0]
    ? (airportLabel(flights[0].arrivalAirport) ?? flights[0].arrivalAirport).replace(/（.*）$/, '')
    : undefined
  const detailHotel = hotels.find((h) => h.id === detailHotelId) ?? null

  // ── 手機版:維持原本大卡片清單 ──
  const mobileContent = (
    <ScrollView
      contentContainerStyle={{
        paddingHorizontal: 16,
        ...sectionPad,
        maxWidth: 760,
        width: '100%',
        alignSelf: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
        交通住宿
      </Text>
      <Text className="text-muted dark:text-dark-muted text-[13px] mt-1">
        {currentTrip.title} · 點任一卡片編輯
      </Text>

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
            <HotelCard key={h.id} hotel={h} onPress={() => setDetailHotelId(h.id)} />
          ))}
        </View>
      )}
    </ScrollView>
  )

  // ── 桌面版:左清單＋右詳細 ──
  const desktopContent = (
    <View className="flex-1 flex-row">
      {/* 左:縮小清單 */}
      <ScrollView
        style={{ width: 340, flexGrow: 0 }}
        contentContainerStyle={{ paddingLeft: 40, paddingRight: 14, ...sectionPad }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
          交通住宿
        </Text>
        <Text className="text-muted dark:text-dark-muted text-[13px] mt-1">
          {currentTrip.title}
        </Text>

        <SectionHeader
          icon={<Plane size={15} color="#6c7bd6" />}
          title="航班"
          onAdd={() => setModal({ kind: 'flight', flight: null })}
        />
        {flights.length === 0 ? (
          <EmptyHint text="尚未加入航班" />
        ) : (
          <View className="gap-1">
            {flights.map((f, idx) => (
              <CompactRow
                key={f.id}
                icon={<Plane size={15} color="#6c7bd6" />}
                title={`${f.flightNumber} · ${f.departureAirport} → ${f.arrivalAirport}`}
                sub={`${idx === 0 ? '去程' : '回程'} · ${formatDate(f.departureTime)} ${formatTime(f.departureTime)}`}
                selected={effective.flight?.id === f.id}
                onPress={() => setSelected({ kind: 'flight', id: f.id })}
              />
            ))}
          </View>
        )}

        <SectionHeader
          icon={<Home size={15} color="#6c7bd6" />}
          title="飯店"
          onAdd={() => setModal({ kind: 'hotel', hotel: null })}
        />
        {hotels.length === 0 ? (
          <EmptyHint text="尚未加入飯店" />
        ) : (
          <View className="gap-1">
            {hotels.map((h) => (
              <CompactRow
                key={h.id}
                icon={<Home size={15} color="#6c7bd6" />}
                title={h.name}
                sub={`${formatDate(h.checkIn)} – ${formatDate(h.checkOut)}`}
                selected={effective.hotel?.id === h.id}
                onPress={() => setSelected({ kind: 'hotel', id: h.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 右:詳細面板 */}
      <ScrollView
        className="flex-1 border-l border-line dark:border-dark-line"
        contentContainerStyle={{ paddingHorizontal: 34, ...sectionPad, maxWidth: 720 }}
        showsVerticalScrollIndicator={false}
      >
        {effective.flight ? (
          <>
            <DetailHeader
              title="航班詳細"
              onEdit={() => setModal({ kind: 'flight', flight: effective.flight! })}
            />
            <FlightDetail
              flight={effective.flight}
              isReturn={flights.indexOf(effective.flight) > 0}
              tripId={currentTrip.id}
              packingItems={currentTrip.packingItems}
              onEdit={() => setModal({ kind: 'flight', flight: effective.flight! })}
            />
          </>
        ) : effective.hotel ? (
          <>
            <DetailHeader
              title="飯店詳細"
              onEdit={() => setModal({ kind: 'hotel', hotel: effective.hotel! })}
            />
            <HotelDetail
              hotel={effective.hotel}
              tripId={currentTrip.id}
              defaultOrigin={defaultOrigin}
              onEdit={() => setModal({ kind: 'hotel', hotel: effective.hotel! })}
            />
          </>
        ) : (
          <View className="items-center mt-20">
            <Plane size={42} color="#a0c4ff" />
            <Text className="text-muted dark:text-dark-muted text-sm mt-4">
              還沒有航班或飯店，先從左邊「新增」開始
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )

  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
      {isDesktop ? desktopContent : mobileContent}

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
      <HotelDetailModal
        visible={!isDesktop && detailHotel !== null}
        onClose={() => setDetailHotelId(null)}
        hotel={detailHotel}
        tripId={currentTrip.id}
        defaultOrigin={defaultOrigin}
        onEdit={() => {
          if (!detailHotel) return
          setDetailHotelId(null)
          setModal({ kind: 'hotel', hotel: detailHotel })
        }}
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

// 桌面左側的縮小列:標題＋副標,選中時亮主色底
function CompactRow({
  icon,
  title,
  sub,
  selected,
  onPress,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        selected
          ? 'flex-row items-center gap-2.5 rounded-[12px] px-3 py-2.5 bg-accent-soft dark:bg-accent/25 border border-accent dark:border-dark-accent'
          : 'flex-row items-center gap-2.5 rounded-[12px] px-3 py-2.5 border border-transparent active:opacity-70'
      }
    >
      {icon}
      <View className="flex-1">
        <Text numberOfLines={1} className="text-ink dark:text-dark-ink text-[13.5px] font-bold">
          {title}
        </Text>
        <Text numberOfLines={1} className="text-muted dark:text-dark-muted text-[11.5px] mt-0.5">
          {sub}
        </Text>
      </View>
    </Pressable>
  )
}

// 桌面右側面板的標題列＋編輯鈕
function DetailHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text className="text-ink dark:text-dark-ink text-[20px] font-black tracking-tight">
        {title}
      </Text>
      <Pressable
        onPress={onEdit}
        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
      >
        <Pencil size={12} color="#8c89a8" />
        <Text className="text-muted dark:text-dark-muted text-[12px] font-bold">編輯</Text>
      </Pressable>
    </View>
  )
}
