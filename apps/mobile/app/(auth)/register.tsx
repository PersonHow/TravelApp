// 註冊畫面：name + email + password
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
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/useAuthStore'
import { ApiError } from '@/services/api'

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setSession = useAuthStore((s) => s.setSession)

  async function handleRegister() {
    setError(null)
    setLoading(true)
    try {
      const { user, accessToken, refreshToken } = await authService.register(
        email.trim(),
        password,
        name.trim(),
      )
      setSession({ user, accessToken, refreshToken })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '註冊失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 px-6 justify-center">
          <View className="items-center mb-8">
            <Text className="text-ink dark:text-dark-ink text-2xl font-black">建立帳號</Text>
            <Text className="text-muted dark:text-dark-muted text-sm mt-1">註冊後可加入家庭一起規劃</Text>
          </View>

          <View className="gap-3">
            <View>
              <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">姓名</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="顯示給家人的名字"
                placeholderTextColor="#8c89a8"
                className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[11px] px-3.5 py-3 text-ink dark:text-dark-ink text-[15px]"
              />
            </View>
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
                autoComplete="new-password"
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
              onPress={handleRegister}
              disabled={loading || !email || !password || !name}
              className="bg-accent rounded-[13px] py-3.5 items-center mt-2 active:opacity-80 disabled:opacity-40"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-[15px]">註冊</Text>
              )}
            </Pressable>
          </View>

          <View className="flex-row justify-center items-center gap-1 mt-8">
            <Text className="text-muted dark:text-dark-muted text-[13px]">已有帳號?</Text>
            <Link href="/(auth)/login" asChild>
              <Pressable className="active:opacity-60">
                <Text className="text-accent text-[13px] font-bold">登入</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
