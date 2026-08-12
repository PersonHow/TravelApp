// 桌面版左側深色側欄（旅程範圍內使用，掛在 trip/[id]/_layout）
//   ┌──────────────┐
//   │ ✈ 旅遊 App     │  品牌
//   │   {user.name} │
//   │                │
//   │ ← 所有旅程     │  回總覽
//   │ ● 東京自由行  │  目前旅程
//   │   7/1 – 7/5   │
//   │                │
//   │ 瀏覽           │  5 個 nav（滑動藥丸高亮）
//   │ 🏠 總覽        │
//   │ 📅 行程        │
//   │ ...           │
//   │ ─────────     │
//   │ 🌓 切換深色   │
//   │ 登出           │
//   └──────────────┘
import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, Animated } from 'react-native'
import { Link, usePathname, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Home,
  Calendar,
  Map,
  MapPin,
  Navigation,
  MessageCircle,
  Sun,
  Moon,
  LogOut,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react-native'
import { useAuthStore } from '@/store/useAuthStore'
import { useTripStore } from '@/store/useTripStore'
import { useThemeStore } from '@/store/useThemeStore'
import { formatDateRange } from '@/utils/format'

// nav 項目：href 依目前旅程 id 組出來
const NAV_ITEMS: {
  suffix: '' | '/schedule' | '/attractions' | '/map' | '/transport' | '/phrases'
  label: string
  Icon: LucideIcon
}[] = [
  { suffix: '', label: '總覽', Icon: Home },
  { suffix: '/schedule', label: '行程', Icon: Calendar },
  { suffix: '/attractions', label: '景點', Icon: MapPin },
  { suffix: '/map', label: '地圖', Icon: Map },
  { suffix: '/transport', label: '交通住宿', Icon: Navigation },
  { suffix: '/phrases', label: '用語', Icon: MessageCircle },
]

// 沒有「每個 trip 對應的顏色」這個欄位,用 id hash 從色票挑一個
const TRIP_DOT_COLORS = ['#ffadad', '#a0c4ff', '#caffbf', '#ffc6ff', '#bdb2ff']
function dotColorFor(id: string) {
  const sum = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TRIP_DOT_COLORS[sum % TRIP_DOT_COLORS.length]
}

// 防禦性 path 比對:處理 trailing slash;總覽（suffix 空字串）要求完全相等
function isActivePath(pathname: string, href: string, isIndex: boolean): boolean {
  const clean = pathname.replace(/\/$/, '') || '/'
  if (isIndex) return clean === href
  return clean === href || clean.startsWith(href + '/')
}

// 深/淺色的 sidebar 配色 + 選中漸層
const SIDEBAR_THEMES = {
  light: {
    bg: '#ffffff',
    border: '#ececf6',
    text: '#322f54',
    textDim: '#8c89a8',
    activeGradient: ['#ffc6ff', '#bdb2ff'] as [string, string], // 紫粉色:在白底上看起來像高光標籤
    activeShadow: '#bdb2ff',
    activeInk: '#322f54',
    iconInactive: '#5a5780',
    dividerBg: 'rgba(50,47,84,0.08)',
  },
  dark: {
    bg: '#1c1a35',
    border: '#332e58',
    text: '#dcd9f0',
    textDim: '#908cba',
    activeGradient: ['#ffd6a5', '#fdffb6'] as [string, string], // 橘黃漸層:夜裡像一盞暖燈
    activeShadow: '#ffb45a',
    activeInk: '#322f54',
    iconInactive: '#dcd9f0',
    dividerBg: 'rgba(255,255,255,0.08)',
  },
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { currentTrip, clear: clearTrip } = useTripStore()
  const dark = useThemeStore((s) => s.dark)
  const toggleDark = useThemeStore((s) => s.toggle)
  const t = dark ? SIDEBAR_THEMES.dark : SIDEBAR_THEMES.light

  function handleLogout() {
    clearTrip()
    logout()
  }

  // 選中高亮為單一「滑動藥丸」:記錄每個 nav 項目的 y/高度,切換路由時 spring 滑過去
  const navLayouts = useRef<Record<string, { y: number; height: number }>>({})
  const [layoutTick, setLayoutTick] = useState(0) // onLayout 後觸發 effect 重新定位
  const pillTop = useRef(new Animated.Value(0)).current
  const pillHeight = useRef(new Animated.Value(0)).current
  const pillOpacity = useRef(new Animated.Value(0)).current
  const pillPlaced = useRef(false)

  const tripId = currentTrip?.id ?? ''
  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    href: `/trip/${tripId}${item.suffix}` as const,
    isIndex: item.suffix === '',
  }))
  const activeHref = navItems.find((item) => isActivePath(pathname, item.href, item.isIndex))?.href

  useEffect(() => {
    const layout = activeHref ? navLayouts.current[activeHref] : undefined
    if (!layout) {
      Animated.timing(pillOpacity, { toValue: 0, duration: 150, useNativeDriver: false }).start()
      return
    }
    if (!pillPlaced.current) {
      // 首次直接定位,不做滑入動畫
      pillTop.setValue(layout.y)
      pillHeight.setValue(layout.height)
      pillOpacity.setValue(1)
      pillPlaced.current = true
      return
    }
    Animated.parallel([
      Animated.spring(pillTop, {
        toValue: layout.y,
        stiffness: 260,
        damping: 26,
        mass: 1,
        useNativeDriver: false,
      }),
      Animated.spring(pillHeight, {
        toValue: layout.height,
        stiffness: 260,
        damping: 26,
        mass: 1,
        useNativeDriver: false,
      }),
      Animated.timing(pillOpacity, { toValue: 1, duration: 150, useNativeDriver: false }),
    ]).start()
  }, [activeHref, layoutTick, pillTop, pillHeight, pillOpacity])

  return (
    <View
      className="w-[264px] h-full flex-col"
      style={{ backgroundColor: t.bg, borderRightWidth: 1, borderRightColor: t.border }}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 22, flexGrow: 1 }}
      >
        {/* 品牌 */}
        <View className="flex-row items-center gap-2.5 px-1.5 pb-[18px]">
          <LinearGradient
            colors={['#ffadad', '#bdb2ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-[38px] h-[38px] rounded-[11px] items-center justify-center"
          >
            <Text className="text-[#322f54] text-[19px]">✈</Text>
          </LinearGradient>
          <View className="flex-1">
            <Text style={{ color: t.text }} className="text-[17px] font-black tracking-wide">
              旅遊 App
            </Text>
            <Text style={{ color: t.textDim }} className="text-[11px] mt-0.5" numberOfLines={1}>
              {user?.name ? `${user.name}的旅遊手冊` : '我的旅遊手冊'}
            </Text>
          </View>
        </View>

        {/* 回旅程總覽 + 目前旅程 */}
        <Pressable
          onPress={() => router.replace('/trips')}
          className="flex-row items-center gap-2 px-2.5 py-2 rounded-[10px] active:opacity-70"
        >
          <ArrowLeft size={14} color={t.textDim} />
          <Text style={{ color: t.textDim }} className="text-[13px] font-bold">
            所有旅程
          </Text>
        </Pressable>
        {currentTrip && (
          <View
            className="flex-row items-center gap-2.5 px-2.5 py-2.5 rounded-[10px] mt-1"
            style={{ backgroundColor: t.dividerBg }}
          >
            <View
              className="w-[9px] h-[9px] rounded-full"
              style={{ backgroundColor: dotColorFor(currentTrip.id) }}
            />
            <View className="flex-1">
              <Text style={{ color: t.text }} className="text-sm font-semibold" numberOfLines={1}>
                {currentTrip.title}
              </Text>
              <Text style={{ color: t.textDim }} className="text-[10.5px] mt-0.5">
                {formatDateRange(currentTrip.startDate, currentTrip.endDate)}
              </Text>
            </View>
          </View>
        )}

        {/* 瀏覽 (5 個 nav) */}
        <Text
          style={{ color: t.textDim }}
          className="text-[10.5px] font-bold tracking-[0.12em] uppercase mt-5 mb-2 ml-2"
        >
          瀏覽
        </Text>
        <View className="gap-[3px]" style={{ position: 'relative' }}>
          {/* 滑動藥丸:唯一的選中背景,切換 nav 時滑到新位置 */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: pillTop,
              height: pillHeight,
              opacity: pillOpacity,
              borderRadius: 10,
              shadowColor: t.activeShadow,
              shadowOpacity: dark ? 0.42 : 0.55,
              shadowOffset: { width: 0, height: 6 },
              shadowRadius: 22,
            }}
          >
            <LinearGradient
              colors={t.activeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, borderRadius: 10 }}
            />
          </Animated.View>
          {navItems.map((item) => {
            const isActive = item.href === activeHref
            const { Icon } = item
            return (
              <Link key={item.suffix} href={item.href} asChild>
                <Pressable
                  className="flex-row items-center gap-2.5 px-3 py-2.5 rounded-[10px] active:opacity-80"
                  onLayout={(e) => {
                    const { y, height } = e.nativeEvent.layout
                    navLayouts.current[item.href] = { y, height }
                    setLayoutTick((n) => n + 1)
                  }}
                >
                  <Icon
                    key={isActive ? 'on' : 'off'}
                    size={16}
                    color={isActive ? t.activeInk : t.iconInactive}
                  />
                  <Text
                    style={{ color: isActive ? t.activeInk : t.iconInactive }}
                    className={`text-[14.5px] ${isActive ? 'font-bold' : 'font-medium'}`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </Link>
            )
          })}
        </View>
      </ScrollView>

      {/* 底部:暗色切換 + 登出 */}
      <View
        className="px-4 pt-3 pb-5 gap-2"
        style={{ borderTopWidth: 1, borderTopColor: t.dividerBg }}
      >
        <Pressable
          onPress={toggleDark}
          className="flex-row items-center gap-2.5 px-3 py-2.5 rounded-[10px] active:opacity-70"
          style={{ borderWidth: 1, borderColor: t.dividerBg }}
        >
          {dark ? (
            <Sun size={14} color={t.iconInactive} />
          ) : (
            <Moon size={14} color={t.iconInactive} />
          )}
          <Text style={{ color: t.iconInactive }} className="text-[13px] font-semibold">
            {dark ? '切換淺色' : '切換深色'}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleLogout}
          className="flex-row items-center gap-2.5 px-3 py-2 rounded-[10px] active:opacity-70"
        >
          <LogOut size={13} color={t.textDim} />
          <Text style={{ color: t.textDim }} className="text-xs font-semibold">
            登出
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
