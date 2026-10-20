import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { DayFormModal } from '@/components/trip/DayFormModal'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import type { TripDay, TripDetail } from '@/types/api'

jest.mock('@/store/useThemeStore', () => ({
  useThemeStore: (selector: (state: { dark: boolean }) => unknown) => selector({ dark: false }),
}))
jest.mock('@/services/tripService', () => ({
  tripService: { createDay: jest.fn(), updateDay: jest.fn(), removeDay: jest.fn() },
}))
jest.mock('@/services/api', () => ({
  ApiError: class ApiError extends Error {},
}))

const baseTrip = {
  id: 'trip-1',
  startDate: '2026-07-01T00:00:00.000Z',
  endDate: '2026-07-03T00:00:00.000Z',
  tripDays: [],
} as unknown as TripDetail

beforeEach(() => {
  useTripStore.setState({ reloadCurrent: async () => {} })
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('DayFormModal', () => {
  it('空白旅程可以手動新增第一天', async () => {
    const createDay = jest
      .spyOn(tripService, 'createDay')
      .mockResolvedValue({ id: 'day-1' } as TripDay)
    const { getByText } = render(
      <DayFormModal visible trip={baseTrip} day={null} onClose={jest.fn()} />,
    )

    fireEvent.press(getByText('儲存'))
    await waitFor(() => expect(createDay).toHaveBeenCalled())
    expect(createDay.mock.calls[0][0]).toBe('trip-1')
    expect(createDay.mock.calls[0][1]).toMatchObject({ dayNumber: 1 })
  })

  it('含活動的 Day 須二次確認才會送出刪除', async () => {
    const removeDay = jest.spyOn(tripService, 'removeDay').mockResolvedValue({ id: 'day-1' })
    const day = {
      id: 'day-1',
      dayNumber: 1,
      date: baseTrip.startDate,
      theme: null,
      activities: [{ id: 'activity-1' }],
    } as TripDay
    const trip = { ...baseTrip, tripDays: [day] }
    const { getByText } = render(<DayFormModal visible trip={trip} day={day} onClose={jest.fn()} />)

    getByText('這一天有 1 項活動。確認刪除後，活動也會一併刪除。')
    fireEvent.press(getByText('刪除'))
    expect(removeDay).not.toHaveBeenCalled()
    fireEvent.press(getByText('確認刪除？'))
    await waitFor(() => expect(removeDay).toHaveBeenCalledWith('trip-1', 'day-1', true))
  })
})
