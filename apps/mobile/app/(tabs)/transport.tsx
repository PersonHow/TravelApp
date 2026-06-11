// 交通住宿 tab — 之後做（航班 / 飯店 / 大眾運輸時刻表）
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Navigation } from 'lucide-react-native'

export default function TransportScreen() {
  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg items-center justify-center px-6" edges={['top']}>
      <Navigation size={48} color="#a0c4ff" />
      <Text className="text-ink dark:text-dark-ink text-lg font-bold mt-4">交通住宿</Text>
      <Text className="text-muted dark:text-dark-muted text-sm mt-2 text-center">
        即將推出:航班、飯店明細,以及大眾運輸時刻表
      </Text>
    </SafeAreaView>
  )
}
