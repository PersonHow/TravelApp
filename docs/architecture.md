# Travel App 現行架構

## 系統邊界

Travel App 是 npm workspaces 管理的模組化單體：

- `apps/mobile`：Expo Router + React Native Web，共用 iOS、Android、Web UI。
- `apps/api`：Express REST API。controller 只處理 HTTP 邊界，service 負責權限與商業規則，Prisma 負責 PostgreSQL。
- `packages/shared-types`：前後端 JSON wire format；執行期輸入仍由 API 的 Zod schema 驗證。

資料流固定為：頁面／元件 → mobile service → `apiFetch` → route → controller → domain service → Prisma。

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

Socket.io、Firebase Realtime Database 與 Expo Notifications 仍是 roadmap，不屬於目前執行中的架構。正式加入前應先定義事件來源、衝突處理及 PostgreSQL 作為最終資料來源的規則。
