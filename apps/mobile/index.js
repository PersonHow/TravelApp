// 本地 entry 跳板（monorepo 必要）
// dev server 用 URL 路徑（/index.bundle）從專案根目錄找這支檔案；
// 內部的 bare import 'expo-router/entry' 才會走 metro.config 的 nodeModulesPaths，
// 解析到 hoist 在 repo 根目錄 node_modules 的 expo-router。
// 若直接把 package.json main 設成 'expo-router/entry'，dev server 會去
// apps/mobile/node_modules 找而 404（見 CLAUDE.md 已知問題）。
import 'expo-router/entry'
