# 🗾 Travel App — Claude Code 專案說明

> 這份文件是 Claude Code 的長期記憶。每次啟動 session 前請先讀完這份文件。
> 所有開發決策、架構慣例、指令操作都記錄在此，不需每次重複解釋。

---

## 📌 專案概覽

**專案名稱：** Travel App（日本家庭旅遊協調 App）  
**目標平台：** iOS + Android + Web (React Native Web)
**核心功能：**
- 景點、行程、飯店、航班資訊管理
- 家庭成員即時共享行程
- 推播通知（行程提醒）
- Google Maps / Places 整合

---

## 🧰 Tech Stack

### Frontend（手機 App + 網頁）
| 工具 | 版本建議 | 用途 |
|------|----------|------|
| Expo | SDK 51+ | 跨平台 RN 開發框架 |
| React Native | 隨 Expo | 手機 UI |
| TypeScript | 5.x | 型別安全 |
| NativeWind | v4 | Tailwind CSS for RN |
| Expo Router | v3+ | 檔案式路由（tabs + stack）|

### Backend（API Server）
| 工具 | 版本建議 | 用途 |
|------|----------|------|
| Node.js | 20 LTS | 執行環境 |
| Express | 4.x | HTTP 框架 |
| Prisma | 5.x | ORM / DB 存取 |
| Socket.io | 4.x | 即時通訊 |
| TypeScript | 5.x | 型別安全 |

### 資料庫
| 工具 | 用途 |
|------|------|
| PostgreSQL | 主要持久化資料（行程、景點、使用者） |
| Firebase Realtime Database | 即時家庭共享同步（線上狀態、即時位置） |

### 第三方整合
| 服務 | 用途 |
|------|------|
| Google Maps SDK | 地圖顯示 |
| Google Places API | 景點搜尋 |
| AviationStack API | 航班資訊查詢 |
| Expo Notifications | 推播通知 |

---

## 📁 專案資料夾結構

```
travel-app/
├── package.json                 # 根目錄（npm workspaces 設定）
├── apps/
│   ├── mobile/                  # Expo App（前端）
│   │   ├── app/                 # Expo Router 路由目錄
│   │   │   ├── (auth)/          # 登入/註冊
│   │   │   ├── trips.tsx        # 旅程總覽（登入後首頁：卡片列表＋建立旅程）
│   │   │   ├── profile.tsx      # 我的（使用者資訊/深色/登出，總覽右上進入）
│   │   │   ├── trip/[id]/       # 旅程範圍（手機底部 5 tab / 桌面側欄）
│   │   │   │   ├── _layout.tsx  # 載入該旅程 detail + gating + 響應式導覽
│   │   │   │   ├── index.tsx    # 總覽（Hero/DAY/航班/住宿＋編輯行程資訊）
│   │   │   │   ├── schedule.tsx # 行程 kanban（活動 CRUD）
│   │   │   │   ├── attractions.tsx # 景點牆（活動 CRUD）
│   │   │   │   ├── transport.tsx   # 交通住宿（航班/飯店 CRUD）
│   │   │   │   └── phrases.tsx     # 用語（佔位，待做）
│   │   │   ├── index.tsx        # 進入點：依登入導向 /trips 或 /login
│   │   │   └── _layout.tsx      # root Stack + auth redirect
│   │   ├── components/
│   │   │   ├── common/          # 共用元件（Button, Card, Modal）
│   │   │   ├── trip/            # 行程相關元件
│   │   │   ├── attraction/      # 景點相關元件
│   │   │   └── flight/          # 航班相關元件
│   │   ├── hooks/               # 自定義 React Hooks
│   │   ├── services/            # API 呼叫封裝
│   │   ├── store/               # 狀態管理（Zustand）
│   │   ├── types/               # TypeScript 型別定義
│   │   ├── utils/               # 工具函式
│   │   ├── constants/           # 常數（API endpoints、顏色）
│   │   ├── app.config.ts        # Expo 設定
│   │   └── tailwind.config.js   # NativeWind 設定
│   │
│   └── api/                     # Express Backend
│       ├── src/
│       │   ├── routes/          # Express 路由
│       │   ├── controllers/     # 控制器
│       │   ├── services/        # 商業邏輯
│       │   ├── middlewares/     # 中介層（auth、error handling）
│       │   ├── prisma/          # Prisma Client 封裝
│       │   └── types/           # 型別定義
│       ├── prisma/
│       │   ├── schema.prisma    # 資料庫 Schema
│       │   └── migrations/      # DB 遷移紀錄
│       └── tsconfig.json
│
├── packages/
│   └── shared-types/            # 前後端共用型別（純 .d.ts，不需 build）
│       ├── src/
│       │   ├── models.d.ts      # 資料模型 wire format（日期為 ISO 字串）
│       │   ├── api.d.ts         # ApiResponse / Auth / 各 Create·Update payload
│       │   └── index.d.ts       # 統一 export
│       └── package.json         # types 指向 src/index.d.ts
├── docker-compose.yml           # 本機開發環境
├── .env.example                 # 環境變數範本
└── CLAUDE.md                    # 本文件
```

---

## ⚙️ 常用指令

### Monorepo 初始化（第一次 clone 後）

```bash
# 根目錄安裝所有 workspace 依賴（npm workspaces）
npm install

# 初始化資料庫（第一次建立）
cd apps/api && npx prisma migrate dev

# 填入測試資料
cd apps/api && npx prisma db seed
```

### 啟動開發環境

```bash
# 一行同時啟動 PostgreSQL + 後端 API（Docker）
# 後端原始碼 bind mount 進容器，存檔即熱重載；首次或改 schema/package.json 後加 --build
docker-compose up -d
docker-compose up -d --build      # 改了 Dockerfile.dev / schema / 依賴時
docker-compose logs -f api        # 看後端 log（含啟動/錯誤）

# 啟動 Expo App（前端不進 Docker，模擬器/區網連線需原生跑）
cd apps/mobile && npx expo start

# 手機模擬器
npx expo start --ios        # iOS Simulator
npx expo start --android    # Android Emulator

# 關閉（保留資料）／連同資料庫一起清空
docker-compose stop
docker-compose down -v
```

