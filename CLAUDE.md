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
│   │   │   ├── (tabs)/          # Tab 導覽
│   │   │   │   ├── index.tsx    # 首頁（行程總覽）
│   │   │   │   ├── attractions.tsx
│   │   │   │   ├── schedule.tsx
│   │   │   │   └── profile.tsx
│   │   │   ├── trip/[id].tsx    # 行程詳細頁
│   │   │   └── _layout.tsx
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
│   └── shared-types/            # 前後端共用型別
│       ├── src/
│       │   ├── models/          # 資料模型（Trip, User, Attraction...）
│       │   ├── api/             # API 請求／回應型別
│       │   └── index.ts         # 統一 export
│       └── package.json
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
# 啟動所有服務（Docker）
docker-compose up -d

# 啟動 Expo App
cd apps/mobile && npx expo start

# 啟動 Backend API
cd apps/api && npm run dev

# 手機模擬器
npx expo start --ios        # iOS Simulator
npx expo start --android    # Android Emulator
```

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
# 執行所有測試
npm test

# TypeScript 型別檢查
npm run type-check

# Lint 檢查
npm run lint

# 修正 Lint 錯誤
npm run lint:fix
```

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

# 家庭（需登入）
POST   /api/families           # 建立家庭（建立者自動成 OWNER）
GET    /api/families           # 我所屬的家庭列表
POST   /api/families/:id/members     # 新增成員

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
| `UNAUTHORIZED` | 401 | 缺 token、token 無效或過期 |
| `NOT_FOUND` | 404 | 找不到資源／路由 |
| `EMAIL_TAKEN` | 409 | 註冊 email 重複 |
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
---

## 📊 後端實作進度與待補

**已完成（可運行）**
- Monorepo 骨架（npm workspaces）+ `apps/api` + `packages/shared-types`（空殼）
- Prisma schema（全 10 model）+ 首次 migration（本機 Postgres via docker-compose）
- 認證：register / login / refresh / me（JWT + bcrypt）
- 行程 CRUD + 巢狀景點、家庭建立／成員、第三方搜尋串接結構（含無金鑰時回 503）

**待補（依優先序）**
1. ⚠️ **家庭成員授權檢查**：目前任何登入者只要知道 `familyId` 就能在該家庭建行程（只擋 FK 是否存在，未擋成員身分）。authentication 已做、authorization 未做
2. 第三方搜尋需填 `GOOGLE_PLACES_API_KEY` / `AVIATION_STACK_API_KEY` 才有真資料
3. Hotel / TripDay / DayActivity 的獨立 REST 端點（model 已建）
4. Socket.io 即時同步、Firebase 即時共享
5. 測試（`npm test`）與 Lint（`npm run lint`）工具尚未設定，根目錄 script 待補

---

## 💡 給 Claude 的工作原則

1. **每次修改前先說明計畫**，不要直接開始改 code
2. **資料庫 Schema 修改**必須同時附上 migration 指令
3. **新增功能**時先問「要不要更新 CLAUDE.md？」
4. **遇到型別錯誤**優先修型別，不用 `as any` 硬過
5. **不要自作主張升級套件版本**，除非明確被要求
6. 所有程式碼**加上繁體中文注解**

---

*最後更新：2026-05-29 後端骨架完成（auth / trips / families / 搜尋）| 如有架構變動請同步更新此文件*
