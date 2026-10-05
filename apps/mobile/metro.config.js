// Metro 設定：Expo 已能依 npm workspaces 自動建立 monorepo 解析路徑。
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const projectRoot = __dirname
const config = getDefaultConfig(projectRoot)

module.exports = withNativeWind(config, { input: './global.css' })
