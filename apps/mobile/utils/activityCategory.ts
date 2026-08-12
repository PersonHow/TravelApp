// 活動類別 → 顯示用標籤、顏色(對應設計檔的 spot/food/shop/move)
import type { ActivityType } from '@/types/api'

export interface CategoryStyle {
  label: string
  color: string // 文字/邊框色(也用在景點的 dot)
}

const STYLES: Record<ActivityType, CategoryStyle> = {
  spot: { label: '景點', color: '#5a8fcf' },
  food: { label: '餐飲', color: '#ef7a8e' },
  shop: { label: '購物', color: '#9a7fd6' },
  move: { label: '交通', color: '#8c89a8' },
}

export function categoryStyle(type: ActivityType | null | undefined): CategoryStyle {
  return STYLES[type ?? 'move'] ?? STYLES.move
}

// 價錢顯示:0 → 免費、有值 → ¥600、null → 空字串
export function formatPrice(
  price: number | null | undefined,
  symbol: string | null | undefined,
): string {
  if (price == null) return ''
  if (price === 0) return '免費'
  return `${symbol ?? ''}${price.toLocaleString('en-US')}`
}

// 換算台幣:¥600 * 0.21 ≈ NT$126(設計檔的「≈ NT$X」)
export function toTWD(
  price: number | null | undefined,
  fx: number | null | undefined,
): string | null {
  if (price == null || price === 0 || fx == null) return null
  return `NT$${Math.round(price * fx).toLocaleString('en-US')}`
}
