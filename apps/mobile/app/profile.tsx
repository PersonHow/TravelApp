// 我的：使用者資訊、深色模式、登出（從旅程總覽右上進入）
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, LogOut, Moon, Sun } from 'lucide-react-native'
import { useAuthStore } from '@/store/useAuthStore'
import { useTripStore } from '@/store/useTripStore'
import { useThemeStore } from '@/store/useThemeStore'
import { FamilyManager } from '@/components/family/FamilyManager'

export default function ProfileScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const clearTrip = useTripStore((s) => s.clear)
  const dark = useThemeStore((s) => s.dark)
  const toggleDark = useThemeStore((s) => s.toggle)

  function handleLogout() {
    clearTrip()
    logout()
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg" edges={['top']}>
      {/* 返回列（root Stack 關掉了 header） */}
      <View className="flex-row items-center gap-2 px-4 py-2.5 border-b border-line dark:border-dark-line">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/trips'))}
          className="p-1.5 rounded-full active:opacity-60"
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#8c89a8" />
        </Pressable>
        <Text className="text-ink dark:text-dark-ink text-[16px] font-extrabold">我的</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
          maxWidth: 640,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 使用者卡片 */}
        <View className="flex-row items-center gap-3.5 bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] p-4">
          <View className="w-[52px] h-[52px] rounded-full bg-accent-soft items-center justify-center">
            <Text className="text-[22px]">🧳</Text>
          </View>
          <View className="flex-1">
            <Text className="text-ink dark:text-dark-ink text-[17px] font-extrabold">
              {user?.name ?? '旅人'}
            </Text>
            <Text className="text-muted dark:text-dark-muted text-[12.5px] mt-0.5">
              {user?.email}
            </Text>
          </View>
        </View>

        {/* 家庭管理 */}
        <Text className="text-muted dark:text-dark-muted text-[11px] font-bold tracking-[0.12em] uppercase mt-7 mb-2 ml-1">
          我的家庭
        </Text>
        <FamilyManager />

        {/* 設定 */}
        <Text className="text-muted dark:text-dark-muted text-[11px] font-bold tracking-[0.12em] uppercase mt-7 mb-2 ml-1">
          設定
        </Text>
        <View className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] overflow-hidden">
          <Pressable
            onPress={toggleDark}
            className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70"
          >
            {dark ? <Sun size={16} color="#8c89a8" /> : <Moon size={16} color="#8c89a8" />}
            <Text className="text-ink dark:text-dark-ink text-[14.5px] font-semibold flex-1">
              {dark ? '切換淺色模式' : '切換深色模式'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleLogout}
            className="flex-row items-center gap-3 px-4 py-3.5 border-t border-line dark:border-dark-line active:opacity-70"
          >
            <LogOut size={16} color="#ef7a8e" />
            <Text className="text-accent-2 text-[14.5px] font-semibold flex-1">登出</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
