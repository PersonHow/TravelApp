# Travel App 現行架構

## 系統邊界

Travel App 是 npm workspaces 管理的模組化單體：

- `apps/mobile`：Expo Router + React Native Web，共用 iOS、Android、Web UI。
- `apps/api`：Express REST API。controller 只處理 HTTP 邊界，service 負責權限與商業規則，Prisma 負責 PostgreSQL。
- `packages/shared-types`：前後端 JSON wire format；執行期輸入仍由 API 的 Zod schema 驗證。

資料流固定為：頁面／元件 → mobile service → `apiFetch` → route → controller → domain service → Prisma。

後端設定載入順序固定為：執行環境注入值 → monorepo 根目錄 `.env` → `apps/api/.env`。正式容器只依賴執行環境注入；本機共用的第三方金鑰集中放根目錄，API 子目錄檔案僅用來補足缺少的值。

## 產品交付方向

目前採用 **LINE-first、Web-first、原生上架後置**：先將既有 Expo Web 作為 LIFF App，加入 LINE 帳號綁定、旅程分享及 Messaging API 提醒；iOS／Android 保留共用程式碼，但 App Store／Google Play 上架不是第一個發布門檻。

完整階段、資料模型、安全要求與驗收條件以 [roadmap.md](./roadmap.md) 為準。

## 權限矩陣

| 能力 | OWNER | ADMIN | MEMBER |
| --- | --- | --- | --- |
| 讀取家庭與旅程 | ✓ | ✓ | ✓ |
| 編輯每日活動、航班、飯店、記帳、行李 | ✓ | ✓ | ✓ |
| 建立／修改／刪除整趟旅程 | ✓ | ✓ | — |
| 邀請家庭成員 | ✓ | ✓ | — |
| AI 規劃整趟旅程 | ✓ | ✓ | — |

## 景點與活動

兩者不是重複的主要資料：

- `Attraction + TripAttraction`：未排入日期的收藏／wishlist，可保留第三方 Places 身分。
- `DayActivity`：已排入某一天的活動，是行程、景點牆與地圖的唯一顯示來源。
- `DayActivity.placeId/lat/lng` 是排程當下的地點快照；外部景點資料更新不應悄悄改寫既有行程。

新增功能不可再建立第三套地點模型。若未來提供「從收藏排入行程」，應由 service 明確把 Attraction 複製成 DayActivity snapshot。

## 尚未啟用

LIFF、LINE Login 與 Messaging API 是下一階段目標，尚未進入目前執行中的架構。Socket.io、Firebase Realtime Database 與 Expo Notifications 改為後置候選方案；早期通知優先由 LINE Messaging API 承擔。任何即時資料層正式加入前，仍須先定義事件來源、衝突處理及 PostgreSQL 作為最終資料來源的規則。
