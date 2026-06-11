// 用語 tab — 之後做（卡片 + 點開放大「給商家看」modal）
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MessageCircle } from 'lucide-react-native'

export default function PhrasesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg items-center justify-center px-6" edges={['top']}>
      <MessageCircle size={48} color="#caffbf" />
      <Text className="text-ink dark:text-dark-ink text-lg font-bold mt-4">用語</Text>
      <Text className="text-muted dark:text-dark-muted text-sm mt-2 text-center">
        即將推出:應對商家、問路常用語,點開可放大
      </Text>
    </SafeAreaView>
  )
}
