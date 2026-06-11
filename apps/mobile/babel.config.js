// Expo SDK 51 + NativeWind v4 + Expo Router 的 babel 設定
// 注意：nativewind 插件必須在 reanimated 插件之前
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // 之後要用 reanimated 動畫時再加回 'react-native-reanimated/plugin'
    plugins: [],
  }
}
