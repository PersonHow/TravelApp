// 響應式 layout：
//  - 窄螢幕 (< 860px,手機/平板直立) → 底部 5 tab(對應 v2 設計)
//  - 寬螢幕 (>= 860px,瀏覽器/平板橫向) → 頂部 nav bar(對應網頁版.html 慣例)
import { Tabs, Slot } from 'expo-router'
import { View } from 'react-native'
import { Home, Calendar, MapPin, Navigation, MessageCircle } from 'lucide-react-native'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useThemeStore } from '@/store/useThemeStore'
import { Sidebar } from '@/components/nav/Sidebar'

const ACCENT_LIGHT = '#6c7bd6'
const ACCENT_DARK = '#a8c0ff'
const MUTED_LIGHT = '#8c89a8'
const MUTED_DARK = '#a39fc8'

export default function TabsLayout() {
  const isDesktop = useIsDesktop()
  const dark = useThemeStore((s) => s.dark)

  // 桌面:左側深色側欄(對應網頁版.html 設計)+ 右側內容區
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

  // 手機:底部 5 tab(顏色/底色隨深色切換)
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? ACCENT_DARK : ACCENT_LIGHT,
        tabBarInactiveTintColor: dark ? MUTED_DARK : MUTED_LIGHT,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        tabBarStyle: {
          borderTopColor: dark ? '#332e58' : '#ececf6',
          backgroundColor: dark ? '#211e3cee' : '#ffffffee',
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '首頁',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
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
        options={{
          title: '景點',
          tabBarIcon: ({ color }) => <MapPin size={20} color={color} />,
        }}
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
    </Tabs>
  )
}
