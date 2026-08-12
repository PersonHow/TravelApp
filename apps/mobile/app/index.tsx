// 進入點：依登入狀態導向（根 layout 會等 AsyncStorage 還原完才渲染到這裡）
import { Redirect } from 'expo-router'
import { useAuthStore } from '@/store/useAuthStore'

export default function Index() {
  const accessToken = useAuthStore((s) => s.accessToken)
  return <Redirect href={accessToken ? '/trips' : '/(auth)/login'} />
}
