// 景點 tab:把目前 trip 內所有「非交通」的活動聚合成景點牆
// 對應設計檔的景點頁:4 欄(網頁)/ 2 欄(手機)便利貼牆,九色 palette 輪用
import { useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native'
import { Plus, MapPin, Clock } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { ActivityFormModal } from '@/components/trip/ActivityFormModal'
import { categoryStyle, formatPrice, toTWD } from '@/utils/activityCategory'
import { formatDate } from '@/utils/format'
import type { DayActivity, ActivityType } from '@/types/api'

// 九色 palette 卡片底色(輪流給每張景點卡)
const CARD_BG = [
  '#ffadad',
  '#ffd6a5',
  '#fdffb6',
  '#caffbf',
  '#9bf6ff',
  '#a0c4ff',
  '#bdb2ff',
  '#ffc6ff',
]

// 類別 → emoji(設計檔風格)
const CAT_EMOJI: Record<ActivityType, string> = {
  spot: '⛩',
  food: '🍱',
  shop: '🛍',
  move: '🚆',
}

type Filter = 'all' | ActivityType
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'spot', label: '景點' },
  { key: 'food', label: '美食' },
  { key: 'shop', label: '購物' },
]

// 把活動 + 它在哪一天攤平成單筆,給景點牆用
interface AttractionItem {
  activity: DayActivity
  dayNumber: number
}

