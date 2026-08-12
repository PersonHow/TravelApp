import { categoryStyle, formatPrice, toTWD } from '@/utils/activityCategory'

describe('formatPrice（價錢顯示）', () => {
  it('null/undefined 回空字串（不顯示價錢區塊）', () => {
    expect(formatPrice(null, '¥')).toBe('')
    expect(formatPrice(undefined, '¥')).toBe('')
  })

  it('0 顯示「免費」，不能被當成沒填', () => {
    expect(formatPrice(0, '¥')).toBe('免費')
  })

  it('有值就帶幣別符號 + 千分位', () => {
    expect(formatPrice(600, '¥')).toBe('¥600')
    expect(formatPrice(1234567, '¥')).toBe('¥1,234,567')
  })

  it('沒設定幣別符號時只顯示數字', () => {
    expect(formatPrice(600, null)).toBe('600')
  })
})

describe('toTWD（台幣換算）', () => {
  it('¥600 × 0.21 ≈ NT$126（四捨五入到整數）', () => {
    expect(toTWD(600, 0.21)).toBe('NT$126')
  })

  it('沒價錢、免費、或沒設匯率都不換算（回 null）', () => {
    expect(toTWD(null, 0.21)).toBeNull()
    expect(toTWD(0, 0.21)).toBeNull()
    expect(toTWD(600, null)).toBeNull()
  })

  it('大額帶千分位', () => {
    expect(toTWD(1000000, 0.21)).toBe('NT$210,000')
  })
})

describe('categoryStyle（活動類別樣式）', () => {
  it('四種類別都有自己的標籤', () => {
    expect(categoryStyle('spot').label).toBe('景點')
    expect(categoryStyle('food').label).toBe('餐飲')
    expect(categoryStyle('shop').label).toBe('購物')
    expect(categoryStyle('move').label).toBe('交通')
  })

  it('沒填類別時退回交通樣式（與 kanban 顯示行為一致）', () => {
    expect(categoryStyle(null)).toEqual(categoryStyle('move'))
    expect(categoryStyle(undefined)).toEqual(categoryStyle('move'))
  })
})
