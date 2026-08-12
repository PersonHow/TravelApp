// 地圖選點：點地圖放 pin、確認後回傳座標（原生限定，Web 不顯示入口）
import { useEffect, useState } from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { X } from 'lucide-react-native'
import { MapCanvas } from './MapCanvas'

interface LocationPickerModalProps {
  visible: boolean
  onClose: () => void
  // 已有精確座標時以它為起點，否則用 fallbackCenter
  initial: { lat: number; lng: number } | null
  fallbackCenter: { lat: number; lng: number }
  onConfirm: (lat: number, lng: number) => void
}

export function LocationPickerModal({
  visible,
  onClose,
  initial,
  fallbackCenter,
  onConfirm,
}: LocationPickerModalProps) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (visible) setMarker(initial)
  }, [visible, initial])

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/45 px-4">
        <View className="w-full max-w-[440px] h-[78%] bg-surface dark:bg-dark-surface rounded-[20px] overflow-hidden">
          {/* 標題列 */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-line dark:border-dark-line">
            <Text className="text-ink dark:text-dark-ink text-[17px] font-extrabold">地圖選點</Text>
            <Pressable onPress={onClose} className="p-1 active:opacity-60" hitSlop={8}>
              <X size={18} color="#8c89a8" />
            </Pressable>
          </View>

          {/* 地圖：點任一處放 pin */}
          <MapCanvas
            style={{ flex: 1 }}
            center={marker ?? initial ?? fallbackCenter}
            pins={marker ? [{ id: 'picked', lat: marker.lat, lng: marker.lng }] : []}
            onPressMap={(lat, lng) => setMarker({ lat, lng })}
          />

          {/* 底部：提示 + 按鈕 */}
          <View className="px-5 py-4 border-t border-line dark:border-dark-line">
            <Text className="text-muted dark:text-dark-muted text-[12px] mb-3">
              {marker
                ? `已選 ${marker.lat.toFixed(5)}, ${marker.lng.toFixed(5)}（可再點地圖調整）`
                : '點地圖任一處放置定位 pin'}
            </Text>
            <View className="flex-row justify-end gap-2.5">
              <Pressable
                onPress={onClose}
                className="px-4 py-2.5 rounded-[11px] border border-line dark:border-dark-line active:opacity-70"
              >
                <Text className="text-muted dark:text-dark-muted text-[13px] font-bold">取消</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!marker) return
                  onConfirm(marker.lat, marker.lng)
                  onClose()
                }}
                disabled={!marker}
                className="px-5 py-2.5 rounded-[11px] bg-accent dark:bg-dark-accent active:opacity-80 disabled:opacity-40"
              >
                <Text className="text-white text-[13px] font-bold">使用此位置</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}
