# GCP 部署操作稿（第 01 階段）

最後更新：2026-10-20。此稿對應 [正式部署準備](./deployment-readiness.md)，帳密取得方式見 [帳號與密鑰交接](./credential-inventory.md)。Cloud SQL 執行個體已存在並持續計費；LINE 設定不在本階段。

## 目前部署狀態

- Web：<https://travel-app-web-1005667918403.asia-east1.run.app>
- API：<https://travel-app-api-1005667918403.asia-east1.run.app>；`/health` 已回傳 200。
- Cloud SQL：`project-3a786408-a9b3-44ba-9eb:asia-east1:tung-project` 內的 `travel_app`；migration job `travel-app-migrate-r7szq` 成功。
- API image：`6d8b0298-298f-409f-9a93-e05066dcf126`。Web image：`722a4c58-ca6f-4c9d-b6fc-a3124433ef08`。
- API CORS 已限定 Web origin；正式 Web key 已限定該 Web referrer 及 Maps JavaScript API；後端 key 限定 Places 與 Routes API。
- Web 的首頁、政策頁及旅程深連結回傳 200。正式 Web 已用一次性帳號完成註冊、建立家庭與兩日旅程、在 Day 1 新增活動；Google 地圖選點畫面可載入。正式 API 另已驗證登入、飯店、航班、記帳、行李與景點搜尋。測試資料已清除，瀏覽器已登出。
- Cloud Monitoring 每五分鐘檢查 API `/health` 和 Web 首頁，失敗告警寄到 `feztung@gmail.com`。每月 TWD 500 的預算警示已設定 50%、90%、100% 門檻，範圍只包含本專案；警示不會自動停止計費。
- 營運者已於 2026-10-20 確認目前的隱私權政策、服務條款及資料刪除文字可用。Cloud SQL 備份已還原到獨立執行個體，驗證 `travel_app` 資料庫、專用使用者與 9 筆 migration 紀錄；暫時執行個體及驗證 job 均已刪除。

## 架構與網址

- 地區：Cloud Run、Cloud SQL、Artifact Registry 選 `asia-east1`（台灣）。
- Web 與 API：兩個 Cloud Run 服務，各自取得 HTTPS `run.app` 網址，不必先購買自有網域。Web 容器用 Nginx 處理 SPA 路徑。
- 資料庫：Cloud SQL for PostgreSQL。API 與 migration job 透過 Cloud SQL Unix socket 連線。
- 金鑰：Secret Manager 保存資料庫 URL、JWT 與後端 API 金鑰；Web build 只用公開變數。Cloud Run 的 `min-instances=0` 可在閒置時歸零。

## 1. 核對專案與費用

目標專案是 `project-3a786408-a9b3-44ba-9eb`，已以 `feztung@gmail.com` 登入並核對啟用帳單。本機預設仍可能指向 `silver-ivy-501607-s2`，它**不是** Travel App 專案。所有命令明確帶入目標專案。Cloud SQL 執行中的執行個體會持續計費。

```sh
gcloud auth login
export TRAVEL_GCP_PROJECT='project-3a786408-a9b3-44ba-9eb'
export TRAVEL_GCP_REGION='asia-east1'
test "$TRAVEL_GCP_PROJECT" != 'silver-ivy-501607-s2'
gcloud projects describe "$TRAVEL_GCP_PROJECT" --format='table(projectId,name,lifecycleState)'
gcloud billing projects describe "$TRAVEL_GCP_PROJECT" --format='table(billingEnabled,billingAccountName)'
```

已建立 `Travel App monthly TWD 500` 預算，帳單帳戶幣別為 TWD，預設通知收件人包含帳單管理員 `feztung@gmail.com`。現有 `tung-project` Cloud SQL 是 `asia-east1`、PostgreSQL 18、`db-f1-micro`，已有自動備份與時間點復原。已確認自動備份成功，並建立 2026-10-20 的隨選備份 `1792426966995`。此備份已成功還原到 `travel-app-restore-drill-20261020`，只讀驗證工作 `travel-app-restore-verify-8gdgn` 顯示 9 筆 migration、0 個使用者與 0 趟旅程，符合建立測試帳號前的備份狀態。驗證工作已刪除，隨選備份暫時保留作還原點。