> **Docker 啟動細節（見 `docker-compose.yml` + `apps/api/Dockerfile.dev`）**
> - `postgres` 服務有 healthcheck，`api` 會等 DB 健康才啟動，並在啟動時自動跑 `prisma migrate deploy`
> - 容器內 `DATABASE_URL` 用服務名 `postgres`（非 localhost），由 compose 注入，蓋過 `.env`
> - Prisma 引擎在容器內（linux-musl）重新產生，與 Mac 的不同，故**不**掛載 node_modules
> - 種子資料仍手動跑一次：`docker compose exec api npm run seed`（或本機 `cd apps/api && npx prisma db seed`）
> - 不想用 Docker 跑後端時，仍可 `cd apps/api && npm run dev` 直接在本機啟動（讀 `.env` 的 localhost）

### Prisma 資料庫操作

```bash
# 建立新遷移
cd apps/api && npx prisma migrate dev --name "描述變更內容"

# 套用遷移到正式環境
npx prisma migrate deploy

# 更新 Prisma Client（改完 schema 後必跑）
npx prisma generate

# 開啟 Prisma Studio（視覺化 DB 介面）
npx prisma studio

# 重置 DB（本機開發用，會清除所有資料）
npx prisma migrate reset
```

### 測試與品質

```bash
# 執行所有測試（後端整合測試需要本機 Postgres：先 docker-compose up -d）
npm test

# TypeScript 型別檢查
npm run type-check

# Lint 檢查（ESLint：mobile 用 eslint-config-expo、api 用 typescript-eslint）
npm run lint

# 修正 Lint 錯誤
npm run lint:fix

# Prettier 排版（設定在根目錄 .prettierrc.json；*.md 與 migrations 不排版）
npm run format         # 全部重排
npm run format:check   # 只檢查（CI 用）
```

> 測試框架分工：後端 vitest（Supertest 整合測試）；前端 **jest-expo**（純函式＋元件測試都在 `apps/mobile/tests/`，元件測試用 @testing-library/react-native）

---

## 🗄️ Prisma Schema 重點說明

```
資料表關係：
User ──< FamilyMember >── Family
Trip ──< TripAttraction ──> Attraction
Trip ──< TripDay ──< DayActivity
Trip ──> Hotel
Trip ──> Flight

命名規範：
- 資料表名稱：PascalCase（User, Trip, Attraction）
- 欄位名稱：camelCase（createdAt, userId）
- 關聯欄位：對應資料表名稱 + Id（tripId, userId）
```

**Schema 修改後必做步驟：**
1. 修改 `prisma/schema.prisma`
2. 執行 `npx prisma migrate dev --name "說明"`
3. 執行 `npx prisma generate`
4. 更新對應的 TypeScript 型別

---

## 🔥 Firebase 使用規範

**Firebase Realtime Database 只用於：**
- 家庭成員即時位置共享
- 行程即時更新通知（有人修改行程時）
- 線上狀態顯示

**不要用 Firebase 來：**
- 儲存主要業務資料（改用 PostgreSQL）
- 使用者認證（改用 JWT + PostgreSQL）

**Firebase 資料結構：**
```json
{
  "families": {
    "{familyId}": {
      "members": {
        "{userId}": {
          "isOnline": true,
          "lastSeen": 1234567890,
          "currentLocation": { "lat": 35.6762, "lng": 139.6503 }
        }
      },
      "tripUpdates": {
        "{tripId}": {
          "lastUpdatedBy": "{userId}",
          "lastUpdatedAt": 1234567890,
          "action": "attraction_added"
        }
      }
    }
  }
}
```

---

## 🌐 API 設計規範

### RESTful 路由結構
```
# 認證（不需登入）
POST   /api/auth/register      # 註冊（回 user + access/refresh token）
POST   /api/auth/login         # 登入
POST   /api/auth/refresh       # 用 refresh token 換新 token
GET    /api/auth/me            # 取得目前登入者（需登入）

# 行程（需登入）
GET    /api/trips              # 取得行程列表
POST   /api/trips              # 建立行程
GET    /api/trips/:id          # 取得單一行程
PUT    /api/trips/:id          # 更新行程
DELETE /api/trips/:id          # 刪除行程
GET    /api/trips/:id/attractions    # 行程的景點
POST   /api/trips/:id/attractions    # 加入景點

# 行程巢狀資源（需登入；授權都走 tripService.assertAccess）
# 列表不另設 GET：GET /api/trips/:id 已含 tripDays(activities)/hotels/flights
POST   /api/trips/:id/days                      # 新增一天（dayNumber 重複回 409 CONFLICT）
PUT    /api/trips/:id/days/:dayId               # 更新一天
DELETE /api/trips/:id/days/:dayId               # 刪除一天（活動 cascade 刪除）
POST   /api/trips/:id/days/:dayId/activities    # 新增活動
PUT    /api/trips/:id/activities/:activityId    # 更新活動（傳 tripDayId 可換天）
DELETE /api/trips/:id/activities/:activityId    # 刪除活動
POST   /api/trips/:id/hotels                    # 新增飯店
PUT    /api/trips/:id/hotels/:hotelId           # 更新飯店
DELETE /api/trips/:id/hotels/:hotelId           # 刪除飯店
POST   /api/trips/:id/flights                   # 新增航班（含 aircraft/accessNote）
PUT    /api/trips/:id/flights/:flightId        # 更新航班
DELETE /api/trips/:id/flights/:flightId        # 刪除航班
POST   /api/trips/:id/packing                   # 新增行李項目
PUT    /api/trips/:id/packing/:itemId           # 更新行李項目（改名/勾選）
DELETE /api/trips/:id/packing/:itemId           # 刪除行李項目
GET    /api/trips/:id/phrases                   # 旅遊短句列表（獨立端點，不含在 trip detail）
POST   /api/trips/:id/phrases/generate          # AI 生成短句（無金鑰 503／未填 destination 400／重生成先清舊）
POST   /api/trips/:id/ai-plan                   # AI 規劃行程草稿（限 OWNER/ADMIN；不寫 DB）
POST   /api/trips/:id/ai-plan/apply             # 套用草稿（限 OWNER/ADMIN；dayNumber 已存在則附加活動）

# 家庭（需登入）
POST   /api/families           # 建立家庭（建立者自動成 OWNER）
GET    /api/families           # 我所屬的家庭列表
POST   /api/families/:id/members     # 用 email 邀請成員（找不到回 404、已是成員回 409）

# 第三方搜尋（需登入；未設金鑰時回 503 INTEGRATION_NOT_CONFIGURED）
GET    /api/attractions/search       # 搜尋景點（Google Places）
GET    /api/flights/search           # 搜尋航班（AviationStack）

# 系統
GET    /health                 # 健康檢查（Cloud Run 探活用）
```

