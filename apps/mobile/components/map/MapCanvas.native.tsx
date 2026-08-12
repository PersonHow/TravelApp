// 內嵌地圖（原生版）：react-native-maps
// Expo Go 可直接跑（iOS 用 Apple 圖層、Android 用 Google 圖層）；
// 正式 build 的 Google 圖層金鑰在 app.config.ts 設定
// ⚠️ props 介面必須與 MapCanvas.tsx（Web 降級版）保持一致
import MapView, { Marker } from 'react-native-maps'
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
  // 緯度跨度，越小越近（預設 0.05 ≈ 城市街區）
  zoomDelta?: number
  pins: MapPinData[]
  onPressMap?: (lat: number, lng: number) => void
  onPressPin?: (id: string) => void
  style?: StyleProp<ViewStyle>
}

export function MapCanvas({
  center,
  zoomDelta = 0.05,
  pins,
  onPressMap,
  onPressPin,
  style,
}: MapCanvasProps) {
  return (
    <MapView
      style={style}
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: zoomDelta,
        longitudeDelta: zoomDelta,
      }}
      onPress={(e) =>
        onPressMap?.(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)
      }
    >
      {pins.map((p) => (
        <Marker
          key={p.id}
          coordinate={{ latitude: p.lat, longitude: p.lng }}
          title={p.title}
          pinColor={p.color}
          onCalloutPress={() => onPressPin?.(p.id)}
        />
      ))}
    </MapView>
  )
}
