import type { ExpoConfig } from 'expo/config'

// Expo App 設定
const config: ExpoConfig = {
  name: '旅遊 App',
  slug: 'travel-app',
  scheme: 'travel-app',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  // 原生 Maps SDK 使用各平台專用金鑰；瀏覽器金鑰只供 Expo Web 使用。
  // （Expo Go：iOS 用 Apple 圖層、Android 內建 Google 圖層）
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.travelapp.mobile',
    config: { googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY },
  },
  android: {
    package: 'com.travelapp.mobile',
    config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY } },
  },
  web: { bundler: 'metro', output: 'single' },
  plugins: ['expo-router'],
  experiments: { typedRoutes: true },
}

export default config
