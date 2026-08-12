// 首頁的 Hero 大卡：漸層底 + 目的地大字 + 日期/天數摘要
// 淺色:粉藍 → 粉紫(palette pastels);深色:深紫 → 桃紅(夜色情調)
import { View, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useThemeStore } from '@/store/useThemeStore'
import { formatDateRange, tripLengthDays } from '@/utils/format'

interface HeroCardProps {
  title: string
  startDate: string
  endDate: string
  activityCount: number
}

// 深淺兩套漸層 + 文字顏色
const HERO_THEMES = {
  light: {
    gradient: ['#a0c4ff', '#ffc6ff'] as [string, string], // 粉藍 → 粉紫
    ink: '#322f54',
    pillBg: 'rgba(255,255,255,0.25)',
    pillDot: '#322f54',
  },
  dark: {
    gradient: ['#4d3f8f', '#a685d6'] as [string, string], // 深紫 → 薰衣草
    ink: '#fffafa',
    pillBg: 'rgba(255,255,255,0.18)',
    pillDot: '#fffafa',
  },
}

export function HeroCard({ title, startDate, endDate, activityCount }: HeroCardProps) {
  const dark = useThemeStore((s) => s.dark)
  const t = dark ? HERO_THEMES.dark : HERO_THEMES.light
  const dateRange = formatDateRange(startDate, endDate)
  const days = tripLengthDays(startDate, endDate)

  return (
    <LinearGradient
      colors={t.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-card-lg overflow-hidden"
    >
      <View className="px-5 pt-6 pb-5 min-h-[152px] justify-end">
        <View
          className="self-start flex-row items-center gap-1.5 px-3 py-1.5 rounded-full mb-auto"
          style={{ backgroundColor: t.pillBg }}
        >
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: t.pillDot }} />
          <Text className="text-xs font-semibold" style={{ color: t.ink }}>
            下個目的地
          </Text>
        </View>

        <Text
          className="text-[39px] font-black leading-[40px] mt-3.5 tracking-tight"
          style={{ color: t.ink }}
        >
          {title}
        </Text>

        <Text className="text-sm mt-3 tracking-wider" style={{ color: t.ink, opacity: 0.85 }}>
          {dateRange}
          <Text style={{ opacity: 0.5 }}> · </Text>
          {days} 天<Text style={{ opacity: 0.5 }}> · </Text>
          {activityCount} 個項目
        </Text>
      </View>
    </LinearGradient>
  )
}
