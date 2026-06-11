# 🗾 Travel App

日本家庭旅遊協調 App — iOS + Android + Web,一份程式碼三平台。

> 完整的架構規範、API 設計、Schema 慣例請看 [CLAUDE.md](./CLAUDE.md)。
> 這份 README 只專心講「怎麼跑起來」。

---

## 環境需求

| 工具 | 版本 |
|------|------|
| Node.js | 20 LTS+ |
| npm | 10+ |
| Docker Desktop | 任意較新版(用來跑 Postgres) |
| Xcode | 16+(只跑網頁版不用) |
| Android Studio | 最新(只跑網頁版不用) |

---

## 第一次跑(首次 clone 後)

```bash
# 1. 安裝所有 workspace 依賴(npm workspaces,根目錄一條搞定)
cd /Users/tungjenhao/Documents/Claude_Document/TravelApp
npm install

# 2. 啟動 PostgreSQL(背景跑)
docker-compose up -d

# 3. 建立資料庫 schema + 套用 migration
cd apps/api
npx prisma migrate dev

# 4. 灌測試資料(東京自由行 demo trip + demo 帳號)
npm run seed --workspace @travel-app/api
```

完成後資料庫會有:
- 1 個 demo 使用者(下面有帳密)
- 1 個家庭、1 趟「東京自由行」3 天行程
- 14 個活動(景點/美食/購物/交通)、2 班航班、1 間飯店

---

## 日常啟動(每天開始開發時)

開**兩個 Terminal 視窗**,並確認 Docker 起來了。

### Terminal A — 後端 API(port 3000)

```bash
cd /Users/tungjenhao/Documents/Claude_Document/TravelApp
npm run dev --workspace @travel-app/api
```

看到 `Server listening on 0.0.0.0:3000` 就 OK。

### Terminal B — 前端 Expo(網頁 port 8081)

```bash
cd /Users/tungjenhao/Documents/Claude_Document/TravelApp/apps/mobile
EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --web
```

跑起來自動開 [http://localhost:8081](http://localhost:8081)。

> ⚠️ **一定要加 `EXPO_USE_METRO_WORKSPACE_ROOT=1`** — 不加 monorepo 路徑會錯。

### 想跑手機模擬器?

在 Terminal B 把 `--web` 換成:
- `--ios` → iOS Simulator(需 Xcode)
- `--android` → Android Emulator(需 Android Studio)

或先 `npx expo start`(不加 flag),跑起來後在 terminal 按:
- `i` → iOS
- `a` → Android
- `w` → Web

---

## Demo 帳號

```
email:    demo@travel-app.com
password: demo1234
```

進去就能看到「東京自由行」的完整行程。

---

## 常用指令

```bash
# 視覺化看/改資料庫(開 http://localhost:5555)
cd apps/api && npx prisma studio

# 重灌測試資料(會清掉現有 demo 行程再重建)
npm run seed --workspace @travel-app/api

# 改完 schema 後建新 migration
cd apps/api && npx prisma migrate dev --name "描述變更"

# TypeScript 型別檢查
cd apps/mobile && npx tsc --noEmit
cd apps/api && npx tsc --noEmit

# 重置整個資料庫(本機開發用,會清掉所有資料)
cd apps/api && npx prisma migrate reset
```

---

## 停止伺服器

```bash
# 找出在跑的 Expo / API process
ps aux | grep -E "(expo|tsx watch)" | grep -v grep

# 砍掉(把 PID 換成上面查到的)
kill <PID>

# 停 Postgres
docker-compose down
```

或直接在跑的 Terminal 按 `Ctrl + C`。

---

## 常見問題

**Q. Expo 開了瀏覽器但畫面是空白 / 一直 spinner**
A. 多半是 monorepo metro 路徑沒設好。確認啟動指令有 `EXPO_USE_METRO_WORKSPACE_ROOT=1`。

**Q. 改了 `prisma/schema.prisma` 但 API 還拿到舊型別**
A. 跑 `npx prisma generate` 再重啟 API。

**Q. API 回 `503 INTEGRATION_NOT_CONFIGURED`**
A. Google Places / AviationStack 金鑰沒設。在 `apps/api/.env` 補上,或忽略(只是搜尋功能不能用)。

**Q. 登入 401 / 403**
A. JWT 過期(7 天)。清瀏覽器 LocalStorage 或重新登入。

---

## 專案結構速查

```
TravelApp/
├── apps/
│   ├── api/          # Express + Prisma(後端)
│   └── mobile/       # Expo(前端,跨平台)
├── packages/
│   └── shared-types/ # 前後端共用 TypeScript 型別
├── docker-compose.yml
├── CLAUDE.md         # 完整架構規範(給 Claude Code 看的)
└── README.md         # 這份
```

更深入的設計決策、Prisma schema 規範、API 慣例、部署流程都在 [CLAUDE.md](./CLAUDE.md)。