## 2. 基礎資源

1. Cloud Run、Cloud SQL Admin、Artifact Registry、Cloud Build 與 Secret Manager API 已啟用。
2. `asia-east1` 的 Artifact Registry Docker repository `travel-app` 已建立。
3. 在現有 Cloud SQL `tung-project` 中已建立 `travel_app` 資料庫及獨立使用者，未碰預設 `postgres` 資料庫。
4. `travel-app-runtime` 已授予 Cloud SQL Client，並只對本 App 的四個 Secret 授予 Secret Accessor；`travel-app-build` 只可讀取建置來源、寫入本 App 的映像庫與 Cloud Logging。
5. `travel-app-database-url`、`travel-app-jwt-secret`、`travel-app-google-places-key`、`travel-app-google-routes-key` 已建立。後端另建只允許 Places（舊版）與 Routes API 的專用金鑰。啟用航班／AI 時再加入對應 Secret。不要將 Secret 值寫進命令列、Git、Cloud Build 或前端環境變數。
6. Firebase `addFirebase` 回傳 403；官方文件指出權限或尚未接受 Firebase 條款都可能造成此錯誤。Web 改用 Cloud Run，無需 Firebase。

Prisma 的 `DATABASE_URL` 可透過 Cloud SQL socket 連線，形式如下；密碼中的特殊字元須 URL encode：

```text
postgresql://travel_app:<URL_ENCODED_PASSWORD>@localhost:5432/travel_app?host=/cloudsql/<PROJECT_ID>:asia-east1:<INSTANCE_ID>
```

Cloud Run 服務與 job 都必須連接同一個 Cloud SQL instance，否則容器內沒有該 socket。

## 3. 建置容器並部署 API

`cloudbuild.yaml` 會從同一份工作區建立 API runtime 與 migration 兩個 image，以 Cloud Build ID 作版本標籤。`.gcloudignore` 和 `.dockerignore` 排除 `.env` 與本機產物。建置前先用 `gcloud meta list-files-for-upload` 檢查上傳清單，確認沒有任何 `.env`。

```sh
gcloud builds submit --project "$TRAVEL_GCP_PROJECT" --config cloudbuild.yaml \
  --service-account "projects/$TRAVEL_GCP_PROJECT/serviceAccounts/travel-app-build@$TRAVEL_GCP_PROJECT.iam.gserviceaccount.com" .
```

從 Cloud Build 結果記下 `BUILD_ID`，設定：

```sh
export TRAVEL_BUILD_ID='<Cloud Build ID>'
export TRAVEL_SQL_CONNECTION="$TRAVEL_GCP_PROJECT:asia-east1:tung-project"
export TRAVEL_WEB_ORIGIN='https://travel-app-web-1005667918403.asia-east1.run.app'
export TRAVEL_API_IMAGE="$TRAVEL_GCP_REGION-docker.pkg.dev/$TRAVEL_GCP_PROJECT/travel-app/api:$TRAVEL_BUILD_ID"
export TRAVEL_MIGRATION_IMAGE="$TRAVEL_GCP_REGION-docker.pkg.dev/$TRAVEL_GCP_PROJECT/travel-app/migration:$TRAVEL_BUILD_ID"
```

先部署並執行 migration job；正式環境不可執行 `migrate reset`、`db push --force-reset` 或 demo seed。

```sh
gcloud run jobs deploy travel-app-migrate \
  --project "$TRAVEL_GCP_PROJECT" --region "$TRAVEL_GCP_REGION" \
  --image "$TRAVEL_MIGRATION_IMAGE" \
  --service-account "travel-app-runtime@$TRAVEL_GCP_PROJECT.iam.gserviceaccount.com" \
  --set-cloudsql-instances "$TRAVEL_SQL_CONNECTION" \
  --set-secrets 'DATABASE_URL=travel-app-database-url:latest' \
  --tasks 1 --max-retries 0
gcloud run jobs execute travel-app-migrate \
  --project "$TRAVEL_GCP_PROJECT" --region "$TRAVEL_GCP_REGION" --wait
```

