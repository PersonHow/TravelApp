// 響應式斷點 hook：對應設計檔 860px(網頁版.html 也是這個斷點)
import { useWindowDimensions } from 'react-native'

const DESKTOP_BREAKPOINT = 860

export function useIsDesktop() {
  const { width } = useWindowDimensions()
  return width >= DESKTOP_BREAKPOINT
}
