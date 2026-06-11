// 登入畫面：email + password → 呼叫 authService → 把 session 存進 store
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/useAuthStore'
import { ApiError } from '@/services/api'

const DEMO_EMAIL = 'demo@travel-app.com'
const DEMO_PASSWORD = 'demo1234'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setSession = useAuthStore((s) => s.setSession)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        email.trim(),
        password,
      )
      setSession({ user, accessToken, refreshToken })
      // 不用手動 router.replace；_layout 的 redirect 會帶走
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '登入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  function fillDemo() {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          {/* 品牌標題 */}
          <View className="items-center mb-10">
            <LinearGradient
              colors={['#ffadad', '#bdb2ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-16 h-16 rounded-[18px] items-center justify-center mb-4"
            >
              <Text className="text-ink text-3xl">✈</Text>
            </LinearGradient>
            <Text className="text-ink dark:text-dark-ink text-2xl font-black">我的旅遊 App</Text>
            <Text className="text-muted dark:text-dark-muted text-sm mt-1">登入以同步你的家庭行程</Text>
          </View>

          <View className="gap-3">
            <View>
              <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor="#8c89a8"
                className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[11px] px-3.5 py-3 text-ink dark:text-dark-ink text-[15px]"
              />
            </View>
            <View>
              <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">密碼</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
                placeholder="至少 8 個字"
                placeholderTextColor="#8c89a8"
                className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[11px] px-3.5 py-3 text-ink dark:text-dark-ink text-[15px]"
              />
            </View>

            {error && (
              <View className="bg-accent-2/15 px-3 py-2 rounded-[10px]">
                <Text className="text-accent-2 text-[13px]">{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleLogin}
              disabled={loading || !email || !password}
              className="bg-accent rounded-[13px] py-3.5 items-center mt-2 active:opacity-80 disabled:opacity-40"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-[15px]">登入</Text>
              )}
            </Pressable>

            <Pressable onPress={fillDemo} className="items-center py-2 active:opacity-60">
              <Text className="text-accent text-[13px] font-semibold underline">
                填入 demo 帳號
              </Text>
            </Pressable>
          </View>

          <View className="flex-row justify-center items-center gap-1 mt-8">
            <Text className="text-muted dark:text-dark-muted text-[13px]">還沒有帳號?</Text>
            <Link href="/(auth)/register" asChild>
              <Pressable className="active:opacity-60">
                <Text className="text-accent text-[13px] font-bold">註冊</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
