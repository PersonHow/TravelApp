// 首頁 Home tab：對應 v2 設計的「Hero + Day rows + Flights + Hotels」
// 響應式：窄螢幕單欄、寬螢幕內容置中限寬 + Day rows 3 欄
import { useEffect } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Sun, Moon, Map } from 'lucide-react-native'
import { useAuthStore } from '@/store/useAuthStore'
import { useTripStore } from '@/store/useTripStore'
import { useThemeStore } from '@/store/useThemeStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { HeroCard } from '@/components/trip/HeroCard'
import { DayRow } from '@/components/trip/DayRow'
import { FlightCard } from '@/components/trip/FlightCard'
import { HotelCard } from '@/components/trip/HotelCard'

export default function HomeScreen() {
  const isDesktop = useIsDesktop()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const clearTrip = useTripStore((s) => s.clear)
  const dark = useThemeStore((s) => s.dark)
  const toggleDark = useThemeStore((s) => s.toggle)
  const { currentTrip, loading, error, loadTrips } = useTripStore()

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  function handleLogout() {
    clearTrip()
    logout()
  }

  const totalActivities =
    currentTrip?.tripDays.reduce((sum, d) => sum + d.activities.length, 0) ?? 0
  const outbound = currentTrip?.flights.find(
    (f) => f.departureAirport === 'TPE' || f.flightNumber.endsWith('100'),
  )
  const returning = currentTrip?.flights.find((f) => f !== outbound)

  return (
    <SafeAreaView className="flex-1 bg-bg dark:bg-dark-bg" edges={isDesktop ? [] : ['top']}>
      {/* 窄螢幕才顯示頂列(寬螢幕由 Sidebar 提供) */}
      {!isDesktop && (
        <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
          <View>
            <Text className="text-muted dark:text-dark-muted text-xs">歡迎回來</Text>
            <Text className="text-ink dark:text-dark-ink text-[17px] font-extrabold">
              {user?.name ?? '旅人'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={toggleDark}
              className="w-8 h-8 rounded-full bg-surface dark:bg-dark-surface border border-line dark:border-dark-line items-center justify-center active:opacity-70"
            >
              {dark
                ? <Sun size={14} color="#efeefb" />
                : <Moon size={14} color="#322f54" />}
            </Pressable>
            <Pressable
              onPress={handleLogout}
              className="px-3 py-1.5 rounded-full bg-surface dark:bg-dark-surface border border-line dark:border-dark-line active:opacity-70"
            >
              <Text className="text-muted dark:text-dark-muted text-xs font-bold">登出</Text>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 34 : 0,
          paddingBottom: 60,
          maxWidth: 1180,
          width: '100%',
          alignSelf: isDesktop ? 'flex-start' : 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 載入中 */}
        {loading && !currentTrip && (
          <View className="items-center mt-20">
            <ActivityIndicator color="#6c7bd6" />
            <Text className="text-muted dark:text-dark-muted text-xs mt-3">載入行程中...</Text>
          </View>
        )}

        {/* 錯誤 */}
        {error && (
          <View className="bg-accent-2/15 p-4 rounded-card mt-4">
            <Text className="text-accent-2 font-bold">載入失敗</Text>
            <Text className="text-accent-2 text-xs mt-1">{error}</Text>
          </View>
        )}

        {/* 沒有任何 trip */}
        {!loading && !currentTrip && !error && (
          <View className="items-center mt-20 px-6">
            <Map size={42} color="#bdb2ff" />
            <Text className="text-ink dark:text-dark-ink text-base font-bold mt-4">還沒有任何行程</Text>
            <Text className="text-muted dark:text-dark-muted text-xs mt-2 text-center">
              {`建立第一個家庭、第一筆行程,\n就能在這裡看到完整的安排。`}
            </Text>
          </View>
        )}

        {/* 有 trip → 主要內容 */}
        {currentTrip && (
          <>
            <View className="mt-1.5">
              <HeroCard
                title={currentTrip.title}
                startDate={currentTrip.startDate}
                endDate={currentTrip.endDate}
                activityCount={totalActivities}
              />
            </View>

            {/* DAY 列表:寬螢幕 3 欄,窄螢幕單欄 */}
            <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mt-5 mb-1 px-0.5">
              DAY 規劃
            </Text>
            <View className={isDesktop ? 'flex-row flex-wrap gap-3' : ''}>
              {currentTrip.tripDays.map((d) => (
                <View
                  key={d.id}
                  style={isDesktop ? { flexBasis: '32%', flexGrow: 1 } : undefined}
                >
                  <DayRow
                    dayNumber={d.dayNumber}
                    date={d.date}
                    activityCount={d.activities.length}
                  />
                </View>
              ))}
            </View>

            {/* 航班 */}
            {(outbound || returning) && (
              <>
                <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mt-6 mb-2 px-0.5">
                  航班
                </Text>
                <View className="flex-row gap-2.5">
                  {outbound && <FlightCard flight={outbound} />}
                  {returning && <FlightCard flight={returning} isReturn />}
                </View>
              </>
            )}

            {/* 住宿 */}
            {currentTrip.hotels.length > 0 && (
              <>
                <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mt-6 mb-2 px-0.5">
                  住宿
                </Text>
                {currentTrip.hotels.map((h) => (
                  <View key={h.id} className="mb-2.5">
                    <HotelCard hotel={h} />
                  </View>
                ))}
              </>
            )}

            {/* 離線提示 */}
            <View className="flex-row items-center justify-center gap-2 mt-6">
              <View className="w-2 h-2 rounded-full bg-[#2bb673]" />
              <Text className="text-muted dark:text-dark-muted text-[11.5px]">資料已快取,離線也能瀏覽</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