### API 回應格式（統一）
```typescript
// 成功
{ "success": true, "data": { ... } }

// 失敗
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

### 常用錯誤碼
| code | HTTP | 意義 |
|------|------|------|
| `BAD_REQUEST` | 400 | 必填欄位缺漏／格式錯誤 |
| `UNAUTHORIZED` | 401 | 缺 token、token 無效或過期（沒登入）|
| `FORBIDDEN` | 403 | 已登入但無權存取該資源（非所屬家庭成員）|
| `NOT_FOUND` | 404 | 找不到資源／路由 |
| `EMAIL_TAKEN` | 409 | 註冊 email 重複 |
| `CONFLICT` | 409 | 資源衝突（如同行程 dayNumber 重複）|
| `INTEGRATION_NOT_CONFIGURED` | 503 | 第三方 API 金鑰未設定 |
| `UPSTREAM_ERROR` | 502 | 第三方服務回應異常 |
| `INTERNAL_ERROR` | 500 | 未預期錯誤 |

### 認證方式
- 使用 JWT Bearer Token
- Header：`Authorization: Bearer <token>`
- Access Token 有效期：7 天；Refresh Token 有效期：30 天
- 密碼以 bcrypt 雜湊後存於 `User.passwordHash`（不存明碼）
- 受保護路由一律掛 `requireAuth` 中介層，驗證通過後把 `userId` 掛到 `req`
- Token payload：`{ userId, type: 'access' | 'refresh' }`

---

## 🛠️ 後端開發規範

### 分層架構（請求流向）
```
route → controller → service → prisma
```
- **route**：定義路徑、掛中介層（`requireAuth` / `asyncHandler`），不寫邏輯
- **controller**：解析 req、驗證必填欄位、呼叫 service、回傳統一格式，**不直接碰 Prisma**
- **service**：商業邏輯與**所有** DB 存取都集中於此
- 新增資源照此模板：`services/xxxService.ts` → `controllers/xxxController.ts` → `routes/xxx.ts` → 在 `routes/index.ts` 掛載

### 授權（authorization）規範
- `requireAuth` 只做**認證**（你是誰），不做授權（你能不能動這筆）
- 凡是隸屬家庭的資源（trips 等），controller 把 `req.userId` 傳進 service，由 service 做成員身分檢查
- 共用檢查：`familyService.assertMember(userId, familyId)` — 非成員一律 `403 FORBIDDEN`
- 角色限定功能用 `familyService.assertRole(userId, familyId, roles)`（成員但角色不符也回 `403`；目前 AI 排行程限 `OWNER`/`ADMIN`）
- 以 trip 為單位的存取用 `tripService.assertAccess(tripId, userId)`：行程不存在回 `404`、存在但非所屬家庭成員回 `403`
- 行程巢狀資源（day / activity / hotel / flight）除了 `assertAccess`，還要驗證「該子資源確實隸屬於這個 trip」（防止拿 A 行程的權限改 B 行程的資料），不屬於回 `404`
- 列表查詢不要回全表，要以「使用者所屬家庭」過濾（範例：`tripService.findAllForUser`）

### 錯誤處理
- 一律 `throw new AppError(statusCode, code, message)`（或 `AppError.notFound()` 等快捷）
- async controller 用 `asyncHandler()` 包起來，拋出的錯誤自動轉交 `errorHandler`
- `errorHandler` 統一輸出 `{ success: false, error: { code, message } }`；非預期錯誤回 500 並記 log

### 其他慣例
- 伺服器 `listen` 在 `0.0.0.0`，手機才能透過 Mac 區網 IP 連線測試
- 第三方整合（Places / AviationStack 等）金鑰未設定時回 `503 INTEGRATION_NOT_CONFIGURED`，不可讓服務 crash
- 進入點 `index.ts` 只負責 listen；Express 設定放 `app.ts`（與啟動分離，方便測試）

---

## 📱 前端開發規範

### NativeWind 使用原則
```typescript
// ✅ 正確：用 className
<View className="flex-1 bg-white p-4">
  <Text className="text-lg font-bold text-gray-800">標題</Text>
</View>

// ❌ 錯誤：混用 StyleSheet
const styles = StyleSheet.create({ container: { flex: 1 } })
```

### TypeScript 型別規範
```typescript
// 所有 API 回應都要定義型別（放在 types/ 目錄）
interface Trip {
  id: string
  title: string
  startDate: Date
  endDate: Date
  familyId: string
  attractions: TripAttraction[]
}

// Hooks 回傳型別要明確標注
const useTrip = (id: string): { trip: Trip | null; loading: boolean; error: Error | null } => { ... }
```

### 狀態管理（Zustand）
```typescript
// store/ 下每個功能一個 store 檔案
// 範例：store/useTripStore.ts
```

### 元件命名規範
- 元件檔案：PascalCase（`TripCard.tsx`）
- Hook 檔案：camelCase 加 use 前綴（`useTrip.ts`）
- 工具函式：camelCase（`formatDate.ts`）
- 常數：UPPER_SNAKE_CASE（`API_BASE_URL`）

---

## 🔐 環境變數

> **分工說明：**
> - **本機開發**：使用 `.env` 檔管理金鑰（不得 commit 進 git）
> - **正式環境（Cloud Run）**：所有金鑰統一存放在 GCP Secret Manager，啟動時自動注入，不依賴 `.env`

**Frontend（`apps/mobile/.env`）：**
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_PROJECT_ID=xxx
```

