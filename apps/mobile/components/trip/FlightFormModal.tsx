// 航班新增／編輯彈窗（交通住宿頁使用）
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { Search } from 'lucide-react-native'
import { Field, FormSheet } from '@/components/common/FormSheet'
import { DateField } from '@/components/common/DateField'
import { ApiError } from '@/services/api'
import { flightSearchService } from '@/services/flightSearchService'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import { formatDate, formatTime, parseDateTime, toDateTimeInput } from '@/utils/format'
import type { Flight, FlightSearchResult } from '@/types/api'

interface FlightFormModalProps {
  visible: boolean
  onClose: () => void
  tripId: string
  // 編輯模式傳航班；新增模式傳 null
  flight: Flight | null
}

export function FlightFormModal({ visible, onClose, tripId, flight }: FlightFormModalProps) {
  const reloadCurrent = useTripStore((s) => s.reloadCurrent)

  const [flightNumber, setFlightNumber] = useState('')
  const [airline, setAirline] = useState('')
  const [departureAirport, setDepartureAirport] = useState('')
  const [arrivalAirport, setArrivalAirport] = useState('')
  const [departureTime, setDepartureTime] = useState('')
  const [arrivalTime, setArrivalTime] = useState('')
  const [aircraft, setAircraft] = useState('')
  const [accessNote, setAccessNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 航班搜尋（AviationStack）：按搜尋鈕才查（免費額度僅 100 次／月），null = 尚未搜過
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<FlightSearchResult[] | null>(null)

  useEffect(() => {
    if (!visible) return
    setError(null)
    setResults(null)
    setFlightNumber(flight?.flightNumber ?? '')
    setAirline(flight?.airline ?? '')
    setDepartureAirport(flight?.departureAirport ?? '')
    setArrivalAirport(flight?.arrivalAirport ?? '')
    setDepartureTime(flight ? toDateTimeInput(flight.departureTime) : '')
    setArrivalTime(flight ? toDateTimeInput(flight.arrivalTime) : '')
    setAircraft(flight?.aircraft ?? '')
    setAccessNote(flight?.accessNote ?? '')
  }, [visible, flight])

  // 用航班編號查 AviationStack，點結果自動帶入各欄位
  async function handleSearch() {
    const query = flightNumber.trim()
    if (!query || searching) return
    setSearching(true)
    setError(null)
    try {
      setResults(await flightSearchService.search(query))
    } catch (e) {
      setResults(null)
      setError(e instanceof ApiError ? e.message : '搜尋失敗，請稍後再試')
    } finally {
      setSearching(false)
    }
  }

  // 點選搜尋結果：帶入編號／航空公司／機場／時間／機型（文字可再手動修改）
  function pickResult(r: FlightSearchResult) {
    setFlightNumber(r.flightNumber)
    if (r.airline) setAirline(r.airline)
    if (r.departureAirport) setDepartureAirport(r.departureAirport)
    if (r.arrivalAirport) setArrivalAirport(r.arrivalAirport)
    if (r.departureTime) setDepartureTime(toDateTimeInput(r.departureTime))
    if (r.arrivalTime) setArrivalTime(toDateTimeInput(r.arrivalTime))
    if (r.aircraft) setAircraft(r.aircraft)
    setResults(null)
  }

  async function handleSubmit() {
    setError(null)
    if (
      !flightNumber.trim() ||
      !departureAirport.trim() ||
      !arrivalAirport.trim() ||
      !departureTime.trim() ||
      !arrivalTime.trim()
    ) {
      setError('航班編號、起降機場與起降時間為必填')
      return
    }
    const depIso = parseDateTime(departureTime)
    const arrIso = parseDateTime(arrivalTime)
    if (!depIso || !arrIso) {
      setError('時間格式請用 YYYY-MM-DD HH:mm，例如 2026-07-01 09:25')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        flightNumber: flightNumber.trim().toUpperCase(),
        departureAirport: departureAirport.trim().toUpperCase(),
        arrivalAirport: arrivalAirport.trim().toUpperCase(),
        departureTime: depIso,
        arrivalTime: arrIso,
      }
      if (flight) {
        await tripService.updateFlight(tripId, flight.id, {
          ...payload,
          airline: airline.trim() || null,
          aircraft: aircraft.trim() || null,
          accessNote: accessNote.trim() || null,
        })
      } else {
        await tripService.createFlight(tripId, {
          ...payload,
          airline: airline.trim() || undefined,
          aircraft: aircraft.trim() || undefined,
          accessNote: accessNote.trim() || undefined,
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
    if (!flight) return
    setSubmitting(true)
    setError(null)
    try {
      await tripService.removeFlight(tripId, flight.id)
      await reloadCurrent()
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '刪除失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormSheet
      visible={visible}
      title={flight ? '編輯航班' : '新增航班'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
      onDelete={flight ? handleDelete : undefined}
    >
      {/* 航班編號 + AviationStack 搜尋（按鈕觸發，點結果帶入全部欄位） */}
      <View>
        <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">
          航班編號 *
        </Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            value={flightNumber}
            onChangeText={setFlightNumber}
            onSubmitEditing={handleSearch}
            placeholder="例如：BR198"
            placeholderTextColor="#8c89a8"
            autoCapitalize="characters"
            className="flex-1 bg-surface-2 dark:bg-dark-surface-2 border border-line dark:border-dark-line rounded-[11px] px-3.5 py-3 text-ink dark:text-dark-ink text-[15px]"
          />
          <Pressable
            onPress={handleSearch}
            disabled={searching || !flightNumber.trim()}
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
              查不到此航班，可直接手動填寫
            </Text>
          ) : (
            <View className="mt-2 border border-line dark:border-dark-line rounded-[11px] overflow-hidden">
              {results.slice(0, 5).map((r, i) => (
                <Pressable
                  key={`${r.flightNumber}-${r.departureTime ?? i}`}
                  onPress={() => pickResult(r)}
                  className={`px-3.5 py-2.5 active:opacity-70 bg-surface dark:bg-dark-surface ${
                    i > 0 ? 'border-t border-line dark:border-dark-line' : ''
                  }`}
                >
                  <Text className="text-ink dark:text-dark-ink text-[13.5px] font-bold">
                    {r.flightNumber}
                    {r.airline ? ` · ${r.airline}` : ''}
                  </Text>
                  <Text className="text-muted dark:text-dark-muted text-[11.5px] mt-0.5">
                    {r.departureAirport ?? '—'} → {r.arrivalAirport ?? '—'}
                    {r.departureTime
                      ? ` · ${formatDate(r.departureTime)} ${formatTime(r.departureTime)}`
                      : ''}
                    {r.arrivalTime ? ` – ${formatTime(r.arrivalTime)}` : ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
      </View>
      <Field
        label="航空公司"
        value={airline}
        onChangeText={setAirline}
        placeholder="例如：長榮航空"
      />
      <Field
        label="出發機場 *（IATA）"
        value={departureAirport}
        onChangeText={setDepartureAirport}
        placeholder="TPE"
        autoCapitalize="characters"
        maxLength={3}
      />
      <Field
        label="抵達機場 *（IATA）"
        value={arrivalAirport}
        onChangeText={setArrivalAirport}
        placeholder="NRT"
        autoCapitalize="characters"
        maxLength={3}
      />
      <DateField
        label="出發時間 *"
        mode="datetime"
        value={departureTime}
        onChange={setDepartureTime}
        placeholder="2026-07-01 09:25"
      />
      <DateField
        label="抵達時間 *"
        mode="datetime"
        value={arrivalTime}
        onChange={setArrivalTime}
        placeholder="2026-07-01 13:40"
      />
      <Field
        label="機型"
        value={aircraft}
        onChangeText={setAircraft}
        placeholder="例如：A350-900"
        autoCapitalize="characters"
      />
      <Field
        label="前往機場方式"
        value={accessNote}
        onChangeText={setAccessNote}
        placeholder="例如：搭機場捷運直達 T2，提早 3 小時出發"
        multiline
      />
    </FormSheet>
  )
}
