// AI 幫我排（限 OWNER/ADMIN 開啟）
// 流程：偏好表單 → 生成中 → 草稿預覽（逐天列出、可取消勾選）→ 套用後 reload
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { CheckCircle2, Circle } from 'lucide-react-native'
import { ChipSelect, Field, FormSheet } from '@/components/common/FormSheet'
import { ApiError } from '@/services/api'
import { aiPlanService } from '@/services/aiPlanService'
import { useTripStore } from '@/store/useTripStore'
import { combineDateTime } from '@/utils/format'
import type { AiPlanDraft, AiPlanPace, ApplyAiPlanDay, TripDetail } from '@/types/api'

const PACE_OPTIONS: { value: AiPlanPace; label: string }[] = [
  { value: 'relaxed', label: '悠閒' },
  { value: 'moderate', label: '適中' },
  { value: 'packed', label: '緊湊' },
]

// 活動類別徽章文字（與 kanban 一致的四類）
const TYPE_LABELS: Record<string, string> = {
  spot: '景點',
  food: '用餐',
  shop: '購物',
  move: '移動',
}

// 第 n 天的日期 ISO（給 combineDateTime 組活動時間用）
function dateOfDay(startIso: string, dayNumber: number): string {
  const d = new Date(startIso)
  d.setDate(d.getDate() + dayNumber - 1)
  return d.toISOString()
}

interface AiPlanModalProps {
  visible: boolean
  onClose: () => void
  trip: TripDetail
}

export function AiPlanModal({ visible, onClose, trip }: AiPlanModalProps) {
  const reloadCurrent = useTripStore((s) => s.reloadCurrent)

  const [step, setStep] = useState<'form' | 'preview'>('form')
  const [pace, setPace] = useState<AiPlanPace | null>('moderate')
  const [interests, setInterests] = useState('')
  const [note, setNote] = useState('')
  const [draft, setDraft] = useState<AiPlanDraft | null>(null)
  // 取消勾選的活動（key = `${dayNumber}-${活動索引}`，預設全選）
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setStep('form')
    setDraft(null)
    setUnchecked(new Set())
    setError(null)
  }, [visible])

  function toggle(key: string) {
    setUnchecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  async function handleGenerate() {
    setSubmitting(true)
    setError(null)
    try {
      const result = await aiPlanService.generate(trip.id, {
        pace: pace ?? undefined,
        interests: interests.trim() || undefined,
        note: note.trim() || undefined,
      })
      setDraft(result)
      setUnchecked(new Set())
      setStep('preview')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '生成失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleApply() {
    if (!draft) return
    // 只套用仍勾選的活動；時間由 "HH:MM" 轉 ISO（跟手動新增活動同一套語意）
    const days: ApplyAiPlanDay[] = draft.days
      .map((d) => ({
        dayNumber: d.dayNumber,
        theme: d.theme ?? undefined,
        activities: d.activities
          .filter((_, i) => !unchecked.has(`${d.dayNumber}-${i}`))
          .map((a) => {
            const dateIso = dateOfDay(trip.startDate, d.dayNumber)
            return {
              title: a.title,
              type: a.type ?? undefined,
              place: a.place ?? undefined,
              startTime: (a.startTime && combineDateTime(dateIso, a.startTime)) || undefined,
              endTime: (a.endTime && combineDateTime(dateIso, a.endTime)) || undefined,
              note: a.note ?? undefined,
            }
          }),
      }))
      .filter((d) => d.activities.length > 0)

    if (days.length === 0) {
      setError('至少要保留一個活動')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await aiPlanService.apply(trip.id, { days })
      await reloadCurrent()
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '套用失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormSheet
      visible={visible}
      title={step === 'form' ? 'AI 幫我排' : '行程草稿'}
      onClose={onClose}
      onSubmit={step === 'form' ? handleGenerate : handleApply}
      submitting={submitting}
      error={error}
      submitLabel={step === 'form' ? (submitting ? '規劃中…' : '開始規劃') : '套用行程'}
    >
      {step === 'form' ? (
        <>
          <Text className="text-muted dark:text-dark-muted text-[12.5px] leading-[19px]">
            AI 會依目的地、日期與既有的航班／飯店／活動規劃每一天，先給草稿預覽，確認後才寫入行程。
          </Text>
          <ChipSelect label="步調" options={PACE_OPTIONS} value={pace} onChange={setPace} />
          <Field
            label="興趣（選填）"
            value={interests}
            onChangeText={setInterests}
            placeholder="例如：動漫、甜點、逛街、看夜景"
          />
          <Field
            label="備註（選填）"
            value={note}
            onChangeText={setNote}
            placeholder="例如：有帶長輩，行程不要太累"
          />
        </>
      ) : (
        <>
          <Text className="text-muted dark:text-dark-muted text-[12.5px]">
            點活動可取消勾選，只套用打勾的項目。
          </Text>
          {draft?.days.map((d) => (
            <View key={d.dayNumber}>
              <Text className="text-ink dark:text-dark-ink text-[14px] font-extrabold mb-1.5">
                DAY {d.dayNumber}
                {d.theme ? `  ·  ${d.theme}` : ''}
              </Text>
              <View className="gap-1.5">
                {d.activities.map((a, i) => {
                  const key = `${d.dayNumber}-${i}`
                  const checked = !unchecked.has(key)
                  return (
                    <Pressable
                      key={key}
                      onPress={() => toggle(key)}
                      className={`flex-row items-start gap-2.5 px-3 py-2.5 rounded-[12px] border active:opacity-70 ${
                        checked
                          ? 'bg-surface-2 dark:bg-dark-surface-2 border-line dark:border-dark-line'
                          : 'border-line dark:border-dark-line opacity-45'
                      }`}
                    >
                      {checked ? (
                        <CheckCircle2 size={17} color="#6c7bd6" style={{ marginTop: 1 }} />
                      ) : (
                        <Circle size={17} color="#8c89a8" style={{ marginTop: 1 }} />
                      )}
                      <View className="flex-1">
                        <Text className="text-ink dark:text-dark-ink text-[13.5px] font-bold">
                          {a.startTime ? `${a.startTime}  ` : ''}
                          {a.title}
                        </Text>
                        <Text className="text-muted dark:text-dark-muted text-[11.5px] mt-0.5">
                          {[a.type ? TYPE_LABELS[a.type] : null, a.place, a.note]
                            .filter(Boolean)
                            .join('  ·  ')}
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ))}
        </>
      )}
    </FormSheet>
  )
}
