import type { ExpoConfig } from 'expo/config'

// Expo App 設定
const config: ExpoConfig = {
  name: '旅遊 App',
  slug: 'travel-app',
  scheme: 'travel-app',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  ios: { supportsTablet: false, bundleIdentifier: 'com.travelapp.mobile' },
  android: { package: 'com.travelapp.mobile' },
  web: { bundler: 'metro', output: 'single' },
  plugins: ['expo-router'],
  experiments: { typedRoutes: true },
}

export default config
