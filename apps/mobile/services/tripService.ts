// 行程 API 封裝（含巢狀的行程日／活動／飯店／航班）
import { apiFetch } from './api'
import type {
  CreateDayActivityPayload,
  CreateFlightPayload,
  CreatePackingItemPayload,
  CreateTripPayload,
  CreateHotelPayload,
  CreateTripDayPayload,
  DayActivity,
  Flight,
  Hotel,
  PackingItem,
  TripDay,
  TripDetail,
  TripSummary,
  UpdateDayActivityPayload,
  UpdateFlightPayload,
  UpdateHotelPayload,
  UpdatePackingItemPayload,
  UpdateTripDayPayload,
  UpdateTripPayload,
} from '@/types/api'

export const tripService = {
  list() {
    return apiFetch<TripSummary[]>('/api/trips')
  },

  detail(id: string) {
    return apiFetch<TripDetail>(`/api/trips/${id}`)
  },

  create(payload: CreateTripPayload) {
    return apiFetch<TripSummary>('/api/trips', { method: 'POST', body: payload })
  },

  update(id: string, payload: UpdateTripPayload) {
    return apiFetch<TripSummary>(`/api/trips/${id}`, { method: 'PUT', body: payload })
  },

  remove(id: string) {
    return apiFetch<{ id: string }>(`/api/trips/${id}`, { method: 'DELETE' })
  },

  // ─── 行程日 ───
  createDay(tripId: string, payload: CreateTripDayPayload) {
    return apiFetch<TripDay>(`/api/trips/${tripId}/days`, { method: 'POST', body: payload })
  },

  updateDay(tripId: string, dayId: string, payload: UpdateTripDayPayload) {
    return apiFetch<TripDay>(`/api/trips/${tripId}/days/${dayId}`, {
      method: 'PUT',
      body: payload,
    })
  },

  removeDay(tripId: string, dayId: string) {
    return apiFetch<{ id: string }>(`/api/trips/${tripId}/days/${dayId}`, { method: 'DELETE' })
  },

  // ─── 每日活動 ───
  createActivity(tripId: string, dayId: string, payload: CreateDayActivityPayload) {
    return apiFetch<DayActivity>(`/api/trips/${tripId}/days/${dayId}/activities`, {
      method: 'POST',
      body: payload,
    })
  },

  updateActivity(tripId: string, activityId: string, payload: UpdateDayActivityPayload) {
    return apiFetch<DayActivity>(`/api/trips/${tripId}/activities/${activityId}`, {
      method: 'PUT',
      body: payload,
    })
  },

  removeActivity(tripId: string, activityId: string) {
    return apiFetch<{ id: string }>(`/api/trips/${tripId}/activities/${activityId}`, {
      method: 'DELETE',
    })
  },

  // ─── 飯店 ───
  createHotel(tripId: string, payload: CreateHotelPayload) {
    return apiFetch<Hotel>(`/api/trips/${tripId}/hotels`, { method: 'POST', body: payload })
  },

  updateHotel(tripId: string, hotelId: string, payload: UpdateHotelPayload) {
    return apiFetch<Hotel>(`/api/trips/${tripId}/hotels/${hotelId}`, {
      method: 'PUT',
      body: payload,
    })
  },

  removeHotel(tripId: string, hotelId: string) {
    return apiFetch<{ id: string }>(`/api/trips/${tripId}/hotels/${hotelId}`, {
      method: 'DELETE',
    })
  },

  // ─── 行程航班 ───
  createFlight(tripId: string, payload: CreateFlightPayload) {
    return apiFetch<Flight>(`/api/trips/${tripId}/flights`, { method: 'POST', body: payload })
  },

  updateFlight(tripId: string, flightId: string, payload: UpdateFlightPayload) {
    return apiFetch<Flight>(`/api/trips/${tripId}/flights/${flightId}`, {
      method: 'PUT',
      body: payload,
    })
  },

  removeFlight(tripId: string, flightId: string) {
    return apiFetch<{ id: string }>(`/api/trips/${tripId}/flights/${flightId}`, {
      method: 'DELETE',
    })
  },

  // ─── 行李清單 ───
  createPackingItem(tripId: string, payload: CreatePackingItemPayload) {
    return apiFetch<PackingItem>(`/api/trips/${tripId}/packing`, { method: 'POST', body: payload })
  },

  updatePackingItem(tripId: string, itemId: string, payload: UpdatePackingItemPayload) {
    return apiFetch<PackingItem>(`/api/trips/${tripId}/packing/${itemId}`, {
      method: 'PUT',
      body: payload,
    })
  },

  removePackingItem(tripId: string, itemId: string) {
    return apiFetch<{ id: string }>(`/api/trips/${tripId}/packing/${itemId}`, {
      method: 'DELETE',
    })
  },
}
