import type { ExpoConfig } from 'expo/config'

// Expo App 設定
const config: ExpoConfig = {
  name: '旅遊 App',
  slug: 'travel-app',
  scheme: 'travel-app',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  // Maps SDK 金鑰只在 Development Build / 正式 build 生效；Expo Go 開發不需要
  // （Expo Go：iOS 用 Apple 圖層、Android 內建 Google 圖層）
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.travelapp.mobile',
    config: { googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
  },
  android: {
    package: 'com.travelapp.mobile',
    config: { googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY } },
  },
  web: { bundler: 'metro', output: 'single' },
  plugins: ['expo-router'],
  experiments: { typedRoutes: true },
}

export default config
