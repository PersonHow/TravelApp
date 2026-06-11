// 暗色/淺色偏好,透過 AsyncStorage 持久化
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface ThemeState {
  dark: boolean
  hasHydrated: boolean
  setDark: (v: boolean) => void
  toggle: () => void
  setHydrated: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      dark: false,
      hasHydrated: false,
      setDark: (v) => set({ dark: v }),
      toggle: () => set({ dark: !get().dark }),
      setHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'travel-app-theme',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
      partialize: (s) => ({ dark: s.dark }),
    },
  ),
)