確認 migration 成功後部署 API。下方使用已取得的正式 Web origin：

```sh
gcloud run deploy travel-app-api \
  --project "$TRAVEL_GCP_PROJECT" --region "$TRAVEL_GCP_REGION" \
  --image "$TRAVEL_API_IMAGE" \
  --service-account "travel-app-runtime@$TRAVEL_GCP_PROJECT.iam.gserviceaccount.com" \
  --add-cloudsql-instances "$TRAVEL_SQL_CONNECTION" \
  --set-secrets 'DATABASE_URL=travel-app-database-url:latest,JWT_SECRET=travel-app-jwt-secret:latest,GOOGLE_PLACES_API_KEY=travel-app-google-places-key:latest,GOOGLE_ROUTES_API_KEY=travel-app-google-routes-key:latest' \
  --set-env-vars "NODE_ENV=production,CORS_ORIGINS=$TRAVEL_WEB_ORIGIN" \
  --allow-unauthenticated --min-instances 0 --max-instances 2
```

記下 API HTTPS URL，驗證 `/health`。如需航班或 AI，再為 API 新增 Secret 綁定。不要把本機 `.env` 原樣上傳。

## 4. 建置並部署 Web

正式 Web origin 已確定。使用僅允許 Maps JavaScript API、HTTP referrer 限制為該 Web URL 的瀏覽器金鑰，透過 [cloudbuild.web.yaml](../cloudbuild.web.yaml) 建置並部署。後端金鑰只留在 Secret Manager；正式 Web bundle 絕不可使用原本與後端共用的本機金鑰。

```sh
gcloud builds submit --project "$TRAVEL_GCP_PROJECT" --config cloudbuild.web.yaml \
  --service-account "projects/$TRAVEL_GCP_PROJECT/serviceAccounts/travel-app-build@$TRAVEL_GCP_PROJECT.iam.gserviceaccount.com" \
  --substitutions "_API_URL=https://travel-app-api-1005667918403.asia-east1.run.app,_WEB_KEY=<瀏覽器金鑰>,_OPERATOR_NAME=大頭寶藏,_SUPPORT_EMAIL=feztung@gmail.com" .
gcloud run deploy travel-app-web --project "$TRAVEL_GCP_PROJECT" \
  --region "$TRAVEL_GCP_REGION" --image '<本次 Web image URL>' \
  --port 8080 --allow-unauthenticated --min-instances 0 --max-instances 2
```

Cloud Run API 的 CORS origin 應與 Web 的 `run.app` 網址完全相同。若之後改用自有網域，須同步更新 Web build、API CORS 與 Google referrer 限制。

## 5. 正式驗收

1. `/health`、註冊、登入、新家庭、新旅程與 Day 1 活動可用，且不依賴 seed 或 AI。
2. 地圖、景點、路線、航班、住宿、記帳、行李與四個公開頁面在正式 HTTPS 網址可用。
3. 瀏覽器 bundle 不含伺服器密鑰；API CORS 只接受正式 Web origin；Google 金鑰限制與額度警示已核對。
4. Cloud SQL 自動備份與一次還原演練成功；Cloud Run 故障告警與回復方式已記錄。
5. 使用者已確認隱私權政策、服務條款及資料刪除聯絡窗口。第 01 階段的 Web／API／資料庫與還原驗收已完成。

## 6. 監控與回復

- Uptime checks：`Travel App API health`、`Travel App Web`；每五分鐘使用 HTTPS 檢查。告警政策 `Travel App Web or API unavailable` 連接營運者 Email 通知管道。
- API 故障時先看 Cloud Run `travel-app-api` 最新 revision 的 logs，檢查 Cloud SQL 連線與 Secret 權限；若是新版本造成，將流量切回前一個正常 revision。
- Web 故障時檢查 `travel-app-web` revision 與 Nginx logs；可將流量切回前一個正常 revision，再檢查 Web build 的公開環境變數。
- 任何資料庫還原應先還原到**另一個** Cloud SQL 執行個體並驗證，不要直接覆蓋 `tung-project`。還原成功後再決定切換方式。
