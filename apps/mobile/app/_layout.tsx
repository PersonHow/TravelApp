// 根層級 layout：載入 NativeWind、處理「已登入/未登入」的路由保護
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import { useAuthStore } from '@/store/useAuthStore'
import { useThemeStore } from '@/store/useThemeStore'
import '../global.css'

// 沒登入卻在受保護區 → 踢回 /login；登入了卻在 /login → 踢進 tabs
function useAuthRedirect() {
  const router = useRouter()
  const segments = useSegments()
  const accessToken = useAuthStore((s) => s.accessToken)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  useEffect(() => {
    if (!hasHydrated) return
    const inAuthGroup = segments[0] === '(auth)'
    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (accessToken && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [accessToken, hasHydrated, segments, router])
}

// 把 themeStore 的 dark 偏好同步到 NativeWind 的 colorScheme
function useThemeSync() {
  const dark = useThemeStore((s) => s.dark)
  const themeHydrated = useThemeStore((s) => s.hasHydrated)
  const { setColorScheme } = useColorScheme()
  useEffect(() => {
    if (!themeHydrated) return
    setColorScheme(dark ? 'dark' : 'light')
  }, [dark, themeHydrated, setColorScheme])
}

export default function RootLayout() {
  useAuthRedirect()
  useThemeSync()
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const themeHydrated = useThemeStore((s) => s.hasHydrated)
  const dark = useThemeStore((s) => s.dark)
  // 等 AsyncStorage 還原完才渲染，避免閃一下未登入畫面或主題不對
  if (!hasHydrated || !themeHydrated) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
