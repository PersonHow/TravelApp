# 第 01 階段正式部署準備

最後更新：2026-10-20。此文件記錄部署操作順序；GCP Web、API、資料庫與第 01 階段正式驗收已完成。

## 已確認的方向

- 用途：先供個人日本旅遊使用；LINE 官方帳號與主動提醒可等實際需要時再啟用。
- 公開營運者名稱：大頭寶藏。公開聯絡 Email：feztung@gmail.com。正式發布前仍需確認下方政策草稿的內容。
- 雲端平台：GCP 專案 `project-3a786408-a9b3-44ba-9eb`，帳單已啟用。Cloud Run 提供 Web 與 API；Cloud SQL `tung-project` 提供 PostgreSQL。Firebase 服務條款／權限擋住加掛，故 Web 改由 Cloud Run 提供 HTTPS。
- 已在現有 Cloud SQL 中建立 `travel_app` 專用資料庫與使用者，正式 migration job 已成功。原有執行個體有自動備份；隨選備份已還原到獨立執行個體，9 筆 migration 紀錄驗證成功。
- 正式 API 已通過一次性帳號的註冊、登入、家庭、兩日旅程、首日活動、飯店、航班、記帳、行李及景點搜尋驗收，測試資料已清除。API 與 Web 已設定每五分鐘一次的 HTTPS uptime check，故障告警寄往 `feztung@gmail.com`。
- 已設定本專案每月 TWD 500 的預算警示（50%、90%、100%）；這是通知門檻，不會自動停用服務。營運者已確認目前公開政策文字可用。
- 原本本機 Web 與後端共用同一把 Google 金鑰。正式環境已分成後端專用金鑰（Places／Routes API）和 Web 專用金鑰（Maps JavaScript API、僅允許正式 Web referrer）。舊本機金鑰沒有修改。
- 已新增 [GCP 部署操作稿](./gcp-deployment.md)、API／Web Cloud Build 設定與 `.gcloudignore`。本機上傳清單不含 `.env`。舊預設專案 `silver-ivy-501607-s2` 不是目標專案。

## 後續選項

- Web 與 API 已有 Cloud Run HTTPS 網址；若之後需要自有網域，再設定 DNS。
- 暫時還原執行個體已刪除。隨選備份 `1792426966995` 先保留作為還原點；後續可依備份留存需求清理。
- 原生 Maps 金鑰留到第 04 階段。

## 環境變數

| 位置 | 必要設定 |
| --- | --- |
| API Secret Manager | `DATABASE_URL`、`JWT_SECRET`、`GOOGLE_PLACES_API_KEY`、`GOOGLE_ROUTES_API_KEY`；有啟用航班或 AI 時再放 `AVIATION_STACK_API_KEY`、`ANTHROPIC_API_KEY` |
| API 普通環境變數 | `NODE_ENV=production`、`CORS_ORIGINS=https://正式-Web-網域`、`PORT`（由平台提供） |
| Web build 環境 | `EXPO_PUBLIC_API_URL=https://正式-API-網域`、`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`、`EXPO_PUBLIC_OPERATOR_NAME`、`EXPO_PUBLIC_SUPPORT_EMAIL` |

`EXPO_PUBLIC_*` 會進入公開 JavaScript bundle。不要把任何伺服器金鑰、資料庫密碼或 JWT secret 放進這些變數。正式環境不得使用 `mock` 或範本密碼。

## 部署順序

1. 核對現有 Cloud SQL 的 SSL、自動備份及時間點復原設定，使用 `travel_app` 專用資料庫與使用者。
2. 由專案根目錄執行 [cloudbuild.yaml](../cloudbuild.yaml) 建置 API 與 migration image，推送至 `asia-east1` 的 Artifact Registry。
3. 配置 API 的 Secret 與環境變數，先以 migration image 執行 `prisma migrate deploy`（預設 CMD）。此 job 只需資料庫連線，不對外開 HTTP。正式環境不得執行 `migrate reset`、`db push --force-reset` 或 demo seed。
4. 部署 API，確認 `https://正式-API-網域/health` 回傳成功，並設定錯誤告警及備份檢查。
5. 在正式 Web build 環境設定上述四個公開變數，執行 `npm run build:web --workspace @travel-app/mobile`。腳本會拒絕缺少正式 HTTPS API 網址、營運者與聯絡資訊的建置。
6. 將 `apps/mobile/dist` 包入 Web 容器並部署到 Cloud Run。Nginx 將未知路徑 rewrite 到 `index.html`，讓 `/privacy`、`/terms`、`/data-deletion`、`/contact` 與旅程深連結正常載入。
7. 在 API 的 `CORS_ORIGINS` 僅加入正式 Web origin。從正式 Web 逐項驗證註冊、手動旅程、Days、活動、地圖、航班、飯店、記帳、行李及四個公開頁面。
8. 驗證 Google 瀏覽器金鑰的 HTTP referrer 限制，以及後端金鑰的 API／服務來源限制；檢查前端 bundle 未包含伺服器金鑰。

## 發布前驗收

- CI type-check、lint、format、API／mobile 測試、API production audit 及 Docker build 通過。
- Web／iOS／Android bundle 通過；新帳號無 seed 或 AI 也能建立首日活動。
- 正式 Web/API 均為 HTTPS；API CORS 只接受正式來源。
- PostgreSQL migration 成功，且備份、還原、監控及回復方案已實測。
- 公開政策內容與聯絡資料經營運者確認，資料刪除要求有實際處理窗口。

## 目前已知的建置工具通報

API production workspace 的 `npm audit --omit=dev --workspace @travel-app/api` 為 0 通報。整個 monorepo 的 `npm audit --omit=dev` 仍會報 `tar@6.2.1` 的 Critical；它來自 Expo SDK 51 的 CLI／打包工具，不存在於 API 正式容器的 production dependencies，也不是靜態 Web bundle 的執行期程式碼。`tar` 6.x 沒有修補版，直接強制替換為 7.x 會跨主要版本；留待原生 App 階段逐版升級 Expo 時處理。建置工作應在受控的 CI 環境執行，不處理不受信任的 tar 檔。