export default function AttractionsScreen() {
  const isDesktop = useIsDesktop()
  const { width } = useWindowDimensions()
  // currentTrip 由 trip/[id]/_layout 保證載入完成
  const currentTrip = useTripStore((s) => s.currentTrip)
  const [filter, setFilter] = useState<Filter>('all')
  // 彈窗狀態:'create' 開新增、DayActivity 開編輯、null 關閉
  const [modal, setModal] = useState<'create' | DayActivity | null>(null)

  // 攤平所有活動 → 景點清單(排除交通)
  const items: AttractionItem[] = useMemo(() => {
    if (!currentTrip) return []
    return currentTrip.tripDays.flatMap((d) =>
      d.activities
        .filter((a) => a.type !== 'move')
        .map((a) => ({ activity: a, dayNumber: d.dayNumber })),
    )
  }, [currentTrip])

  const filtered = items.filter((i) =>
    filter === 'all' ? true : (i.activity.type ?? 'spot') === filter,
  )

  // 4 欄(>= 1080) / 3 欄(>= 720) / 2 欄(手機)
  const cols = width >= 1080 ? 4 : width >= 720 ? 3 : 2
  const fx = currentTrip?.fx ?? null
  const symbol = currentTrip?.symbol ?? null

  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 34 : 10,
          paddingBottom: 40,
          maxWidth: 1180,
          width: '100%',
          alignSelf: isDesktop ? 'flex-start' : 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 標題 + 新增 */}
        <View className="flex-row items-end justify-between">
          <View className="flex-1">
            <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
              景點
            </Text>
            <Text className="text-muted dark:text-dark-muted text-[13px] mt-1">
              {currentTrip ? `${currentTrip.title}  ·  ${items.length} 個地點` : '尚未選擇行程'}
            </Text>
          </View>
          {currentTrip && (
            <Pressable
              onPress={() => setModal('create')}
              className="flex-row items-center gap-1 bg-accent dark:bg-dark-accent rounded-full px-3 py-2 active:opacity-80"
            >
              <Plus size={14} color="#fff" />
              <Text className="text-white text-xs font-bold">新增景點</Text>
            </Pressable>
          )}
        </View>

        {/* 篩選 chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 16 }}
        >
          {FILTERS.map((f) => {
            const isActive = filter === f.key
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-full active:opacity-70 ${
                  isActive
                    ? 'bg-ink dark:bg-dark-ink'
                    : 'bg-surface dark:bg-dark-surface border border-line dark:border-dark-line'
                }`}
              >
                <Text
                  className={`text-[12.5px] font-bold ${
                    isActive ? 'text-white dark:text-ink' : 'text-ink dark:text-dark-ink'
                  }`}
                >
                  {f.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {/* 景點牆：依 DAY 分組（每天一段標題 + 便利貼牆） */}
        {filtered.length === 0 ? (
          <View className="items-center mt-12">
            <MapPin size={42} color="#bdb2ff" />
            <Text className="text-ink dark:text-dark-ink text-base font-bold mt-4">
              {currentTrip ? '此分類目前沒有景點' : '請先建立行程'}
            </Text>
          </View>
        ) : (
          currentTrip?.tripDays.map((d) => {
            const dayItems = filtered.filter((i) => i.activity.tripDayId === d.id)
            if (dayItems.length === 0) return null
            return (
              <View key={d.id} className="mb-6">
                <View className="flex-row items-baseline gap-2 mb-3">
                  <Text className="text-accent-2 text-[13px] font-black tracking-wider">
                    DAY {d.dayNumber}
                  </Text>
                  <Text className="text-ink dark:text-dark-ink text-[14px] font-extrabold">
                    {d.theme ?? formatDate(d.date)}
                  </Text>
                  {d.theme && (
                    <Text className="text-muted dark:text-dark-muted text-[11.5px]">
                      {formatDate(d.date)}
                    </Text>
                  )}
                </View>
                <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                  {dayItems.map((item, idx) => (
                    <View
                      key={item.activity.id}
                      style={{
                        flexBasis: `${100 / cols - 2}%`,
                        flexGrow: 1,
                        maxWidth: `${100 / cols}%`,
                      }}
                    >
                      <AttractionCard
                        item={item}
                        bg={CARD_BG[(d.dayNumber + idx) % CARD_BG.length]}
                        fx={fx}
                        symbol={symbol}
                        onPress={() => setModal(item.activity)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )
          })
        )}
      </ScrollView>

      {currentTrip && (
        <ActivityFormModal
          visible={modal !== null}
          onClose={() => setModal(null)}
          trip={currentTrip}
          activity={modal !== null && modal !== 'create' ? modal : null}
        />
      )}
    </View>
  )
}

// 單張景點卡:彩色上方 banner(emoji)+ 白底資訊區
function AttractionCard({
  item,
  bg,
  fx,
  symbol,
  onPress,
}: {
  item: AttractionItem
  bg: string
  fx: number | null
  symbol: string | null
  onPress: () => void
}) {
  const { activity, dayNumber } = item
  const cat = categoryStyle(activity.type)
  const priceText = formatPrice(activity.price, symbol)
  const twdText = toTWD(activity.price, fx)
  const emoji = CAT_EMOJI[activity.type ?? 'spot']

  return (
    // flex-1:撐滿外層 wrapper 的高度(同一列以最高的卡為準,整列等高)
    <Pressable
      onPress={onPress}
      className="flex-1 rounded-[16px] overflow-hidden bg-surface dark:bg-dark-surface border border-line dark:border-dark-line active:opacity-80"
    >
      {/* 彩色 banner + emoji */}
      <View className="h-[96px] items-center justify-center" style={{ backgroundColor: bg }}>
        <Text className="text-[44px]">{emoji}</Text>
        {/* 右上 Day 角標 */}
        <View className="absolute top-2 right-2 bg-white/85 rounded-full px-2 py-0.5">
          <Text className="text-ink text-[10.5px] font-extrabold">Day {dayNumber}</Text>
        </View>
        {/* 左上類別徽章 */}
        <View
          className="absolute top-2 left-2 rounded-full px-2 py-0.5"
          style={{ backgroundColor: 'rgba(255,255,255,0.85)' }}
        >
          <Text className="text-[10.5px] font-bold" style={{ color: cat.color }}>
            {cat.label}
          </Text>
        </View>
      </View>

      {/* 資訊區:flex-1 + justify-between,價錢固定貼卡片底部(整列等高時空隙留在中間) */}
      <View className="p-3 flex-1 justify-between">
        <View>
          <Text
            className="text-ink dark:text-dark-ink text-[14.5px] font-extrabold leading-[19px]"
            numberOfLines={2}
          >
            {activity.title}
          </Text>

          {activity.place && (
            <View className="flex-row items-center gap-1 mt-1.5">
              <MapPin size={11} color="#8c89a8" />
              <Text
                className="text-muted dark:text-dark-muted text-[11.5px] flex-1"
                numberOfLines={1}
              >
                {activity.place}
              </Text>
            </View>
          )}

          {activity.hours && (
            <View className="flex-row items-center gap-1 mt-1">
              <Clock size={10} color="#8c89a8" />
              <Text className="text-muted dark:text-dark-muted text-[11px]">{activity.hours}</Text>
            </View>
          )}
        </View>

        {(priceText || twdText) && (
          <View className="flex-row items-end justify-between mt-2">
            {priceText ? (
              <Text className="text-ink dark:text-dark-ink text-[13px] font-extrabold">
                {priceText}
              </Text>
            ) : (
              <View />
            )}
            {twdText && (
              <Text className="text-muted dark:text-dark-muted text-[10.5px]">≈ {twdText}</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  )
}
