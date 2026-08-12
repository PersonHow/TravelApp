// 內嵌地圖（Web 降級版）：react-native-maps 不支援 Web，先顯示提示
// Metro 平台解析：原生載 MapCanvas.native.tsx，這份只有 Web 會用到
// ⚠️ props 介面必須與 MapCanvas.native.tsx 保持一致
import { Text, View } from 'react-native'
import { MapPin } from 'lucide-react-native'
import type { StyleProp, ViewStyle } from 'react-native'

export interface MapPinData {
  id: string
  lat: number
  lng: number
  title?: string
  color?: string
}

export interface MapCanvasProps {
  center: { lat: number; lng: number }
  zoomDelta?: number
  pins: MapPinData[]
  onPressMap?: (lat: number, lng: number) => void
  onPressPin?: (id: string) => void
  style?: StyleProp<ViewStyle>
}

export function MapCanvas({ style }: MapCanvasProps) {
  return (
    <View
      style={style}
      className="items-center justify-center bg-surface-2 dark:bg-dark-surface-2 rounded-[16px] border border-line dark:border-dark-line"
    >
      <MapPin size={32} color="#a0c4ff" />
      <Text className="text-muted dark:text-dark-muted text-[13px] mt-3 text-center px-6">
        網頁版內嵌地圖尚未支援{'\n'}請在手機 App 使用，或點「在 Google 地圖開啟」
      </Text>
    </View>
  )
}