**Backend（`apps/api/.env`）：**
```
DATABASE_URL=postgresql://USER:PASSWORD@CLOUD_SQL_IP:5432/travel_app?sslmode=require&connection_limit=10
FIREBASE_SERVICE_ACCOUNT_KEY=xxx
JWT_SECRET=xxx
AVIATION_STACK_API_KEY=xxx
GOOGLE_PLACES_API_KEY=xxx
ANTHROPIC_API_KEY=xxx          # AI 生成用；未設定回 503；開發期填 mock 可跳過真實呼叫
ANTHROPIC_MODEL=xxx            # 選填，預設 claude-haiku-4-5
PORT=3000
```

> ⚠️ 永遠不要把 `.env` commit 進 git，只 commit `.env.example`

---

## 🚀 部署架構
部署平台：GCP Cloud Run（asia-east1）
容器：Docker image 推上 Artifact Registry
DB 連線：Cloud Run → Cloud SQL 內網連線

```
常用指令：
- 建立 Docker image : docker build --platform linux/amd64 -f Dockerfile -t asia-east1-docker.pkg.dev/PROJECT/IMAGE .

- 推送 Docker image -> Artifact Registry : docker push asia-east1-docker.pkg.dev/PROJECT/IMAGE

部署到 Cloud Run:
- 後端 API :
```
gcloud run deploy travel-backend \
  --image asia-east1-docker.pkg.dev/PROJECT/REPO/travel-backend:latest \
  --region asia-east1 \
  --platform managed
```

- 前端網頁版 :
```
gcloud run deploy travel-frontend \
  --image asia-east1-docker.pkg.dev/PROJECT/REPO/travel-frontend:latest \
  --region asia-east1 \
  --platform managed
```
```

---

## ☁️ GCP 需開啟的 API

| API | 用途 | 備註 |
|-----|------|------|
| Artifact Registry API | 存放 Docker image | 需手動開啟 |
| Cloud SQL Admin API | 連線 Cloud SQL | 需手動開啟 |
| Secret Manager API | 安全存放 API 金鑰 | 建議開啟 |
| Maps SDK for Android | 手機地圖 | Google Cloud Console |
| Maps SDK for iOS | 手機地圖 | Google Cloud Console |
| Maps JavaScript API | 網頁版地圖 | Google Cloud Console |
| Places API | 景點搜尋 | Google Cloud Console |

> ⚠️ 所有 API 金鑰統一存放在 GCP Secret Manager，不寫進 .env 或程式碼

---

## 📱 前端部署說明
- 網頁版：Expo Web build 打包成靜態檔，部署到 Cloud Run
- 手機版：Expo EAS Build 打包成 .ipa / .apk，上架 App Store / Google Play
- 同一份 code，用 Platform.OS 區分平台差異行為

---

## 🚫 禁止修改的檔案與規則

1. **`prisma/migrations/`** — 已套用的遷移不能手動修改，只能新增
2. **`.env`** — 不能 commit，不能硬編碼在程式碼中
3. **`packages/shared-types/`** — 修改前要先確認前後端都有更新
4. **不要在元件內直接呼叫 fetch** — 一律透過 `services/` 封裝

---

## 🐛 已知問題與特殊處理

| 問題 | 解法 |
|------|------|
| **Expo Router 在 Android 的深層連結** | 在 `app.config.ts` 設定 `scheme: "travel-app"` |
| **NativeWind v4 與 Expo SDK 51** | 在 `babel.config.js` 的 plugins 加入 `"nativewind/babel"` |
| **Socket.io on iOS** | 連線時指定 `transports: ["websocket"]`，不用預設 polling |
| **Firebase 在 Expo Go** | 安裝 `@react-native-firebase/app` 並改用 Development Build（不支援 Expo Go）|
| **React Native Web FlatList 效能** | 網頁版大列表改用 `FlashList`（`@shopify/flash-list`） |
| **NativeWind v4 on Web class 差異** | 新元件需同時在手機模擬器和瀏覽器測試，不能只測一端 |
| **Expo Router 網頁版 URL** | 在 `app.config.ts` 設定 `experiments.baseUrl` |
| **eslint-config-expo 在 monorepo 下 lint crash**（`typescript with invalid interface loaded as resolver`） | 它把 `import/resolver: { typescript: true }` 寫死在設定裡（settings 深合併蓋不掉），而相容版 resolver 沒被裝進 root，ESLint 誤把 `typescript` 編譯器當 resolver 載入。解法：root `npm i -D eslint-import-resolver-typescript@2.7.1`（v3/v4 有 peer 衝突裝不進來，v2.7.1 介面相容且無衝突） |
| **Expo web dev server 在 monorepo 找不到 `expo-router/entry`（bundle 回 404 / MIME application/json）** | 不能把 `package.json` 的 `main` 設成 `expo-router/entry`（dev server 會去 `apps/mobile/node_modules` 找，但套件 hoist 在根目錄）。改用本地跳板：`apps/mobile/index.js` 內 `import 'expo-router/entry'`，`main` 設為 `index.js`。注意 `expo export` 不受影響、只有 `expo start` 會踩到，清快取（`-c`）無效 |
---

## 🤖 AI 功能規劃（Claude API 整合）— 已規劃、尚未動工

> 2026-07-15 與開發者討論定案。2026-07-16 追加第四批（即時異動重排）。四批依序執行，喊「開工」即從第一批開始。

### 核心決策（討論結論，之後不必重新辯論）

