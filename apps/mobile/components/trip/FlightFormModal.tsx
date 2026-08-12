// 航班新增／編輯彈窗（交通住宿頁使用）
import { useEffect, useState } from 'react'
import { Field, FormSheet } from '@/components/common/FormSheet'
import { DateField } from '@/components/common/DateField'
import { ApiError } from '@/services/api'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import { parseDateTime, toDateTimeInput } from '@/utils/format'
import type { Flight } from '@/types/api'

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

  useEffect(() => {
    if (!visible) return
    setError(null)
    setFlightNumber(flight?.flightNumber ?? '')
    setAirline(flight?.airline ?? '')
    setDepartureAirport(flight?.departureAirport ?? '')
    setArrivalAirport(flight?.arrivalAirport ?? '')
    setDepartureTime(flight ? toDateTimeInput(flight.departureTime) : '')
    setArrivalTime(flight ? toDateTimeInput(flight.arrivalTime) : '')
    setAircraft(flight?.aircraft ?? '')
    setAccessNote(flight?.accessNote ?? '')
  }, [visible, flight])

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
      <Field
        label="航班編號 *"
        value={flightNumber}
        onChangeText={setFlightNumber}
        placeholder="例如：BR198"
        autoCapitalize="characters"
      />
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
