# Travel App 產品路線圖

最後更新：2026-10-20

**目前狀態：** 第 01 階段「核心整理與正式環境」的 Web、API、資料庫、Google 金鑰、政策頁、預算警示及監控已部署；正式 Web/API 手動旅程與 Cloud SQL 備份還原驗收通過。LINE Login、LIFF 與官方帳號依使用需求留到下一階段。

## 產品方向

Travel App 採用 **LINE-first、Web-first、原生上架後置** 的路線。

第一階段的核心體驗不是要求家人先安裝 App，而是：

1. 從家庭 LINE 群組點開旅程連結。
2. 在 LINE 的 LIFF 瀏覽器中直接登入並查看旅程。
3. 分享旅程給家庭成員。
4. 透過 LINE 官方帳號收到必要的行程、航班與住宿提醒。

Expo Web、iOS 與 Android 共用現有程式碼；原生 App 保留，但 App Store／Google Play 上架不再是第一個發布門檻。

## 目標架構

```text
家庭 LINE 群組
  └─ LIFF URL
      └─ Expo Web（既有 apps/mobile）
          └─ Express API（既有 apps/api）
              └─ PostgreSQL

LINE 官方帳號
  ├─ Webhook ────────────────┐
  └─ Messaging API ← 排程器 ← API／PostgreSQL

iOS／Android App（後續上架）
  └─ 與 LIFF 共用相同 API、權限與資料
```

## 現階段不優先的項目

- App Store 與 Google Play 上架。
- Socket.io 即時同步。
- Firebase Realtime Database。
- Expo Notifications。
- AI 即時異動重排行程 Agent。

早期通知先由 LINE Messaging API 承擔；只有在 LINE 無法滿足需求時，才增加原生推播或即時資料層。

## Phase 0：整理既有核心流程

**進度（2026-10-20）：** 已補上新旅程自動建立 Days、手動新增／編輯／刪除 Day 介面及後端日期範圍檢查；含活動的 Day 須明確確認刪除。API production audit 已清零，測試與三平台 export 通過。正式 Web/API、獨立 Google 金鑰及 HTTPS 網址已就緒，新帳號已在正式 Web 建立首日活動。整個 monorepo 仍有 Expo SDK 51 打包工具 `tar` 通報，細節見 [deployment-readiness.md](./deployment-readiness.md)。

目標：在接 LINE 前，先確保新使用者不靠種子資料或 AI 也能完成基本旅程。

- 補上 TripDay 新增、編輯、刪除的使用者介面。
- 新旅程可依日期範圍建立 Day 1～Day N，或讓使用者自行調整。
- 修正 production dependency 安全通報。
- 啟動測試資料庫後重新確認全部 API 整合測試。
- 清理已過期的地圖、API 金鑰與功能狀態文件。
- 將 Google Maps Web key 與後端 server key 分開並設定來源限制。

完成條件：

- 全新帳號可完成「建立家庭 → 建立旅程 → 建立天數 → 新增活動」。
- type-check、lint、format、API tests、mobile tests 全部通過。
- Web／iOS／Android Expo export 全部通過。

## Phase 1：LIFF MVP 與 LINE 帳號綁定

目標：使用者能從 LINE 直接開啟現有 Travel App。

### 平台設定

- 建立 LINE Developers Provider。
- 在同一個 Provider 下建立 LINE Login Channel。
- 建立 LIFF App，Endpoint 指向正式 HTTPS Web 網址。
- 部署 Expo Web、Express API 與 PostgreSQL。
- 建立隱私權政策與服務條款頁面。

### 前端

- 建立 Web-only LINE adapter，避免原生平台直接載入 LIFF SDK。
- 加入 LIFF 初始化、登入狀態與錯誤降級處理。
- 將 LINE ID Token 傳給後端驗證。
- 已綁定使用者直接登入；未綁定使用者先登入／註冊既有帳號再完成綁定。
- 支援從 LIFF URL 深連結到指定旅程。
- 保留一般瀏覽器及原生 App 的 Email／密碼登入。

### 後端與資料庫

新增 `LineAccount`，最小欄位如下：

```text
id
userId        unique
lineUserId    unique
createdAt
updatedAt
```

預計新增端點：

```text
POST   /api/auth/line
POST   /api/auth/line/link
DELETE /api/auth/line/link
```

安全規則：

- 後端只接受 LINE ID Token／Access Token，不信任前端傳來的 LINE user ID 或個人資料。
- Token 必須向 LINE 驗證 channel ID、有效期限及 nonce。
- Channel secret 與 access token 只放正式環境 Secret Manager，不進 Git 或前端 bundle。
- 第一版不依賴 LINE Email 權限，也不建立假的 Email；未綁定者沿用現有註冊流程。
- 使用者必須能隨時解除 LINE 綁定。

