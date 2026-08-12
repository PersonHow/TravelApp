import { isOngoing, sortTripsByRelevance } from '@/utils/tripSort'

// 以 2026-07-07 為「今天」建測資
const NOW = new Date('2026-07-07T12:00:00')

const past = { id: 'past', startDate: '2026-05-01', endDate: '2026-05-05' }
const ongoing = { id: 'ongoing', startDate: '2026-07-05', endDate: '2026-07-10' }
const upcoming = { id: 'upcoming', startDate: '2026-07-20', endDate: '2026-07-25' }
const farFuture = { id: 'far', startDate: '2026-12-01', endDate: '2026-12-10' }

describe('sortTripsByRelevance（旅程總覽的排序）', () => {
  it('進行中的排最前，其餘依離今天遠近', () => {
    const sorted = sortTripsByRelevance([farFuture, past, ongoing, upcoming], NOW)
    expect(sorted.map((t) => t.id)).toEqual(['ongoing', 'upcoming', 'past', 'far'])
  })

  it('不改動原陣列', () => {
    const input = [farFuture, ongoing]
    sortTripsByRelevance(input, NOW)
    expect(input[0].id).toBe('far')
  })
})

describe('isOngoing（進行中徽章）', () => {
  it('今天落在起訖日之間才算進行中', () => {
    expect(isOngoing(ongoing, NOW)).toBe(true)
    expect(isOngoing(past, NOW)).toBe(false)
    expect(isOngoing(upcoming, NOW)).toBe(false)
  })
})