- **訂閱與 API 是兩個世界**：Claude Code 訂閱／claude.ai／Cowork 是給「人」用的，App 的自動化一律走 Anthropic API（後端呼叫、按 token 計費）。API 讀不到本機 skill、CLAUDE.md 或訂閱設定
- **「App 內建 skill」的做法**：prompt 以 markdown 檔存放於 `apps/api/src/prompts/`（一份檔案＝一位專家），`aiService` 呼叫時讀檔當 system prompt——改指示不用動程式碼。可在 Claude Code 用訂閱先把 prompt 調到滿意再貼進檔案（免費試作場）
- **`services/aiService.ts` 統一封裝**：讀 `ANTHROPIC_API_KEY`（未設定回 `503 INTEGRATION_NOT_CONFIGURED`，同 Places/AviationStack 慣例）、structured output 強制回 JSON、預設模型 Haiku（可用環境變數覆寫）
- **AI 生成不直接落地**：一律回草稿給前端預覽，使用者確認才寫 DB
- **能用程式判斷的不呼叫模型**（日期範圍、dayNumber 重複等規則檢查用程式碼驗）；LLM 只做需要判斷力的事（排行程、動線審核、生成短句）
- **開發者尚未申請 API 金鑰**（console.anthropic.com，與訂閱分開計費）；開發期以 mock 驗證流程，不阻塞。費用感：Haiku 排一趟 5 天行程約台幣 1 元上下
- 未來若要「排行程時自己查營業時間」才需要 agent 迴圈（掛 web search 工具），基本版單次呼叫即可，不上 agent
- **每趟旅程設 AI 用量軟上限**：`Trip` 累計四批 AI 呼叫的花費（或次數），呼叫 `aiService` 前先檢查有沒有超過門檻（暫定台幣 80 元，可調整），超過就提示使用者「這趟旅程 AI 額度快用完」而非直接擋掉——2026-07-16 估算正常一趟旅程（短句＋排行程＋審核＋幾次即時重排）加總約台幣 10–30 元，此上限是防異常重複觸發，不是正常使用會踩到的門檻

### 第一批：旅遊短句（把「用語」tab 做起來）— ✅ 已完成（2026-07-23）

- Schema（要 migration）：`Trip` 加 `destination String?`（如「日本・東京」，給 AI 判斷語言地區）；新 model `Phrase`（`tripId / category（打招呼·用餐·交通·購物·緊急）/ text 當地語言 / reading 羅馬拼音 / meaning 中文 / order`，cascade 刪除）
- 後端：`POST /api/trips/:id/phrases/generate`（生成約 30–40 句存 DB，重生先清舊的——**生成一次之後全家讀 DB，不重複計費**）、`GET /api/trips/:id/phrases`（獨立端點，不塞進 trip detail）；授權走 `assertAccess`
- 前端：`TripFormModal` 加「目的地」欄位；`phrases.tsx` 分類顯示短句卡（當地語言大字＋拼音＋中文）、未生成時顯示「AI 生成」按鈕（destination 未填先提示）、生成中 loading、可重新生成
- 收尾：`.env.example` 加 `ANTHROPIC_API_KEY`、shared-types、後端測試（無金鑰 503／403／mock 生成）、CLAUDE.md

### 第二批：AI 規劃行程（限管理者）— ✅ 已完成（2026-07-24，連同第三批一起）

- 授權：新增 `familyService.assertRole(userId, familyId, roles)`——第一次真正使用 `FamilyRole`，限 OWNER/ADMIN（一般成員按鈕不顯示、直接打 API 回 403）
- 後端兩段式：`POST /api/trips/:id/ai-plan`（帶偏好：步調／興趣／備註，把日期、destination、既有航班·飯店·活動餵進 prompt 避開機場日與重複，**回草稿 JSON 不寫 DB**）→ `POST /api/trips/:id/ai-plan/apply`（確認後 transaction 寫入 TripDay/DayActivity；dayNumber 已存在則把活動加進該天）
- 前端：旅程總覽「AI 幫我排」（僅 OWNER/ADMIN 可見）→ 偏好表單 → 等待動畫 → 草稿預覽 Modal（逐天列出、可取消勾選）→ 套用後 reload

### 第三批：專家鏈升級 — ✅ 已完成（2026-07-24，併入第二批的生成流程）

- 「行程審核專家」（`prompts/reviewTrip.md`）：規劃師草稿 → 審核（太趕／動線繞路／忘了吃飯）→ 回饋修一輪 → 才回給使用者。最簡 multi-agent，2–3 次 API 呼叫串成
- 每多一位專家＝多一次計費；先讓單人版跑順再疊

### 第四批：即時異動重排（真正的 function calling / agent 迴圈）

> 跟前三批本質不同：前三批都是「單次呼叫＋結構化 JSON 輸出」或固定順序的 prompt chaining，模型不需要自己決定查什麼。這批是第一次讓模型在推理過程中自主判斷要呼叫哪個工具（tool use / agent 迴圈），成本與行為都不再是單次呼叫可預估的量，設計與試跑要更保守。

- **定位**：新增獨立頁面「即時行程」（暫定路由 `trip/[id]/live.tsx`，加入底部 tab／桌面側欄），與規劃階段用的 `schedule.tsx`（行程 kanban）分開——這頁專門處理「行程進行中」時的即時異動與重排，不是重新規劃整趟行程
- **觸發方式**：使用者在頁面上打自由文字描述現況（例如「班機delay 3小時」「這間餐廳今天公休」「颱風要來了」），送出後才啟動 agent 迴圈；不做預設選項，交給模型自己判斷要查什麼、影響哪些活動
- **觸發權限**：預設開放給所有家庭成員都能觸發（異動通常誰先發現就誰回報，例如人在機場的人先看到 delay，不比照第二批限 OWNER/ADMIN）——**待你確認**，之後要收斂再加 `assertRole`
- **後端新增 agent 模式**（跟前三批單次呼叫式的 `aiService` 用法不同，需支援 `tool_use` 多輪迴圈）：
  - 掛的工具：
    - `checkFlightStatus`：查 AviationStack 即時航班狀態
    - `searchPlaces`：查 Google Places 即時營業狀態／評分／附近替代景點
    - `web_search`：Anthropic API 內建的 hosted web search tool，查天氣、颱風、突發新聞等一般即時資訊，不用自己另外整合爬蟲
  - 迴圈上限：設 `max_tool_calls`（暫定 5 次）避免無限迴圈或暴衝計費，超過上限就用目前查到的資訊收斂回答，不硬查到底
  - 把現有行程資料（TripDay/DayActivity/Hotel/Flight）連同使用者描述一起餵給模型，判斷異動影響範圍
  - 輸出一樣是**回草稿 JSON、不直接落地**，沿用「使用者確認才寫 DB」的原則
