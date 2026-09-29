// 內嵌地圖（Web 版）：Maps JavaScript API，動態載入 script（只載一次，多個地圖共用）
// 金鑰讀 EXPO_PUBLIC_GOOGLE_MAPS_API_KEY，未設定時顯示提示不 crash
// Metro 平台解析：原生載 MapCanvas.native.tsx，這份只有 Web 會用到
// ⚠️ props 介面必須與 MapCanvas.native.tsx 保持一致
import { useEffect, useRef, useState } from 'react'
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
  // 緯度跨度，越小越近（預設 0.05 ≈ 城市街區）
  zoomDelta?: number
  pins: MapPinData[]
  onPressMap?: (lat: number, lng: number) => void
  onPressPin?: (id: string) => void
  style?: StyleProp<ViewStyle>
}

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

// Maps JavaScript API 沒裝型別套件，以用到的最小介面表示
interface GLatLng {
  lat(): number
  lng(): number
}
interface GMap {
  addListener(ev: 'click', cb: (e: { latLng?: GLatLng }) => void): void
}
interface GMarker {
  setMap(map: GMap | null): void
  addListener(ev: 'click', cb: () => void): void
}
interface GMapsApi {
  Map: new (el: HTMLElement, opts: object) => GMap
  Marker: new (opts: object) => GMarker
  SymbolPath: { CIRCLE: number }
}

// script 只插入一次，之後的呼叫共用同一個 Promise
let gmapsLoader: Promise<GMapsApi> | null = null
function loadGoogleMaps(): Promise<GMapsApi> {
  if (gmapsLoader) return gmapsLoader
  gmapsLoader = new Promise((resolve, reject) => {
    const w = window as unknown as Record<string, unknown> & { google?: { maps?: GMapsApi } }
    if (w.google?.maps) return resolve(w.google.maps)
    w.__gmapsReady = () => resolve(w.google!.maps!)
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&loading=async&callback=__gmapsReady`
    script.onerror = () => reject(new Error('Google Maps 載入失敗'))
    document.head.appendChild(script)
  })
  return gmapsLoader
}

// 緯度跨度 → Maps JS 的 zoom level（近似換算即可）
function deltaToZoom(delta: number): number {
  return Math.min(18, Math.max(3, Math.round(Math.log2(360 / delta))))
}

export function MapCanvas({
  center,
  zoomDelta = 0.05,
  pins,
  onPressMap,
  onPressPin,
  style,
}: MapCanvasProps) {
  // RN-Web 的 View ref 就是底層 DOM 節點，拿來當地圖容器
  const hostRef = useRef<View>(null)
  const mapRef = useRef<GMap | null>(null)
  const markersRef = useRef<GMarker[]>([])
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  // 回呼放 ref，地圖初始化只做一次也能拿到最新的 handler
  const onPressMapRef = useRef(onPressMap)
  const onPressPinRef = useRef(onPressPin)
  onPressMapRef.current = onPressMap
  onPressPinRef.current = onPressPin

  // 初始化地圖（center/zoomDelta 只當起始值，與原生 initialRegion 同語意）
  useEffect(() => {
    if (!API_KEY) return
    let cancelled = false
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !hostRef.current) return
        const el = hostRef.current as unknown as HTMLElement
        const map = new maps.Map(el, {
          center: { lat: center.lat, lng: center.lng },
          zoom: deltaToZoom(zoomDelta),
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        })
        map.addListener('click', (e) => {
          if (e.latLng) onPressMapRef.current?.(e.latLng.lat(), e.latLng.lng())
        })
        mapRef.current = map
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // pins 同步：整批重畫（數量少，不做差異更新）
  useEffect(() => {
    const w = window as unknown as { google?: { maps?: GMapsApi } }
    const maps = w.google?.maps
    const map = mapRef.current
    if (!ready || !maps || !map) return
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = pins.map((p) => {
      const marker = new maps.Marker({
        map,
        position: { lat: p.lat, lng: p.lng },
        title: p.title,
        icon: {
          path: maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: p.color ?? '#e63946',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      })
      marker.addListener('click', () => onPressPinRef.current?.(p.id))
      return marker
    })
  }, [pins, ready])

  // 沒金鑰或載入失敗：顯示提示不 crash
  if (!API_KEY || failed) {
    return (
      <View
        style={style}
        className="items-center justify-center bg-surface-2 dark:bg-dark-surface-2 rounded-[16px] border border-line dark:border-dark-line"
      >
        <MapPin size={32} color="#a0c4ff" />
        <Text className="text-muted dark:text-dark-muted text-[13px] mt-3 text-center px-6">
          {failed
            ? '地圖載入失敗，請檢查金鑰的網域限制（HTTP referrer）'
            : '尚未設定 EXPO_PUBLIC_GOOGLE_MAPS_API_KEY\n填入金鑰後重啟 expo start 即可顯示地圖'}
        </Text>
      </View>
    )
  }

  return <View ref={hostRef} style={style} />
}
