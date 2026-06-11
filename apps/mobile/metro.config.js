// Metro 設定：套 NativeWind v4 + 支援 monorepo（npm workspaces）
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

// monorepo 根目錄（用來找 hoisted 過去的 node_modules）
const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// 1) 把 monorepo 根目錄加入 watcher，否則改其他 workspace 的程式碼不會 reload
config.watchFolders = [workspaceRoot]
// 2) 解析 node_modules 時，同時看本地與 root，避免 hoist 後找不到套件
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
// 3) 關掉「往上層找 node_modules」的階層查找，限制只用我們指定的兩個位置
config.resolver.disableHierarchicalLookup = true

module.exports = withNativeWind(config, { input: './global.css' })
