// Expo SDK 51 + NativeWind v4 + Expo Router 的 babel 設定
// 注意：nativewind 插件必須在 reanimated 插件之前
module.exports = function (api) {
  const isTest = api.env('test')
  return {
    // Jest 只驗證元件行為，不需要轉換 NativeWind 樣式；略過它也能避免測試環境
    // 去解析原生 Worklets/Reanimated Babel 外掛。
    presets: isTest
      ? ['babel-preset-expo']
      : [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // 之後要用 reanimated 動畫時再加回 'react-native-reanimated/plugin'
    plugins: [],
  }
}
