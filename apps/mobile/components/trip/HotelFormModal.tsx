// 飯店新增／編輯彈窗（交通住宿頁使用）
// 名稱欄位可用 Google Places 搜尋帶入名稱／地址／座標（按鈕觸發才查，控制計費）
import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native'
import { MapPin, Search, X } from 'lucide-react-native'
import { Field, FormSheet } from '@/components/common/FormSheet'
import { DateField } from '@/components/common/DateField'
import { ApiError } from '@/services/api'
import { attractionService } from '@/services/attractionService'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import { googleMapsUrl } from '@/utils/mapLink'
import { parseDateTime, toDateTimeInput } from '@/utils/format'
import type { AttractionSearchResult, Hotel } from '@/types/api'

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
  const [roomInfo, setRoomInfo] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [accessNote, setAccessNote] = useState('')
  // 精確座標:搜尋帶入時存,可手動移除
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<AttractionSearchResult[] | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setError(null)
    setResults(null)
    setName(hotel?.name ?? '')
    setAddress(hotel?.address ?? '')
    setCheckIn(hotel ? toDateTimeInput(hotel.checkIn) : '')
    setCheckOut(hotel ? toDateTimeInput(hotel.checkOut) : '')
    setBookingRef(hotel?.bookingRef ?? '')
    setRoomInfo(hotel?.roomInfo ?? '')
    setRoomNumber(hotel?.roomNumber ?? '')
    setAccessNote(hotel?.accessNote ?? '')
    setCoords(hotel?.lat != null && hotel?.lng != null ? { lat: hotel.lat, lng: hotel.lng } : null)
  }, [visible, hotel])

  // 用名稱欄位的文字搜尋 Google Places（與活動表單同一套後端）
  async function handleSearch() {
    const query = name.trim()
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

  // 點選搜尋結果:帶入名稱、地址與精確座標（文字可再手動修改）
  function pickResult(r: AttractionSearchResult) {
    setName(r.name)
    if (r.address) setAddress(r.address)
    setCoords(r.lat != null && r.lng != null ? { lat: r.lat, lng: r.lng } : null)
    setResults(null)
  }

  // 開啟 Google 地圖:有座標用座標定位,沒座標用「名稱＋地址」文字搜尋
  const mapUrl = googleMapsUrl({
    title: name.trim(),
    place: address.trim() || null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    placeId: null,
  })

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
          roomInfo: roomInfo.trim() || null,
          roomNumber: roomNumber.trim() || null,
          accessNote: accessNote.trim() || null,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        })
      } else {
        await tripService.createHotel(tripId, {
          ...payload,
          address: address.trim() || undefined,
          roomInfo: roomInfo.trim() || undefined,
          roomNumber: roomNumber.trim() || undefined,
          accessNote: accessNote.trim() || undefined,
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
      {/* 名稱 + Google 飯店搜尋（按鈕觸發，點結果帶入名稱／地址／座標） */}
      <View>
        <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">
          名稱 *
        </Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleSearch}
            placeholder="例如：淺草豪景飯店"
            placeholderTextColor="#8c89a8"
            className="flex-1 bg-surface-2 dark:bg-dark-surface-2 border border-line dark:border-dark-line rounded-[11px] px-3.5 py-3 text-ink dark:text-dark-ink text-[15px]"
          />
          <Pressable
            onPress={handleSearch}
            disabled={searching || !name.trim()}
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
              找不到相關地點，可直接手動填寫
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
      <Field
        label="地址／區域"
        value={address}
        onChangeText={setAddress}
        placeholder="例如：台東区花川戸"
      />

      {/* 開啟地圖（免金鑰 deep link）＋ 移除精確定位 */}
      {mapUrl && (
        <View className="flex-row flex-wrap items-center gap-2 -mt-1">
          <Pressable
            onPress={() => Linking.openURL(mapUrl)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
          >
            <MapPin size={12} color="#6c7bd6" />
            <Text className="text-accent dark:text-dark-accent text-[12px] font-bold">
              在 Google 地圖開啟
            </Text>
          </Pressable>
          {coords && (
            <Pressable
              onPress={() => setCoords(null)}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full border border-line dark:border-dark-line active:opacity-70"
            >
              <X size={12} color="#8c89a8" />
              <Text className="text-muted dark:text-dark-muted text-[12px]">移除精確定位</Text>
            </Pressable>
          )}
        </View>
      )}

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
        label="房型／間數"
        value={roomInfo}
        onChangeText={setRoomInfo}
        placeholder="例如：雙床房 ×2"
      />
      <Field
        label="房號"
        value={roomNumber}
        onChangeText={setRoomNumber}
        placeholder="例如：1204、1206（入住後填）"
      />
      <Field
        label="訂房代號"
        value={bookingRef}
        onChangeText={setBookingRef}
        placeholder="例如：BKG-12345"
        autoCapitalize="characters"
      />
      <Field
        label="如何抵達"
        value={accessNote}
        onChangeText={setAccessNote}
        placeholder="例如：關西機場搭南海電鐵至難波站，B1 出口徒步 5 分"
        multiline
      />
    </FormSheet>
  )
}
