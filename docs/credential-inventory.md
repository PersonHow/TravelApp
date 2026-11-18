# Travel App 帳號與密鑰交接

最後更新：2026-10-20。正式專案：`project-3a786408-a9b3-44ba-9eb`。請只在自己的本機或 GCP Console 查看密鑰，不要貼進聊天、Git、Issue 或前端程式碼。

## 登入帳號

| 用途 | 帳號／身分 | 取得方式 |
| --- | --- | --- |
| GCP 專案管理 | `feztung@gmail.com` | 使用你的 Google 帳號登入；密碼由你自己的 Google 帳號管理，我沒有取得或變更。 |
| Travel App 正式站 | 尚無你的個人 App 帳號 | 到 [正式 Web 註冊頁](https://travel-app-web-1005667918403.asia-east1.run.app/register)自行設定 Email 與密碼。驗收用的三組一次性帳號及資料已刪除。 |
| Cloud SQL App 使用者 | `travel_app`，資料庫 `travel_app`，執行個體 `tung-project` | 密碼是下面 `travel-app-database-url` Secret 的 URL 密碼部分；若要輪替，須同時更新 Cloud SQL 使用者密碼與 Secret。 |
| Cloud SQL 管理使用者 | `postgres`（原有） | 專案原本就有；本階段沒有讀取或變更其密碼。需要時由你在 Cloud SQL Console 重設。 |
| Cloud Run 服務帳號 | `travel-app-runtime@project-3a786408-a9b3-44ba-9eb.iam.gserviceaccount.com` | 使用 GCP 代管身分，沒有建立可下載的金鑰檔或密碼。 |
| Cloud Build 服務帳號 | `travel-app-build@project-3a786408-a9b3-44ba-9eb.iam.gserviceaccount.com` | 使用 GCP 代管身分，沒有建立可下載的金鑰檔或密碼。 |
| LINE Login／官方帳號 | 尚未建立 | 留到下一階段，不存在需要交接的 LINE Channel 密鑰。 |

## Secret Manager

在本機已登入 `feztung@gmail.com` 的 `gcloud` 後，以下命令會**直接把密鑰顯示在你的終端**：

```sh
gcloud secrets versions access latest --project=project-3a786408-a9b3-44ba-9eb --secret=travel-app-database-url
gcloud secrets versions access latest --project=project-3a786408-a9b3-44ba-9eb --secret=travel-app-jwt-secret
gcloud secrets versions access latest --project=project-3a786408-a9b3-44ba-9eb --secret=travel-app-google-places-key
gcloud secrets versions access latest --project=project-3a786408-a9b3-44ba-9eb --secret=travel-app-google-routes-key
```

也可到 [GCP Secret Manager](https://console.cloud.google.com/security/secret-manager?project=project-3a786408-a9b3-44ba-9eb) 選擇對應 Secret 的最新版本查看。`travel-app-database-url` 是完整 PostgreSQL 連線字串，包含經 URL 編碼的 `travel_app` 密碼。Places 與 Routes 兩個 Secret 目前保存同一把後端專用 Google API 金鑰；它僅允許這兩種 API。

Web 地圖金鑰屬於**公開瀏覽器金鑰**，會出現在前端 bundle；已限制為正式 Web referrer 與 Maps JavaScript API。它的 GCP API Keys 資源 ID 是 `f27ea987-9dd7-45a4-bf3d-e366808213b0`。原本本機 `.env` 使用的舊金鑰沒有變更，可能仍供其他專案使用。

## 輪替提醒

- 更換 `travel_app` 資料庫密碼時，更新 Cloud SQL 使用者密碼與 `travel-app-database-url` Secret 的新版本，然後重新部署 API 和 migration job，最後確認 `/health` 與登入。
- 更換 JWT Secret 會使現有登入憑證失效；在 Secret Manager 建立新版本並重新部署 API。
- 更換 Google API 金鑰時，後端 Secret 新版本需重新部署 API；Web 瀏覽器金鑰需重新建置與部署 Web。
