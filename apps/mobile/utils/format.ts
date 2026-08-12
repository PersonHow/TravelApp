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

// 表單顯示用："...T08:50:00Z" → "08:50"；null → 空字串
export function timeToHHmm(iso: string | null): string {
  if (!iso) return ''
  return formatTime(iso)
}

// 把「某一天的日期」+「HH:mm 字串」組成 ISO（給活動的 startTime 等欄位）
// 輸入空字串回 null（代表清空）、格式錯誤回 undefined（代表不合法）
export function combineDateTime(dateIso: string, hhmm: string): string | null | undefined {
  const trimmed = hhmm.trim()
  if (!trimmed) return null
  const m = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return undefined
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return undefined
  const d = new Date(dateIso)
  d.setHours(h, min, 0, 0)
  return d.toISOString()
}

// 解析表單的日期時間字串："2026-07-01" 或 "2026-07-01 15:00" → ISO；格式錯誤回 undefined
export function parseDateTime(input: string): string | undefined {
  const m = input.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/)
  if (!m) return undefined
  const y = Number(m[1])
  const mo = Number(m[2])
  const day = Number(m[3])
  const h = m[4] ? Number(m[4]) : 0
  const min = m[5] ? Number(m[5]) : 0
  const d = new Date(y, mo - 1, day, h, min)
  // JS Date 會把超界值進位（2026-02-30 → 3/2、25:00 → 隔天 1:00），逐項比對擋掉
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== mo - 1 ||
    d.getDate() !== day ||
    d.getHours() !== h ||
    d.getMinutes() !== min
  ) {
    return undefined
  }
  return d.toISOString()
}

// 表單顯示用：ISO → "YYYY-MM-DD HH:mm"
export function toDateTimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 表單顯示用：ISO → "YYYY-MM-DD"（日期欄位，不含時間）
export function toDateInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 旅程天數（含頭含尾）
export function tripLengthDays(startIso: string, endIso: string): number {
  const s = new Date(startIso)
  const e = new Date(endIso)
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24))
  return diff + 1
}
