// 活動新增／編輯彈窗：行程 kanban 與景點牆共用
// 新增模式：傳 initialDayId；編輯模式：傳 activity（可換天、可刪除）
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Map as MapIcon, MapPin, Search, X } from 'lucide-react-native'
import { LocationPickerModal } from '@/components/map/LocationPickerModal'
import { ChipSelect, Field, FormSheet } from '@/components/common/FormSheet'
import { DateField } from '@/components/common/DateField'
import { ApiError } from '@/services/api'
import { attractionService } from '@/services/attractionService'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import { combineDateTime, timeToHHmm } from '@/utils/format'
import { googleMapsUrl } from '@/utils/mapLink'
import type { ActivityType, AttractionSearchResult, DayActivity, TripDetail } from '@/types/api'

const TYPE_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: 'spot', label: '景點' },
  { value: 'food', label: '餐飲' },
  { value: 'shop', label: '購物' },
  { value: 'move', label: '交通' },
]

interface ActivityFormModalProps {
  visible: boolean
  onClose: () => void
  trip: TripDetail
  // 編輯模式傳活動；新增模式傳 null
  activity: DayActivity | null
  // 新增模式的預設天（沒傳就用第一天）
  initialDayId?: string
}

export function ActivityFormModal({
  visible,
  onClose,
  trip,
  activity,
  initialDayId,
}: ActivityFormModalProps) {
  const reloadCurrent = useTripStore((s) => s.reloadCurrent)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<ActivityType>('spot')
  const [dayId, setDayId] = useState<string | null>(null)
  const [startHHmm, setStartHHmm] = useState('')
  const [place, setPlace] = useState('')
  const [hours, setHours] = useState('')
  const [price, setPrice] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 景點搜尋（Google Places）：按搜尋鈕才查（控制 API 用量），null = 尚未搜過
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<AttractionSearchResult[] | null>(null)
  // 精確位置：點搜尋結果帶入，可手動移除；存 DB 給「開啟地圖」與之後的內嵌地圖用
  const [coords, setCoords] = useState<{ placeId: string | null; lat: number; lng: number } | null>(
    null,
  )
  // 地圖選點（原生限定；Web 內嵌地圖尚未支援）
  const [pickerOpen, setPickerOpen] = useState(false)

  // 每次打開時把表單重設成「目前活動」或空白
  useEffect(() => {
    if (!visible) return
    setError(null)
    setTitle(activity?.title ?? '')
    setType(activity?.type ?? 'spot')
    setDayId(activity?.tripDayId ?? initialDayId ?? trip.tripDays[0]?.id ?? null)
    setStartHHmm(timeToHHmm(activity?.startTime ?? null))
    setPlace(activity?.place ?? '')
    setHours(activity?.hours ?? '')
    setPrice(activity?.price != null ? String(activity.price) : '')
    setNote(activity?.note ?? '')
    setResults(null)
    setCoords(
      activity?.lat != null && activity?.lng != null
        ? { placeId: activity.placeId, lat: activity.lat, lng: activity.lng }
        : null,
    )
  }, [visible, activity, initialDayId, trip])

  const dayOptions = trip.tripDays.map((d) => ({
    value: d.id,
    label: `Day ${d.dayNumber}`,
  }))

  // 用名稱欄位的文字搜尋 Google Places
  async function handleSearch() {
    const query = title.trim()
    if (!query || searching) return
    setSearching(true)
    setError(null)
    try {
      setResults(await attractionService.search(query))
    } catch (e) {
      setResults(null)
      setError(e instanceof ApiError ? e.message : '搜尋失敗，請稍後再試')
    } finally {
      setSearching(false)
    }
  }

  // 點選搜尋結果：帶入名稱、地點與精確座標（文字可再手動修改）
  function pickResult(r: AttractionSearchResult) {
    setTitle(r.name)
    if (r.address) setPlace(r.address)
    setCoords(
      r.lat != null && r.lng != null ? { placeId: r.placeId, lat: r.lat, lng: r.lng } : null,
    )
    setResults(null)
  }

  // 地圖選點的起始中心：目前座標 → 行程內其他有座標的活動 → 東京車站
  const anyCoordActivity = trip.tripDays
    .flatMap((d) => d.activities)
    .find((a) => a.lat != null && a.lng != null)
  const fallbackCenter =
    anyCoordActivity?.lat != null && anyCoordActivity.lng != null
      ? { lat: anyCoordActivity.lat, lng: anyCoordActivity.lng }
      : { lat: 35.681236, lng: 139.767125 }

  // 開啟 Google 地圖：有座標用座標定位，沒座標用「名稱＋地點」文字搜尋
  const mapUrl = googleMapsUrl({
    title: title.trim(),
    place: place.trim() || null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    placeId: coords?.placeId ?? null,
  })

  async function handleSubmit() {
    setError(null)
    if (!title.trim()) {
      setError('請輸入名稱')
      return
    }
    if (!dayId) {
      setError('請先在行程中加入天數')
      return
    }
    const day = trip.tripDays.find((d) => d.id === dayId)!
    const startTime = combineDateTime(day.date, startHHmm)
    if (startTime === undefined) {
      setError('開始時間格式請用 HH:mm，例如 09:30')
      return
    }
    const priceNum = price.trim() === '' ? null : Number(price)
    if (priceNum !== null && (!Number.isInteger(priceNum) || priceNum < 0)) {
      setError('價錢請輸入整數')
      return
    }

    setSubmitting(true)
    try {
      if (activity) {
        await tripService.updateActivity(trip.id, activity.id, {
          title: title.trim(),
          type,
          tripDayId: dayId,
          startTime,
          place: place.trim() || null,
          hours: hours.trim() || null,
          price: priceNum,
          note: note.trim() || null,
          placeId: coords?.placeId ?? null,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        })
      } else {
        await tripService.createActivity(trip.id, dayId, {
          title: title.trim(),
          type,
          startTime: startTime ?? undefined,
          place: place.trim() || undefined,
          hours: hours.trim() || undefined,
          price: priceNum ?? undefined,
          note: note.trim() || undefined,
          placeId: coords?.placeId ?? undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        })
      }
      await reloadCurrent()
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '儲存失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!activity) return
    setSubmitting(true)
    setError(null)
    try {
      await tripService.removeActivity(trip.id, activity.id)
      await reloadCurrent()
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '刪除失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* 開地圖選點時先藏表單（RN 原生一次只能一個 Modal），關掉自動回表單 */}
      <FormSheet
        visible={visible && !pickerOpen}
        title={activity ? '編輯活動' : '新增活動'}
        onClose={onClose}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
        onDelete={activity ? handleDelete : undefined}
      >
        {/* 名稱 + Google 景點搜尋（按鈕觸發，點結果帶入名稱／地點） */}
        <View>
          <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">
            名稱 *
          </Text>
          <View className="flex-row items-center gap-2">
            <TextInput
              value={title}
              onChangeText={setTitle}
              onSubmitEditing={handleSearch}
              placeholder="例如：淺草寺"
              placeholderTextColor="#8c89a8"
              className="flex-1 bg-surface-2 dark:bg-dark-surface-2 border border-line dark:border-dark-line rounded-[11px] px-3.5 py-3 text-ink dark:text-dark-ink text-[15px]"
            />
            <Pressable
              onPress={handleSearch}
              disabled={searching || !title.trim()}
              className="p-3 rounded-[11px] bg-accent dark:bg-dark-accent active:opacity-80 disabled:opacity-40"
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Search size={16} color="#fff" />
              )}
            </Pressable>
          </View>
          {results !== null &&
            (results.length === 0 ? (
              <Text className="text-muted dark:text-dark-muted text-[12px] mt-2">
                找不到相關景點，可直接手動填寫
              </Text>
            ) : (
              <View className="mt-2 border border-line dark:border-dark-line rounded-[11px] overflow-hidden">
                {results.slice(0, 5).map((r, i) => (
                  <Pressable
                    key={r.placeId}
                    onPress={() => pickResult(r)}
                    className={`px-3.5 py-2.5 active:opacity-70 bg-surface dark:bg-dark-surface ${
                      i > 0 ? 'border-t border-line dark:border-dark-line' : ''
                    }`}
                  >
                    <Text className="text-ink dark:text-dark-ink text-[13.5px] font-bold">
                      {r.name}
                    </Text>
                    {r.address && (
                      <Text
                        className="text-muted dark:text-dark-muted text-[11.5px] mt-0.5"
                        numberOfLines={1}
                      >
                        {r.address}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
        </View>
        <ChipSelect label="類別" options={TYPE_OPTIONS} value={type} onChange={setType} />
        <ChipSelect
          label="哪一天"
          options={dayOptions}
          value={dayId}
          onChange={(v) => setDayId(v)}
        />
        <DateField
          label="開始時間"
          mode="time"
          value={startHHmm}
          onChange={setStartHHmm}
          placeholder="09:30"
        />
        <Field
          label="地點／區域"
          value={place}
          onChangeText={setPlace}
          placeholder="例如：台東区浅草"
        />

        {/* 地圖選點（原生）＋ 開啟地圖（免金鑰 deep link）＋ 移除精確定位 */}
        {(mapUrl || Platform.OS !== 'web') && (
          <View className="flex-row flex-wrap items-center gap-2 -mt-1">
            {Platform.OS !== 'web' && (
              <Pressable
                onPress={() => setPickerOpen(true)}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
              >
                <MapIcon size={12} color="#6c7bd6" />
                <Text className="text-accent dark:text-dark-accent text-[12px] font-bold">
                  地圖選點
                </Text>
              </Pressable>
            )}
            {mapUrl && (
              <Pressable
                onPress={() => Linking.openURL(mapUrl)}
                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
              >
                <MapPin size={12} color="#6c7bd6" />
                <Text className="text-accent dark:text-dark-accent text-[12px] font-bold">
                  在 Google 地圖開啟
                </Text>
              </Pressable>
            )}
            {coords && (
              <Pressable
                onPress={() => setCoords(null)}
                className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full active:opacity-70"
              >
                <X size={11} color="#8c89a8" />
                <Text className="text-muted dark:text-dark-muted text-[11.5px]">移除精確定位</Text>
              </Pressable>
            )}
          </View>
        )}

        <Field
          label="營業時間"
          value={hours}
          onChangeText={setHours}
          placeholder="例如：06:00–17:00"
          autoCapitalize="none"
        />
        <Field
          label={`價錢${trip.symbol ? `（${trip.symbol}）` : ''}`}
          value={price}
          onChangeText={setPrice}
          placeholder="0 = 免費，留空 = 不顯示"
          keyboardType="number-pad"
        />
        <Field
          label="備註"
          value={note}
          onChangeText={setNote}
          placeholder="想記的小提醒"
          multiline
        />
      </FormSheet>

      {/* 地圖選點彈窗（與 FormSheet 互斥開啟）：手動點的位置沒有 placeId */}
      <LocationPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initial={coords ? { lat: coords.lat, lng: coords.lng } : null}
        fallbackCenter={fallbackCenter}
        onConfirm={(lat, lng) => setCoords({ placeId: null, lat, lng })}
      />
    </>
  )
}