- **端點（暫定）**：
  - `POST /api/trips/:id/replan`（帶使用者描述文字，內部跑 agent 迴圈，回草稿：受影響的活動清單＋建議調整）
  - `POST /api/trips/:id/replan/apply`（確認後寫入異動：可能是搬移／刪除某些 `DayActivity`，或標記某天需要人工確認）
- **授權**：走既有 `tripService.assertAccess`，暫不額外限角色（配合上面「觸發權限」待確認事項）
- **費用／風險**：前三批是單次呼叫、成本可預估（Haiku 排一趟約台幣 1 元），這批是「不確定輪數的 agent session」，成本會波動；且多掛了 AviationStack／Places／web search 三個外部依賴，要處理逾時或查無結果的降級（查不到就老實告訴使用者，不能編造資訊）。**AviationStack 免費額度僅 100 次／月，超過不是漸進收費、是直接跳付費方案（$49.99／月起）**，`checkFlightStatus` 務必加 cache（同航班短時間內重複查詢吃快取）與節流，避免被少數幾趟行程的重排請求把免費額度用光
- **跟第二批的關係**：第二批是「從零排」，第四批是「排好之後遇到變故的局部調整」，兩者都會寫 `TripDay`/`DayActivity`，可考慮把寫入邏輯抽成共用 service function 給兩批共用
- **待確認事項**（先列出、不卡進度）：
  1. 觸發角色是否要限制（目前預設全員可觸發）
  2. 「即時行程」頁面的確切路由與 UI（被 AI 調整過的活動要不要在 `schedule.tsx` 上加標記，讓使用者知道哪裡被動過）
  3. `max_tool_calls` 上限與逾時秒數的實際數字，要跑過才能定
---

## 📊 實作進度與待補

