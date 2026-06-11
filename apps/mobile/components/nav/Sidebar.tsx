// 桌面版左側深色側欄(對應網頁版.html 的 .w-side)
//   ┌──────────────┐
//   │ ✈ 旅遊 App     │  品牌
//   │   {user.name} │
//   │                │
//   │ 目的地         │  使用者的 trips
//   │ ● 東京自由行  │
//   │                │
//   │ 瀏覽           │  5 個 nav
//   │ 🏠 首頁        │
//   │ 📅 行程        │  ← 選中:珊瑚紅底
//   │ ...           │
//   │                │
//   │ ─────────     │
//   │ 🌓 切換深色   │  暗色切換(placeholder)
//   │ 登出           │
//   └──────────────┘
import { useEffect } from 'react'
import { View, Text, Pressable, ScrollView } from 'react-native'
import { Link, usePathname } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Home,
  Calendar,
  MapPin,
  Navigation,
  MessageCircle,
  Sun,
  Moon,
  LogOut,
  type LucideIcon,
} from 'lucide-react-native'
import { useAuthStore } from '@/store/useAuthStore'
import { useTripStore } from '@/store/useTripStore'
import { useThemeStore } from '@/store/useThemeStore'
import { formatDateRange } from '@/utils/format'

const NAV_ITEMS: {
  href: '/' | '/schedule' | '/attractions' | '/transport' | '/phrases'
  label: string
  Icon: LucideIcon
}[] = [
  { href: '/', label: '首頁', Icon: Home },
  { href: '/schedule', label: '行程', Icon: Calendar },
  { href: '/attractions', label: '景點', Icon: MapPin },
  { href: '/transport', label: '交通住宿', Icon: Navigation },
  { href: '/phrases', label: '用語', Icon: MessageCircle },
]

// 沒有「每個 trip 對應的顏色」這個欄位,用 id hash 從色票挑一個
const TRIP_DOT_COLORS = ['#ffadad', '#a0c4ff', '#caffbf', '#ffc6ff', '#bdb2ff']
function dotColorFor(id: string) {
  const sum = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TRIP_DOT_COLORS[sum % TRIP_DOT_COLORS.length]
}

// 防禦性 path 比對:處理 trailing slash、空字串、(tabs)/index 等情況
function isActivePath(pathname: string, href: string): boolean {
  const clean = pathname.replace(/\/$/, '') || '/'
  if (href === '/') {
    return clean === '/' || clean === '' || clean === '/index'
  }
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
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { trips, currentTrip, loadDetail, loadTrips, clear: clearTrip } = useTripStore()
  const dark = useThemeStore((s) => s.dark)
  const toggleDark = useThemeStore((s) => s.toggle)
  const t = dark ? SIDEBAR_THEMES.dark : SIDEBAR_THEMES.light

  useEffect(() => {
    if (trips.length === 0) loadTrips()
  }, [trips.length, loadTrips])

  function handleLogout() {
    clearTrip()
    logout()
  }

  return (
    <View
      className="w-[264px] h-full flex-col"
      style={{ backgroundColor: t.bg, borderRightWidth: 1, borderRightColor: t.border }}
    >
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 22, flexGrow: 1 }}>
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

        {/* 目的地 (使用者所屬家庭的 trips) */}
        <Text
          style={{ color: t.textDim }}
          className="text-[10.5px] font-bold tracking-[0.12em] uppercase mt-4 mb-2 ml-2"
        >
          目的地
        </Text>
        <View className="gap-1">
          {trips.length === 0 && (
            <Text style={{ color: t.textDim }} className="text-xs px-2.5 py-2">
              尚無行程
            </Text>
          )}
          {trips.map((trip) => {
            const isActive = currentTrip?.id === trip.id
            return (
              <Pressable
                key={trip.id}
                onPress={() => loadDetail(trip.id)}
                className="flex-row items-center gap-2.5 px-2.5 py-2 rounded-[10px] active:opacity-70"
                style={isActive ? { backgroundColor: t.dividerBg } : undefined}
              >
                <View
                  className="w-[9px] h-[9px] rounded-full"
                  style={{ backgroundColor: dotColorFor(trip.id) }}
                />
                <Text
                  style={{ color: isActive ? t.text : t.textDim }}
                  className="text-sm font-semibold flex-1"
                  numberOfLines={1}
                >
                  {trip.title}
                </Text>
                <Text style={{ color: t.textDim }} className="text-[10.5px]">
                  {formatDateRange(trip.startDate, trip.endDate)}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* 瀏覽 (5 個 nav) */}
        <Text
          style={{ color: t.textDim }}
          className="text-[10.5px] font-bold tracking-[0.12em] uppercase mt-5 mb-2 ml-2"
        >
          瀏覽
        </Text>
        <View className="gap-[3px]">
          {NAV_ITEMS.map((item) => {
            const isActive = isActivePath(pathname, item.href)
            const { Icon } = item
            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable
                  className="flex-row items-center gap-2.5 px-3 py-2.5 rounded-[10px] active:opacity-80 overflow-hidden"
                  style={
                    isActive
                      ? {
                          shadowColor: t.activeShadow,
                          shadowOpacity: dark ? 0.42 : 0.55,
                          shadowOffset: { width: 0, height: 6 },
                          shadowRadius: 22,
                        }
                      : undefined
                  }
                >
                  {isActive && (
                    <LinearGradient
                      colors={t.activeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: 10,
                      }}
                    />
                  )}
                  <View style={{ zIndex: 1 }}>
                    <Icon
                      key={isActive ? 'on' : 'off'}
                      size={16}
                      color={isActive ? t.activeInk : t.iconInactive}
                    />
                  </View>
                  <Text
                    style={{
                      zIndex: 1,
                      color: isActive ? t.activeInk : t.iconInactive,
                    }}
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
          {dark ? <Sun size={14} color={t.iconInactive} /> : <Moon size={14} color={t.iconInactive} />}
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
