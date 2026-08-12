// 用語 tab：AI 生成的當地實用短句，分類顯示（當地語言大字＋拼音＋中文）
// 生成一次存 DB，全家共用；可重新生成（舊的會被清掉）
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { MessageCircle, Sparkles } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { ApiError } from '@/services/api'
import { phraseService } from '@/services/phraseService'
import type { Phrase, PhraseCategory } from '@/types/api'

// 分類代碼 → 顯示名稱（順序即顯示順序）
const CATEGORY_LABELS: { key: PhraseCategory; label: string }[] = [
  { key: 'greeting', label: '打招呼' },
  { key: 'dining', label: '用餐' },
  { key: 'transport', label: '交通' },
  { key: 'shopping', label: '購物' },
  { key: 'emergency', label: '緊急' },
]

export default function PhrasesScreen() {
  const isDesktop = useIsDesktop()
  // currentTrip 由 trip/[id]/_layout 保證載入完成
  const currentTrip = useTripStore((s) => s.currentTrip)
  const [phrases, setPhrases] = useState<Phrase[] | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tripId = currentTrip?.id

  const load = useCallback(async () => {
    if (!tripId) return
    try {
      setPhrases(await phraseService.list(tripId))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '無法載入短句')
      setPhrases([])
    }
  }, [tripId])

  useEffect(() => {
    load()
  }, [load])

  if (!currentTrip) return null

  async function handleGenerate() {
    if (!tripId) return
    if (!currentTrip?.destination) {
      setError('請先到「旅程總覽 → 編輯行程資訊」填寫目的地，AI 才知道要生成哪種語言')
      return
    }
    setGenerating(true)
    setError(null)
    try {
      setPhrases(await phraseService.generate(tripId))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '生成失敗，請稍後再試')
    } finally {
      setGenerating(false)
    }
  }

  const hasPhrases = phrases !== null && phrases.length > 0

  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 34 : 10,
          paddingBottom: 40,
          maxWidth: 760,
          width: '100%',
          alignSelf: isDesktop ? 'flex-start' : 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
              用語
            </Text>
            <Text className="text-muted dark:text-dark-muted text-[13px] mt-1">
              {currentTrip.destination
                ? `${currentTrip.destination}  ·  點句子唸給對方聽或拿給對方看`
                : '尚未設定目的地'}
            </Text>
          </View>
          {/* 已有短句時提供重新生成 */}
          {hasPhrases && (
            <GenerateButton label="重新生成" generating={generating} onPress={handleGenerate} />
          )}
        </View>

        {error && <Text className="text-accent-2 text-[12.5px] mt-3">{error}</Text>}

        {phrases === null ? (
          <ActivityIndicator color="#6c7bd6" style={{ marginTop: 48 }} />
        ) : !hasPhrases ? (
          // 尚未生成：空狀態 + AI 生成按鈕
          <View className="items-center mt-16">
            <MessageCircle size={44} color="#caffbf" />
            <Text className="text-ink dark:text-dark-ink text-[15px] font-bold mt-4">
              還沒有旅遊短句
            </Text>
            <Text className="text-muted dark:text-dark-muted text-[13px] mt-1.5 text-center px-6">
              AI 會依目的地生成 30–40 句實用短句：打招呼、用餐、交通、購物、緊急求助
            </Text>
            <View className="mt-5">
              <GenerateButton label="AI 生成" generating={generating} onPress={handleGenerate} />
            </View>
          </View>
        ) : (
          // 依分類顯示
          CATEGORY_LABELS.map(({ key, label }) => {
            const items = phrases.filter((p) => p.category === key)
            if (items.length === 0) return null
            return (
              <View key={key}>
                <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mt-7 mb-2.5 px-0.5">
                  {label}
                </Text>
                <View className="gap-2">
                  {items.map((p) => (
                    <PhraseCard key={p.id} phrase={p} />
                  ))}
                </View>
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

// AI 生成／重新生成按鈕（生成中顯示 loading）
function GenerateButton({
  label,
  generating,
  onPress,
}: {
  label: string
  generating: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={generating}
      className={`flex-row items-center gap-1.5 bg-accent dark:bg-dark-accent rounded-full px-4 py-2 ${
        generating ? 'opacity-60' : 'active:opacity-80'
      }`}
    >
      {generating ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Sparkles size={13} color="#fff" />
      )}
      <Text className="text-white text-[12.5px] font-bold">{generating ? '生成中…' : label}</Text>
    </Pressable>
  )
}

// 短句卡：當地語言大字 + 拼音 + 中文
function PhraseCard({ phrase }: { phrase: Phrase }) {
  return (
    <View className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[14px] px-4 py-3">
      <Text className="text-ink dark:text-dark-ink text-[18px] font-extrabold leading-[26px]">
        {phrase.text}
      </Text>
      {phrase.reading ? (
        <Text className="text-muted dark:text-dark-muted text-[12px] mt-0.5">{phrase.reading}</Text>
      ) : null}
      <Text className="text-accent text-[13.5px] font-semibold mt-1.5">{phrase.meaning}</Text>
    </View>
  )
}
