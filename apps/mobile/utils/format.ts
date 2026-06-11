// 日期/時間格式化共用工具

const DOW = ['日', '一', '二', '三', '四', '五', '六']

// "2026-05-12T00:00:00.000Z" → "5/12 (一)"
export function formatDate(iso: string): string {
  const d = new Date(iso)
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${m}/${day} (${DOW[d.getDay()]})`
}

// "2026-05-12T00:50:00.000Z" → "08:50"（顯示為當地時間，取 hh:mm）
export function formatTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 起訖日期短格式 "5/12 – 5/15"
export function formatDateRange(startIso: string, endIso: string): string {
  const s = new Date(startIso)
  const e = new Date(endIso)
  return `${s.getMonth() + 1}/${s.getDate()} – ${e.getMonth() + 1}/${e.getDate()}`
}

// 旅程天數（含頭含尾）
export function tripLengthDays(startIso: string, endIso: string): number {
  const s = new Date(startIso)
  const e = new Date(endIso)
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
  return diff + 1
}
