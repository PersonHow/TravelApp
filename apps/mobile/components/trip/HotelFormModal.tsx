// 飯店新增／編輯彈窗（交通住宿頁使用）
import { useEffect, useState } from 'react'
import { Field, FormSheet } from '@/components/common/FormSheet'
import { DateField } from '@/components/common/DateField'
import { ApiError } from '@/services/api'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import { parseDateTime, toDateTimeInput } from '@/utils/format'
import type { Hotel } from '@/types/api'

interface HotelFormModalProps {
  visible: boolean
  onClose: () => void
  tripId: string
  // 編輯模式傳飯店；新增模式傳 null
  hotel: Hotel | null
}

export function HotelFormModal({ visible, onClose, tripId, hotel }: HotelFormModalProps) {
  const reloadCurrent = useTripStore((s) => s.reloadCurrent)

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [bookingRef, setBookingRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setError(null)
    setName(hotel?.name ?? '')
    setAddress(hotel?.address ?? '')
    setCheckIn(hotel ? toDateTimeInput(hotel.checkIn) : '')
    setCheckOut(hotel ? toDateTimeInput(hotel.checkOut) : '')
    setBookingRef(hotel?.bookingRef ?? '')
  }, [visible, hotel])

  async function handleSubmit() {
    setError(null)
    if (!name.trim() || !checkIn.trim() || !checkOut.trim()) {
      setError('名稱、入住與退房時間為必填')
      return
    }
    const checkInIso = parseDateTime(checkIn)
    const checkOutIso = parseDateTime(checkOut)
    if (!checkInIso || !checkOutIso) {
      setError('日期格式請用 YYYY-MM-DD HH:mm，例如 2026-07-01 15:00')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        checkIn: checkInIso,
        checkOut: checkOutIso,
        bookingRef: bookingRef.trim() || undefined,
      }
      if (hotel) {
        await tripService.updateHotel(tripId, hotel.id, {
          ...payload,
          address: address.trim() || null,
          bookingRef: bookingRef.trim() || null,
        })
      } else {
        await tripService.createHotel(tripId, {
          ...payload,
          address: address.trim() || undefined,
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
    if (!hotel) return
    setSubmitting(true)
    setError(null)
    try {
      await tripService.removeHotel(tripId, hotel.id)
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
      title={hotel ? '編輯飯店' : '新增飯店'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
      onDelete={hotel ? handleDelete : undefined}
    >
      <Field label="名稱 *" value={name} onChangeText={setName} placeholder="例如：淺草豪景飯店" />
      <Field
        label="地址／區域"
        value={address}
        onChangeText={setAddress}
        placeholder="例如：台東区花川戸"
      />
      <DateField
        label="入住時間 *"
        mode="datetime"
        value={checkIn}
        onChange={setCheckIn}
        placeholder="2026-07-01 15:00"
      />
      <DateField
        label="退房時間 *"
        mode="datetime"
        value={checkOut}
        onChange={setCheckOut}
        placeholder="2026-07-04 10:00"
      />
      <Field
        label="訂房代號"
        value={bookingRef}
        onChangeText={setBookingRef}
        placeholder="例如：BKG-12345"
        autoCapitalize="characters"
      />
    </FormSheet>
  )
}