預計環境變數：

```text
EXPO_PUBLIC_LIFF_ID
LINE_LOGIN_CHANNEL_ID
LINE_LOGIN_CHANNEL_SECRET
WEB_APP_URL
```

完成條件：

- LINE 內、外部瀏覽器及原生 App 三種入口都能使用。
- 已綁定帳號能從 LINE 一鍵登入。
- 未綁定帳號有清楚且安全的綁定流程。
- 深連結只能開啟使用者有權限查看的旅程。

## Phase 2：LINE 分享、家庭邀請與官方帳號

目標：以 LINE 取代目前只接受已註冊 Email 的邀請體驗。

- 建立 LINE Official Account 與 Messaging API Channel，並放在相同 Provider。
- 加入 `liff.shareTargetPicker()` 分享旅程邀請。
- 建立具有效期、單次／限定次數及雜湊保存的邀請 token。
- 受邀者登入後才加入指定家庭，不能只靠可猜測的 trip ID。
- 建立 `/api/line/webhook`。
- 驗證 `x-line-signature` 後才處理 Webhook。
- Webhook 必須保留原始 request body；不能在驗證前只使用解析後的 JSON。
- 加入 LINE 帳號綁定／解除綁定流程。
- 建立 Rich Menu，至少包含「我的旅程」與「通知設定」。

預計新增資料：

```text
TripInvite
- id
- tripId
- createdById
- tokenHash
- expiresAt
- usedAt
```

完成條件：

- 使用者可以把安全的邀請連結分享到家庭 LINE 群組。
- 未登入者完成登入後才加入家庭。
- 過期、重複使用或無效邀請會被拒絕。
- Webhook 偽造簽章測試必須通過。

## Phase 3：LINE 行程提醒

目標：以少量、明確且可關閉的訊息提供實際價值。

第一批通知：

- 明日行程摘要。
- 集合時間提醒。
- 航班起飛前提醒。
- 飯店入住提醒。

需要新增：

- `NotificationPreference`：使用者／旅程／通知類型與開關。
- `NotificationDelivery`：預定時間、狀態、重試次數及冪等鍵。
- 雲端排程器或背景工作處理器。
- LINE push message service。
- 訊息使用量監控與月額上限。

通知原則：

- 預設不發大量活動異動訊息。
- 使用者必須主動加入官方帳號並同意通知。
- 每種通知可個別關閉，且提供解除綁定入口。
- 同一提醒不得因重試重複發送。
- Flex Message 只放必要摘要與「開啟旅程」按鈕。

## Phase 4：原生 App 與商店上架

LIFF 版本穩定後才進入：

- 將 Expo SDK 51 分階段升到執行時受支援的穩定版本。
- 建立 EAS Development Build。
- iPhone／Android 實機驗證地圖、SecureStore、導覽與深連結。
- 建立 EAS production profile。
- TestFlight 與 Google Play 封閉測試。
- 準備 App icon、啟動畫面、截圖、隱私權標示及商店文案。
- 最後才支付並啟用商店開發者帳號。

Expo SDK 51 不阻擋 LIFF MVP，但原生公開發布前必須完成升級。

## 品質與發布門檻

每個 Phase 都必須：

- 使用獨立功能分支與可回復提交。
- 不提交任何真正的 LINE／Google／Anthropic／AviationStack secret。
- API 新功能具備授權、輸入錯誤、第三方失敗及成功路徑測試。
- type-check、lint、format 與既有測試通過。
- Web、iOS、Android bundle 不因 Web-only LINE SDK 受到影響。
- 文件與 `.env.example` 同步更新。

正式公開前另外必須：

- 完成隱私權政策、服務條款及刪除帳號／解除綁定流程。
- 完成 API、資料庫及 Web 的備份與監控。
- 設定正式網域、HTTPS、CORS、Secret Manager 及資料庫 migration job。
- 完成 Google／LINE API 額度及費用告警。

## 成本策略

- LIFF Web 發布不需要 Apple Developer Program。
- LINE Messaging API 可從免費方案開始，主動推播超過額度才升級。
- 初期主要成本為 Web、API、PostgreSQL、網域與第三方 API 用量。
- Apple Developer Program 與 Google Play 帳號延後到 Phase 4 才申請。

## 下一個實作批次

依序執行：

1. 使用者在正式 Web 註冊個人帳號，開始建立自己的旅程。
2. 實際需要 LINE 登入與分享時，再建立 LINE Provider、Login Channel 與 LIFF 測試 App。

