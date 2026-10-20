import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { DateField } from '@/components/common/DateField'
import { Field, FormSheet } from '@/components/common/FormSheet'
import { ApiError } from '@/services/api'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import { parseDateTime, toDateInput, tripLengthDays } from '@/utils/format'
import type { TripDay, TripDetail } from '@/types/api'

interface DayFormModalProps {
  visible: boolean
  trip: TripDetail
  day: TripDay | null
  onClose: () => void
}

export function DayFormModal({ visible, trip, day, onClose }: DayFormModalProps) {
  const reloadCurrent = useTripStore((state) => state.reloadCurrent)
  const [dayNumber, setDayNumber] = useState('')
  const [date, setDate] = useState('')
  const [theme, setTheme] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startDate = toDateInput(trip.startDate)
  const endDate = toDateInput(trip.endDate)
  const totalDays = tripLengthDays(trip.startDate, trip.endDate)

  useEffect(() => {
    if (!visible) return
    const used = new Set(trip.tripDays.map((item) => item.dayNumber))
    const next = Array.from({ length: totalDays }, (_, index) => index + 1).find(
      (number) => !used.has(number),
    )
    setDayNumber(String(day?.dayNumber ?? next ?? ''))
    const nextDate = next
      ? new Date(new Date(trip.startDate).getTime() + (next - 1) * 86400000)
      : null
    setDate(day ? toDateInput(day.date) : nextDate ? toDateInput(nextDate.toISOString()) : '')
    setTheme(day?.theme ?? '')
    setError(null)
  }, [visible, day, trip.startDate, trip.tripDays, totalDays])

  async function handleSubmit() {
    const number = Number(dayNumber)
    if (!Number.isInteger(number) || number < 1 || number > totalDays) {
      setError(`Day 編號必須在 1～${totalDays} 之間`)
      return
    }
    if (!date || date < startDate || date > endDate) {
      setError(`日期必須在 ${startDate}～${endDate} 之間`)
      return
    }
    const dateIso = parseDateTime(date)
    if (!dateIso) {
      setError('請輸入有效日期')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (day) {
        await tripService.updateDay(trip.id, day.id, {
          dayNumber: number,
          date: dateIso,
          theme: theme.trim() || null,
        })
      } else {
        await tripService.createDay(trip.id, {
          dayNumber: number,
          date: dateIso,
          theme: theme.trim() || undefined,
        })
      }
      await reloadCurrent()
      onClose()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : '儲存失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!day) return
    setSubmitting(true)
    setError(null)
    try {
      await tripService.removeDay(trip.id, day.id, day.activities.length > 0)
      await reloadCurrent()
      onClose()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : '刪除失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormSheet
      visible={visible}
      title={day ? `編輯 Day ${day.dayNumber}` : '新增一天'}
      onClose={onClose}
      onSubmit={handleSubmit}
      onDelete={day ? handleDelete : undefined}
      submitting={submitting}
      error={error}
    >
      <Field
        label={`Day 編號 *（1～${totalDays}）`}
        value={dayNumber}
        onChangeText={setDayNumber}
        keyboardType="number-pad"
        placeholder="例如：1"
      />
      <DateField label="日期 *" mode="date" value={date} onChange={setDate} />
      <Field label="主題" value={theme} onChangeText={setTheme} placeholder="例如：淺草・上野" />
      {day && day.activities.length > 0 && (
        <Text className="text-accent-2 text-[12px]">
          這一天有 {day.activities.length} 項活動。確認刪除後，活動也會一併刪除。
        </Text>
      )}
    </FormSheet>
  )
}
