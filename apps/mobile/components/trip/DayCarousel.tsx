// 首頁「DAY 規劃」橫向滑動列：標題列右側左右箭頭翻頁（桌面且放不下時才顯示）
// 日期等於今天的卡片亮燈，進頁面時自動捲到那張
import { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { isToday } from '@/utils/format'
import { DayCard } from '@/components/trip/DayCard'
import type { TripDay } from '@/types/api'

const GAP = 12

interface DayCarouselProps {
  days: TripDay[]
  onPressDay: (dayId: string) => void
}

export function DayCarousel({ days, onPressDay }: DayCarouselProps) {
  const isDesktop = useIsDesktop()
  const cardWidth = isDesktop ? 270 : 250
  const contentW = days.length * cardWidth + Math.max(0, days.length - 1) * GAP

  const scrollRef = useRef<ScrollView>(null)
  const scrollX = useRef(0)
  const autoScrolled = useRef(false)
  const [viewW, setViewW] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const maxX = Math.max(0, contentW - viewW)
  const hasOverflow = viewW > 0 && contentW > viewW + 1
  const todayIndex = days.findIndex((d) => isToday(d.date))

  // 首次量到寬度後自動捲到「今天」的卡片（只捲一次，之後尊重使用者的捲動位置）
  useEffect(() => {
    if (autoScrolled.current || viewW === 0 || todayIndex <= 0) return
    autoScrolled.current = true
    const x = Math.min(todayIndex * (cardWidth + GAP), maxX)
    scrollRef.current?.scrollTo({ x, animated: false })
    scrollX.current = x
    setAtStart(x <= 1)
    setAtEnd(x >= maxX - 1)
  }, [viewW, todayIndex, cardWidth, maxX])

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x
    scrollX.current = x
    setAtStart(x <= 1)
    setAtEnd(x >= maxX - 1)
  }

  // 一次翻兩張
  const scrollBy = (dir: 1 | -1) => {
    const step = (cardWidth + GAP) * 2
    const x = Math.min(Math.max(scrollX.current + dir * step, 0), maxX)
    scrollRef.current?.scrollTo({ x, animated: true })
  }

  return (
    <View>
      <View className="flex-row items-center justify-between mt-4 mb-1 px-0.5">
        <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider">
          DAY 規劃
        </Text>
        {isDesktop && hasOverflow && (
          <View className="flex-row gap-1.5">
            <ArrowButton dir={-1} disabled={atStart} onPress={() => scrollBy(-1)} />
            <ArrowButton dir={1} disabled={atEnd} onPress={() => scrollBy(1)} />
          </View>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onLayout={(e) => setViewW(e.nativeEvent.layout.width)}
        contentContainerStyle={{ gap: GAP, paddingBottom: 2 }}
      >
        {days.map((d) => (
          <View key={d.id} style={{ width: cardWidth }}>
            <DayCard
              dayNumber={d.dayNumber}
              date={d.date}
              activities={d.activities}
              theme={d.theme ?? undefined}
              isToday={isToday(d.date)}
              onPress={() => onPressDay(d.id)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

// 圓形箭頭鈕:到頭/到尾時降透明度並停用
function ArrowButton({
  dir,
  disabled,
  onPress,
}: {
  dir: 1 | -1
  disabled: boolean
  onPress: () => void
}) {
  const Icon = dir === -1 ? ChevronLeft : ChevronRight
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={
        disabled
          ? 'w-7 h-7 rounded-full border border-line dark:border-dark-line items-center justify-center opacity-40'
          : 'w-7 h-7 rounded-full border border-line dark:border-dark-line bg-surface dark:bg-dark-surface items-center justify-center active:opacity-70'
      }
    >
      <Icon size={15} color="#8c89a8" />
    </Pressable>
  )
}
