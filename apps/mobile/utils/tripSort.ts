// 旅程總覽的排序：進行中的排最前，其餘依日期離今天的遠近排
export function sortTripsByRelevance<T extends { startDate: string; endDate: string }>(
  trips: T[],
  now: Date,
): T[] {
  // 與今天的距離：行程期間內為 0，否則取距離較近一端的毫秒差
  const distance = (t: T) => {
    const start = new Date(t.startDate).getTime()
    const end = new Date(t.endDate).getTime()
    const ts = now.getTime()
    if (ts >= start && ts <= end) return 0
    return ts < start ? start - ts : ts - end
  }
  return [...trips].sort((a, b) => distance(a) - distance(b))
}

// 行程是否正在進行中（總覽卡片的「進行中」徽章用）
export function isOngoing(t: { startDate: string; endDate: string }, now: Date): boolean {
  const ts = now.getTime()
  return ts >= new Date(t.startDate).getTime() && ts <= new Date(t.endDate).getTime()
}
