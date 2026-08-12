// 旅程範圍的 layout：進入時載入該旅程 detail，載好前先顯示 spinner
//  - 窄螢幕 (< 860px) → 頂部返回列 + 底部 5 tab（只顯示 icon）
//  - 寬螢幕 (>= 860px) → 左側深色側欄 + 右側內容區
import { useEffect } from 'react'
import { Tabs, Slot, useLocalSearchParams, useRouter } from 'expo-router'
import { View, Text, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Home,
  Calendar,
  Map,
  MapPin,
  Navigation,
  MessageCircle,
} from 'lucide-react-native'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useThemeStore } from '@/store/useThemeStore'
import { useTripStore } from '@/store/useTripStore'
import { Sidebar } from '@/components/nav/Sidebar'

const ACCENT_LIGHT = '#6c7bd6'
const ACCENT_DARK = '#a8c0ff'
const MUTED_LIGHT = '#8c89a8'
const MUTED_DARK = '#a39fc8'

export default function TripLayout() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const dark = useThemeStore((s) => s.dark)
  const { currentTrip, error, loadDetail } = useTripStore()

  useEffect(() => {
    if (id && useTripStore.getState().currentTrip?.id !== id) loadDetail(id)
  }, [id, loadDetail])

  // detail 還沒載好（或還停在上一個旅程的資料）先擋住，子頁一律拿到正確的 currentTrip
  const ready = currentTrip?.id === id
  if (!ready) {
    return (
      <SafeAreaView
        className="flex-1 bg-bg dark:bg-dark-bg items-center justify-center px-6"
        edges={['top']}
      >
        {error ? (
          <>
            <Text className="text-muted dark:text-dark-muted text-sm">{error}</Text>
            <Pressable
              onPress={() => router.replace('/trips')}
              className="mt-4 px-4 py-2 rounded-full border border-line dark:border-dark-line active:opacity-70"
            >
              <Text className="text-accent text-[13px] font-bold">回旅程總覽</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color="#6c7bd6" />
        )}
      </SafeAreaView>
    )
  }

  // 桌面：左側側欄 + 內容
  if (isDesktop) {
    return (
      <View className="flex-1 flex-row bg-bg dark:bg-dark-bg">
        <Sidebar />
        <View className="flex-1">
          <Slot />
        </View>
      </View>
    )
  }

  // 手機：返回列 + 底部 tab
  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg" edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 py-2.5 border-b border-line dark:border-dark-line">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/trips'))}
          className="p-1.5 rounded-full active:opacity-60"
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#8c89a8" />
        </Pressable>
        <Text
          className="text-ink dark:text-dark-ink text-[16px] font-extrabold flex-1"
          numberOfLines={1}
        >
          {currentTrip.title}
        </Text>
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: dark ? ACCENT_DARK : ACCENT_LIGHT,
          tabBarInactiveTintColor: dark ? MUTED_DARK : MUTED_LIGHT,
          tabBarShowLabel: false,
          tabBarStyle: {
            borderTopColor: dark ? '#332e58' : '#ececf6',
            backgroundColor: dark ? '#211e3cee' : '#ffffffee',
            paddingTop: 6,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: '總覽', tabBarIcon: ({ color }) => <Home size={20} color={color} /> }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: '行程',
            tabBarIcon: ({ color }) => <Calendar size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="attractions"
          options={{ title: '景點', tabBarIcon: ({ color }) => <MapPin size={20} color={color} /> }}
        />
        <Tabs.Screen
          name="map"
          options={{ title: '地圖', tabBarIcon: ({ color }) => <Map size={20} color={color} /> }}
        />
        <Tabs.Screen
          name="transport"
          options={{
            title: '交通住宿',
            tabBarIcon: ({ color }) => <Navigation size={20} color={color} />,
          }}
        />
        <Tabs.Screen
          name="phrases"
          options={{
            title: '用語',
            tabBarIcon: ({ color }) => <MessageCircle size={20} color={color} />,
          }}
        />
        {/* 航班詳細頁:走 tab 內容區但不出現在 tab bar */}
        <Tabs.Screen name="flight/[flightId]" options={{ href: null }} />
      </Tabs>
    </SafeAreaView>
  )
}
