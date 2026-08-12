// 旅程總覽：登入後的首頁
// 顯示所有旅程卡片（進行中排最前），點卡片進入該旅程；右上進「我的」
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Map, Plus, User } from 'lucide-react-native'
import { useAuthStore } from '@/store/useAuthStore'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { TripFormModal } from '@/components/trip/TripFormModal'
import { formatDateRange, tripLengthDays } from '@/utils/format'
import { isOngoing, sortTripsByRelevance } from '@/utils/tripSort'

// 卡片左側色點：沒有 per-trip 顏色欄位，用 id hash 從色票挑
const TRIP_DOT_COLORS = ['#ffadad', '#a0c4ff', '#caffbf', '#ffc6ff', '#bdb2ff']
function dotColorFor(id: string) {
  const sum = [...id].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return TRIP_DOT_COLORS[sum % TRIP_DOT_COLORS.length]
}

export default function TripsScreen() {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const user = useAuthStore((s) => s.user)
  const { trips, loading, error, loadTrips } = useTripStore()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  const now = new Date()
  const sorted = sortTripsByRelevance(trips, now)

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 34 : 10,
          paddingBottom: 60,
          maxWidth: 920,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 頂列：歡迎 + 我的 */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-muted dark:text-dark-muted text-xs">歡迎回來</Text>
            <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
              {user?.name ?? '旅人'}的旅程
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/profile')}
            className="w-10 h-10 rounded-full bg-surface dark:bg-dark-surface border border-line dark:border-dark-line items-center justify-center active:opacity-70"
          >
            <User size={17} color="#8c89a8" />
          </Pressable>
        </View>

        {loading && trips.length === 0 && (
          <View className="items-center mt-20">
            <ActivityIndicator color="#6c7bd6" />
            <Text className="text-muted dark:text-dark-muted text-xs mt-3">載入旅程中...</Text>
          </View>
        )}

        {error && (
          <View className="bg-accent-2/15 p-4 rounded-card mt-4">
            <Text className="text-accent-2 font-bold">載入失敗</Text>
            <Text className="text-accent-2 text-xs mt-1">{error}</Text>
          </View>
        )}

        {!loading && trips.length === 0 && !error && (
          <View className="items-center mt-16 px-6">
            <Map size={42} color="#bdb2ff" />
            <Text className="text-ink dark:text-dark-ink text-base font-bold mt-4">
              還沒有任何旅程
            </Text>
            <Text className="text-muted dark:text-dark-muted text-xs mt-2 text-center">
              建立第一筆旅程，開始安排行程、航班與住宿。
            </Text>
          </View>
        )}

        {/* 旅程卡片：桌面兩欄、手機單欄 */}
        <View className={`mt-6 ${isDesktop ? 'flex-row flex-wrap' : ''}`} style={{ gap: 12 }}>
          {sorted.map((trip) => {
            const ongoing = isOngoing(trip, now)
            return (
              <Pressable
                key={trip.id}
                onPress={() => router.push(`/trip/${trip.id}`)}
                className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] p-4 active:opacity-70"
                style={isDesktop ? { flexBasis: '48%', flexGrow: 1 } : undefined}
              >
                <View className="flex-row items-center gap-2.5">
                  <View
                    className="w-[10px] h-[10px] rounded-full"
                    style={{ backgroundColor: dotColorFor(trip.id) }}
                  />
                  <Text
                    className="text-ink dark:text-dark-ink text-[16.5px] font-extrabold flex-1"
                    numberOfLines={1}
                  >
                    {trip.title}
                  </Text>
                  {ongoing && (
                    <View className="bg-accent-soft rounded-full px-2 py-0.5">
                      <Text className="text-accent text-[10px] font-extrabold">進行中</Text>
                    </View>
                  )}
                </View>
                <Text className="text-muted dark:text-dark-muted text-[12.5px] mt-2">
                  {formatDateRange(trip.startDate, trip.endDate)} ·{' '}
                  {tripLengthDays(trip.startDate, trip.endDate)} 天
                </Text>
              </Pressable>
            )
          })}

          {/* 建立旅程 */}
          <Pressable
            onPress={() => setCreating(true)}
            className="border border-dashed border-line dark:border-dark-line rounded-[16px] p-4 items-center justify-center flex-row gap-2 active:opacity-70"
            style={isDesktop ? { flexBasis: '48%', flexGrow: 1, minHeight: 76 } : { minHeight: 64 }}
          >
            <Plus size={16} color="#6c7bd6" />
            <Text className="text-accent text-[14.5px] font-bold">建立旅程</Text>
          </Pressable>
        </View>
      </ScrollView>

      <TripFormModal
        visible={creating}
        onClose={() => setCreating(false)}
        trip={null}
        onCreated={(id) => router.push(`/trip/${id}`)}
      />
    </SafeAreaView>
  )
}
