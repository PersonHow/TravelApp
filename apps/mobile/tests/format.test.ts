import {
  combineDateTime,
  hotelNights,
  isToday,
  parseDateTime,
  timeToHHmm,
  toDateTimeInput,
  tripLengthDays,
} from '@/utils/format'

describe('parseDateTime（表單日期時間字串 → ISO）', () => {
  it('只有日期：解析成當天 00:00（當地時間）', () => {
    const iso = parseDateTime('2026-07-01')
    expect(iso).toBeTruthy()
    const d = new Date(iso!)
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 7, 1])
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0])
  })

  it('日期 + 時間（空格或 T 分隔）都能解析', () => {
    for (const input of ['2026-07-01 15:30', '2026-07-01T15:30']) {
      const d = new Date(parseDateTime(input)!)
      expect([d.getHours(), d.getMinutes()]).toEqual([15, 30])
    }
  })

  it('不合法輸入回 undefined（含 JS Date 會默默進位的值）', () => {
    expect(parseDateTime('')).toBeUndefined()
    expect(parseDateTime('abc')).toBeUndefined()
    expect(parseDateTime('07/01/2026')).toBeUndefined()
    expect(parseDateTime('2026-02-30')).toBeUndefined() // 2 月沒有 30 號
    expect(parseDateTime('2026-13-01')).toBeUndefined() // 沒有 13 月
    expect(parseDateTime('2026-07-01 25:00')).toBeUndefined() // 沒有 25 點
  })

  it('與 toDateTimeInput 互為往返', () => {
    const iso = parseDateTime('2026-07-01 15:30')!
    expect(toDateTimeInput(iso)).toBe('2026-07-01 15:30')
  })
})

describe('combineDateTime（某天日期 + HH:mm → ISO）', () => {
  const DAY = '2026-07-04T00:00:00.000Z'

  it('合法時間：回傳該日當地時間的 ISO', () => {
    const iso = combineDateTime(DAY, '09:30')
    expect(iso).toBeTruthy()
    const d = new Date(iso!)
    expect([d.getHours(), d.getMinutes()]).toEqual([9, 30])
    // 跟基準日是同一個「當地日期」
    expect(d.getDate()).toBe(new Date(DAY).getDate())
  })

  it('單位數小時也接受（9:30）', () => {
    const d = new Date(combineDateTime(DAY, '9:30')!)
    expect([d.getHours(), d.getMinutes()]).toEqual([9, 30])
  })

  it('空字串回 null（代表清空欄位）', () => {
    expect(combineDateTime(DAY, '')).toBeNull()
    expect(combineDateTime(DAY, '   ')).toBeNull()
  })

  it('格式錯誤回 undefined（與 null 區分，呼叫端據此擋存檔）', () => {
    expect(combineDateTime(DAY, '24:00')).toBeUndefined()
    expect(combineDateTime(DAY, '09:60')).toBeUndefined()
    expect(combineDateTime(DAY, '930')).toBeUndefined()
    expect(combineDateTime(DAY, 'am 9:30')).toBeUndefined()
  })
})

describe('timeToHHmm', () => {
  it('null 回空字串（表單初始值）', () => {
    expect(timeToHHmm(null)).toBe('')
  })

  it('ISO 轉當地 HH:mm，個位數補零', () => {
    // 用當地時間建構，避免測試結果依賴時區
    const d = new Date(2026, 6, 1, 8, 5)
    expect(timeToHHmm(d.toISOString())).toBe('08:05')
  })
})

describe('isToday（以當地時區比對年月日）', () => {
  it('今天的任何時刻都算今天', () => {
    const now = new Date()
    expect(isToday(now.toISOString())).toBe(true)
    // 當地今天的 00:00 也算（跨時區時 ISO 的 UTC 日期可能不同天）
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0)
    expect(isToday(midnight.toISOString())).toBe(true)
  })

  it('昨天與明天都不算', () => {
    const now = new Date()
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12)
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12)
    expect(isToday(yesterday.toISOString())).toBe(false)
    expect(isToday(tomorrow.toISOString())).toBe(false)
  })
})

describe('hotelNights（以日曆日差計算晚數）', () => {
  // 用當地時間建構，避免測試結果依賴時區
  const local = (y: number, m: number, d: number, h: number) =>
    new Date(y, m - 1, d, h).toISOString()

  it('10/10 15:00 入住、10/13 11:00 退房是 3 晚', () => {
    expect(hotelNights(local(2026, 10, 10, 15), local(2026, 10, 13, 11))).toBe(3)
  })

  it('深夜入住、隔天早上退房也算 1 晚', () => {
    expect(hotelNights(local(2026, 10, 10, 23), local(2026, 10, 11, 8))).toBe(1)
  })

  it('日期顛倒不回負數', () => {
    expect(hotelNights(local(2026, 10, 13, 15), local(2026, 10, 10, 11))).toBe(0)
  })
})

describe('tripLengthDays（含頭含尾）', () => {
  it('7/1 ~ 7/5 是 5 天', () => {
    expect(tripLengthDays('2026-07-01T00:00:00Z', '2026-07-05T00:00:00Z')).toBe(5)
  })

  it('當天來回是 1 天', () => {
    expect(tripLengthDays('2026-07-01T00:00:00Z', '2026-07-01T00:00:00Z')).toBe(1)
  })
})
