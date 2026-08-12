// 行程新增／編輯彈窗
// 新增模式：載入我的家庭；一個以上可選、一個都沒有時先填家庭名稱一併建立
// 編輯模式：改名／改日期，可刪除整個行程
import { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { ChipSelect, Field, FormSheet } from '@/components/common/FormSheet'
import { DateField } from '@/components/common/DateField'
import { ApiError } from '@/services/api'
import { familyService } from '@/services/familyService'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import { parseDateTime, toDateInput } from '@/utils/format'
import type { FamilyWithMembers, TripSummary } from '@/types/api'

interface TripFormModalProps {
  visible: boolean
  onClose: () => void
  // 編輯模式傳行程；新增模式傳 null
  trip: TripSummary | null
  // 新增模式建立成功後呼叫（總覽頁用來導進新旅程）
  onCreated?: (id: string) => void
  // 編輯模式刪除成功後呼叫（由呼叫端決定導航）
  onDeleted?: () => void
}

export function TripFormModal({
  visible,
  onClose,
  trip,
  onCreated,
  onDeleted,
}: TripFormModalProps) {
  const { loadTrips, loadDetail, removeTrip } = useTripStore()

  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [families, setFamilies] = useState<FamilyWithMembers[] | null>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [newFamilyName, setNewFamilyName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setError(null)
    setTitle(trip?.title ?? '')
    setDestination(trip?.destination ?? '')
    setStartDate(trip ? toDateInput(trip.startDate) : '')
    setEndDate(trip ? toDateInput(trip.endDate) : '')
    setNewFamilyName('')
    // 新增模式才需要家庭列表
    if (!trip) {
      setFamilies(null)
      familyService
        .list()
        .then((list) => {
          setFamilies(list)
          setFamilyId(list[0]?.id ?? null)
        })
        .catch((e) => setError(e instanceof ApiError ? e.message : '無法載入家庭列表'))
    }
  }, [visible, trip])

  async function handleSubmit() {
    setError(null)
    if (!title.trim() || !startDate.trim() || !endDate.trim()) {
      setError('名稱、開始與結束日期為必填')
      return
    }
    const startIso = parseDateTime(startDate)
    const endIso = parseDateTime(endDate)
    if (!startIso || !endIso) {
      setError('日期格式請用 YYYY-MM-DD，例如 2026-07-01')
      return
    }
    if (endIso < startIso) {
      setError('結束日期不能早於開始日期')
      return
    }

    setSubmitting(true)
    try {
      if (trip) {
        await tripService.update(trip.id, {
          title: title.trim(),
          startDate: startIso,
          endDate: endIso,
          destination: destination.trim() || null,
        })
        await loadDetail(trip.id)
        await loadTrips()
        onClose()
      } else {
        // 沒有任何家庭 → 先用填入的名稱建立一個
        let targetFamilyId = familyId
        if (!targetFamilyId) {
          if (!newFamilyName.trim()) {
            setError('請填家庭名稱（第一次使用需先建立家庭）')
            setSubmitting(false)
            return
          }
          const family = await familyService.create({ name: newFamilyName.trim() })
          targetFamilyId = family.id
        }
        const created = await tripService.create({
          title: title.trim(),
          startDate: startIso,
          endDate: endIso,
          familyId: targetFamilyId,
          destination: destination.trim() || undefined,
        })
        await loadTrips()
        onClose()
        onCreated?.(created.id)
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '儲存失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!trip) return
    setSubmitting(true)
    setError(null)
    try {
      await removeTrip(trip.id)
      onClose()
      onDeleted?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '刪除失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormSheet
      visible={visible}
      title={trip ? '編輯行程' : '建立行程'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
      onDelete={trip ? handleDelete : undefined}
    >
      <Field
        label="行程名稱 *"
        value={title}
        onChangeText={setTitle}
        placeholder="例如：東京自由行"
      />
      <Field
        label="目的地"
        value={destination}
        onChangeText={setDestination}
        placeholder="例如：日本・東京（AI 生成用語需要）"
      />
      <DateField
        label="開始日期 *"
        mode="date"
        value={startDate}
        onChange={setStartDate}
        placeholder="2026-07-01"
      />
      <DateField
        label="結束日期 *"
        mode="date"
        value={endDate}
        onChange={setEndDate}
        placeholder="2026-07-05"
      />

      {/* 家庭歸屬：僅新增模式 */}
      {!trip && families && families.length > 1 && (
        <ChipSelect
          label="所屬家庭 *"
          options={families.map((f) => ({ value: f.id, label: f.name }))}
          value={familyId}
          onChange={setFamilyId}
        />
      )}
      {!trip && families && families.length === 0 && (
        <>
          <Field
            label="家庭名稱 *"
            value={newFamilyName}
            onChangeText={setNewFamilyName}
            placeholder="例如：我們家"
          />
          <Text className="text-muted dark:text-dark-muted text-[11.5px] -mt-1">
            行程隸屬於家庭，成員可以共享同一份行程。你還沒有家庭，會用這個名稱建立一個。
          </Text>
        </>
      )}
    </FormSheet>
  )
}
