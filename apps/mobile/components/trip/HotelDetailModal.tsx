// 飯店詳情彈窗（手機用；桌面在交通住宿頁右側面板直接顯示 HotelDetail）
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Pencil, X } from 'lucide-react-native'
import { HotelDetail } from '@/components/trip/HotelDetail'
import type { Hotel } from '@/types/api'

interface HotelDetailModalProps {
  visible: boolean
  onClose: () => void
  hotel: Hotel | null
  tripId: string
  defaultOrigin?: string
  // 點「編輯」：由呼叫端開編輯表單（RN 原生一次只能一個 Modal，呼叫端先藏本彈窗）
  onEdit: () => void
}

export function HotelDetailModal({
  visible,
  onClose,
  hotel,
  tripId,
  defaultOrigin,
  onEdit,
}: HotelDetailModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/45 px-4">
        <View className="w-full max-w-[440px] max-h-[85%] bg-bg dark:bg-dark-bg rounded-[20px] overflow-hidden">
          {/* 標題列：飯店詳細＋編輯＋關閉 */}
          <View className="flex-row items-center gap-2 px-5 pt-4 pb-3 border-b border-line dark:border-dark-line">
            <Text className="text-ink dark:text-dark-ink text-[17px] font-extrabold flex-1">
              飯店詳細
            </Text>
            <Pressable
              onPress={onEdit}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
            >
              <Pencil size={12} color="#8c89a8" />
              <Text className="text-muted dark:text-dark-muted text-[12px] font-bold">編輯</Text>
            </Pressable>
            <Pressable onPress={onClose} className="p-1 active:opacity-60" hitSlop={8}>
              <X size={18} color="#8c89a8" />
            </Pressable>
          </View>

          {hotel && (
            <ScrollView
              contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
              showsVerticalScrollIndicator={false}
            >
              <HotelDetail
                hotel={hotel}
                tripId={tripId}
                defaultOrigin={defaultOrigin}
                onEdit={onEdit}
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}