**已完成（可運行）**
- Monorepo 骨架（npm workspaces）+ `apps/api` + `apps/mobile` + `packages/shared-types`
- Prisma schema（全 10 model）+ migrations（本機 Postgres via docker-compose）
- 認證：register / login / refresh / me（JWT + bcrypt）
- 行程 CRUD + 巢狀景點、家庭建立／成員、第三方搜尋串接結構（含無金鑰時回 503）
- 家庭成員授權檢查：trips 全端點 + families 加成員（`assertMember` / `assertAccess`，非成員回 403）
- ✅ **TripDay / DayActivity / Hotel / Flight 巢狀 CRUD 端點**（含隸屬驗證、dayNumber 衝突回 409；17 項 curl 端到端測試通過）
- ✅ **shared-types 填實**：純 `.d.ts` 型別套件（wire format + payload），前端 `apps/mobile/types/api.ts` 與後端 `src/types/api.ts` 都改為 re-export，無需 build step
- ✅ **前端 token refresh**：`services/api.ts` 收到 401 先用 refresh token 換新（single-flight）並重試一次，失敗才登出
- ✅ **前端 CRUD UI**：行程 kanban／景點牆可新增、編輯、刪除活動（`ActivityFormModal`，可換天）；交通住宿頁實作完成，航班／飯店可增刪改（`FlightFormModal` / `HotelFormModal`）；共用表單元件在 `components/common/FormSheet.tsx`（FormSheet / Field / ChipSelect，刪除採兩段式確認，因 RN Alert 在 Web 無效）
- ✅ **旅程總覽架構（2026-07-08 重構）**：登入 → `/trips` 總覽（進行中排最前，`utils/tripSort.ts` 有測試）→ 點卡片進 `trip/[id]/` 的 5 tab；`trip/[id]/_layout` 統一載入 detail 並 gating（沒載好不渲染子頁，子頁可假設 `currentTrip` 正確）；「我的」為獨立 `/profile` 頁。**「目前行程」的隱性全域切換（lastTripId 持久化/pickDefaultTrip）已隨重構移除**——進哪個旅程看哪個，不再有背景預設值
- ✅ **測試（Vitest）**：後端 `apps/api/tests/` 用 Supertest 打 `createApp()` 的整合測試（認證／授權 403·404／巢狀資源歸屬／409 衝突／cascade，39 項）；前端 `apps/mobile/tests/` 測純函式 utils（日期解析、價錢顯示、預設行程選擇，26 項）。後端測試連本機 Postgres 的 **test schema**（`?schema=test`，globalSetup 自動重置），不汙染開發資料；根目錄 `npm test` 跑全部
- ✅ **行程本身的建立／編輯／刪除 UI**（`TripFormModal`）：總覽頁建立旅程（沒有家庭時一併建立，`familyService`；建立後 `onCreated` 直接導進新旅程）、旅程總覽 tab 的「編輯行程資訊」可改名/改日期/刪除；刪除走 store 的 `removeTrip`，`trip/[id]/_layout` 的載入 effect 刻意只依賴 `id`（避免刪除後回頭抓 404）
- ✅ **UI 細節**：桌面 sidebar 選中高亮為單一「滑動藥丸」（RN 內建 Animated spring，未啟用 reanimated babel plugin）；手機底部 tab 只顯示 icon（`tabBarShowLabel: false`）；首頁去程／回程按 `departureTime` 排序（不再寫死 TPE）
- ✅ **日期選擇器**（`components/common/DateField.tsx`）：網頁用瀏覽器原生 picker（input type=date/datetime-local/time，`colorScheme` 跟深色），原生 App 未裝 datetimepicker 套件、先退回手動輸入；四個表單（行程/飯店/航班/活動）都已換用
- ✅ **DAY 詳情彈窗**（`DayDetailModal`）：旅程總覽 tab 點 DAY 卡看當天活動、點活動編輯、可新增；開活動表單時先藏詳情彈窗（RN 原生一次只能一個 Modal），關掉自動回清單
- ✅ **航班卡改版**（`FlightCard`）：TPE 08:50 ✈ NRT 13:05 路線排版＋班號航空＋機場全名（`utils/airports.ts` 常用機場對照表，查不到只顯示代碼）
- ✅ **航班詳細頁**（`trip/[id]/flight/[flightId]`，Tabs 註冊 `href: null` 不進 tab bar）：航班卡＋機型＋前往機場方式＋行李清單；Flight 加 `aircraft`/`accessNote` 欄位、新資料表 `PackingItem`（跟著 Trip、cascade 刪除，migration `20260713074858`）；總覽與交通住宿頁點航班卡都進詳細頁（編輯移到詳細頁右上），行李清單元件 `components/trip/PackingList.tsx`
- ✅ **品質補強：ESLint＋Prettier＋元件測試**（2026-08-12）：ESLint 8（mobile `eslint-config-expo`＋node resolver override、api `typescript-eslint`＋底線參數豁免）；Prettier（`.prettierrc.json`：no-semi/single-quote/寬 100，一次性排版全 codebase，`*.md`/migrations 不排）；root 腳本 `lint`/`lint:fix`/`format`/`format:check`；前端測試從 vitest 遷到 **jest-expo**（單一框架，`react-test-renderer@18.2.0` 要跟 React 版本釘一致），新增元件測試（FormSheet 兩段式刪除／submitLabel／error、ChipSelect 選取；@testing-library/react-native）。後端 64（vitest）／前端 34（jest）；monorepo resolver 坑記錄在已知問題表
- ✅ **地圖第二步：內嵌地圖＋地圖選點＋地圖 tab**（2026-08-10）：`react-native-maps@1.14.0`（Expo Go 免金鑰可跑；正式 build 需 Maps SDK 金鑰，`app.config.ts` 已留欄位讀 `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`）；`MapCanvas` 平台分流（`.native.tsx` 真地圖／`.tsx` Web 降級提示）；`LocationPickerModal` 點地圖放 pin 回填座標；活動表單「地圖選點」（原生限定，與 FormSheet 互斥開啟）；「地圖」tab 顯示全部帶座標活動（pin 依 DAY 上色＋圖例、點 pin 跳 Google 地圖、Web 降級清單）；web export 驗證通過。**待辦：申請 Maps SDK 金鑰後才能出正式 build；手機 UI 待 Expo Go 實測**
- ✅ **地圖第一步：活動座標＋開啟地圖＋景點牆 DAY 分組**（2026-08-10）：`DayActivity` 加 `placeId/lat/lng`（migration `20260810034814`，容器要 `--build` 重新生成 Prisma Client）；搜尋帶入時存精確座標（表單可「移除精確定位」）；活動表單「在 Google 地圖開啟」按鈕（`utils/mapLink.ts` deep link，免金鑰；有測試）；景點牆依 DAY 分組（DAY 標題＋theme＋日期）。後端測試 64／前端 28
- ✅ **Google Places 景點搜尋串接**（2026-08-07）：金鑰已設定（根目錄 `.env` 供 docker compose 讀、`apps/api/.env` 供本機跑；compose 有 `GOOGLE_PLACES_API_KEY` passthrough）；`placesService` 加 `language=zh-TW`（結果回繁中）；`ActivityFormModal` 名稱欄位加搜尋鈕（**按鈕觸發才查**，控制 Places 計費；點結果帶入名稱／地點，可再手動改）；shared-types 加 `AttractionSearchResult`；前端 `services/attractionService.ts`。真實金鑰下 curl 驗證「淺草寺」搜尋成功
- ✅ **AI 第二＋三批：AI 規劃行程＋審核專家鏈**（2026-07-24）：`familyService.assertRole`（第一次真正使用 `FamilyRole`，限 OWNER/ADMIN，成員角色不符回 403）；兩段式端點 `POST /ai-plan`（餵日期／目的地／既有航班·飯店·活動進 prompt，**回草稿不寫 DB**）→ `POST /ai-plan/apply`（transaction 寫入，dayNumber 已存在則附加活動、order 接續）；專家鏈在 `aiPlanService.generate` 內：`planTrip.md` 規劃 → `reviewTrip.md` 審核（太趕/繞路/忘吃飯/航班衝突）→ 有問題修一輪（最多一輪控成本；mock 模式審核直接 approved 不多花錢）；草稿時間為 "HH:MM" 字串，**套用時由前端用 `combineDateTime` 轉 ISO**（跟手動新增活動同語意）；後端給 AI 看時間用 `Asia/Taipei` 格式化（已知簡化，使用者都在台灣）；前端 `AiPlanModal`（偏好表單→草稿預覽可取消勾選→套用 reload）、總覽頁「AI 幫我排」按鈕僅 OWNER/ADMIN 顯示（用 familyService.list 查角色）；`FormSheet` 加 `submitLabel` prop；後端測試 62 項（新增 7 項：MEMBER 403／非成員 403／404／400 無目的地／503／草稿不落地／套用與附加／apply 驗證）
- ✅ **AI 第一批：旅遊短句**（2026-07-23）：`Trip.destination` 欄位＋`Phrase` 資料表（migration `20260722085320`）；`services/aiService.ts` 統一封裝 Anthropic Messages API（structured output 強制 JSON、預設 `claude-haiku-4-5` 可用 `ANTHROPIC_MODEL` 覆寫、無金鑰回 503、**金鑰填 `mock` 直接回替身資料不打真實 API**）；prompt 存 `src/prompts/generatePhrases.md`（一份檔案＝一位專家）；`GET/POST /api/trips/:id/phrases(/generate)`（生成一次存 DB 全家共用、重生成先清舊）；前端 `TripFormModal` 加目的地欄位、`phrases.tsx` 從佔位頁做成分類短句卡（空狀態「AI 生成」／已生成「重新生成」）；docker-compose 會把 shell 的 `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL` 傳進容器（**加了 SDK 依賴，重啟要 `--build`**）；後端測試 55 項（新增 8 項：403/404/400 無目的地/503 無金鑰/mock 生成/重生成清舊）
- ✅ **email 邀請成員＋家庭管理 UI**：後端 `addMemberByEmail`（找不到 email 回 404、重複回 409），`GET/POST /api/families` 的成員帶 user 基本資料；前端「我的」頁 `FamilyManager`（成員列表＋角色徽章＋email 邀請）。多層動態路由的 `router.push` 要用**物件形式**（`{ pathname: '/trip/[id]/flight/[flightId]', params }`），字串模板過不了 typed routes

**待補（依優先序）**
1. 航班查詢需填 `AVIATION_STACK_API_KEY` 才有真資料；前端也尚未串 `/api/flights/search`（航班表單自動帶入 UI）
2. **地圖與景點牆改善**（2026-08-07 使用者回饋；2026-08-10 定案「地圖選點」與「店名搜尋帶入」**兩種都要**，因為要開放手機操作；已規劃未動工）：
   - ✅ 第一步（地基，2026-08-10 完成）：`DayActivity` 加 `placeId`/`lat`/`lng`（migration `20260810034814`；搜尋帶入時一併存座標、可「移除精確定位」），活動表單加「在 Google 地圖開啟」deep link（`utils/mapLink.ts`，有座標用座標＋place_id、沒座標退回名稱＋地點文字搜尋，**免金鑰零費用**）；景點牆 `attractions.tsx` 改依 DAY 分組（每天一段標題＋便利貼牆）
   - ✅ 第二步（內嵌地圖，2026-08-10 完成）：`react-native-maps@1.14.0`（Expo Go 可直接跑：iOS Apple 圖層／Android Google 圖層；正式 build 金鑰讀 `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`，已寫進 `app.config.ts`，**金鑰尚未申請**）；`components/map/MapCanvas.native.tsx` + `MapCanvas.tsx`（Metro 平台分流，Web 降級提示，**兩份 props 介面要同步**）；`LocationPickerModal` 地圖選點（點地圖放 pin → 回填座標，手動點的沒有 placeId；與 FormSheet 互斥開啟）；活動表單「地圖選點」按鈕（原生限定）；新增「地圖」tab（`trip/[id]/map.tsx`，第 4 個 tab）：全部帶座標活動的 pin 依 DAY 上色＋圖例，點 pin 標題跳 Google 地圖，Web 降級成清單
3. Maps SDK for iOS/Android 金鑰尚未申請（Expo Go 開發不需要；出 Development Build／正式 build 前必須申請，填 `apps/mobile/.env` 的 `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`）；Web 版內嵌地圖（Maps JavaScript API）尚未做，目前降級成清單／提示
4. Socket.io 即時同步、Firebase 即時共享、推播通知（Expo Notifications）
5. 角色細分授權（`assertRole` 已存在並用於 AI 排行程；「加成員」目前仍任何成員可做，之後可限定 OWNER/ADMIN）
8. 本機 docker-compose 已可一行起 Postgres + 後端 API（`apps/api/Dockerfile.dev`，含熱重載／自動 migrate）；**正式部署用** Dockerfile（多階段、只裝 production 依賴、上 Cloud Run）仍待建立

**注意事項**
- 新增路由頁面後，`.expo/types/router.d.ts`（typed routes）要等 `expo start` 重新生成；型別檢查若報 Href 錯誤先跑一次 dev server

---

## 💡 給 Claude 的工作原則

1. **每次修改前先說明計畫**，不要直接開始改 code
2. **資料庫 Schema 修改**必須同時附上 migration 指令
3. **新增功能**時先問「要不要更新 CLAUDE.md？」
4. **遇到型別錯誤**優先修型別，不用 `as any` 硬過
5. **不要自作主張升級套件版本**，除非明確被要求
6. 所有程式碼**加上繁體中文注解**

---

*最後更新：2026-08-12 完成品質補強（ESLint＋Prettier＋root 腳本；前端測試遷 jest-expo 並新增元件測試；後端 64／前端 34）；2026-08-10 完成地圖第一＋二步（活動座標欄位＋Google 地圖 deep link＋景點牆 DAY 分組；react-native-maps 內嵌地圖＋地圖選點＋地圖 tab，Web 降級；後端 64／前端 28）；2026-08-07 接通真實 ANTHROPIC_API_KEY（修正 ANTHROPIC_MODEL 空字串 bug、aiService 補錯誤 log）與 Google Places 景點搜尋（金鑰＋zh-TW＋ActivityFormModal 搜尋帶入 UI）；2026-07-24 完成 AI 第二＋三批「AI 規劃行程＋審核專家鏈」（assertRole、兩段式 ai-plan 端點、planTrip/reviewTrip 專家鏈、AiPlanModal 草稿預覽；後端測試 62／前端 24；第四批「即時異動重排」仍待確認事項定案）；2026-07-23 完成 AI 功能第一批「旅遊短句」（Trip.destination＋Phrase model、aiService＋prompts 資料夾、phrases 端點、用語 tab UI、mock 開發流程；後端測試 55／前端 24）；2026-07-16 補上每趟旅程 AI 用量軟上限（暫定台幣 80 元）與 AviationStack 免費額度僅 100 次／月的節流提醒；2026-07-16 於「🤖 AI 功能規劃」追加第四批「即時異動重排」（真正的 function calling / agent 迴圈，新頁面「即時行程」，掛 AviationStack／Places／web search 三個工具，已規劃未動工）；2026-07-15 新增「🤖 AI 功能規劃」章節（Claude API 整合三批：旅遊短句／AI 排行程／審核專家鏈，已規劃未動工）；上一批完成：航班詳細頁＋email 邀請成員（後端測試 47、前端 24）| 如有架構變動請同步更新此文件*
