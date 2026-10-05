import path from 'node:path'
import { config } from 'dotenv'

// 載入順序：既有 process env > monorepo 根目錄 .env > apps/api/.env。
// Docker／正式環境注入的變數不會被檔案覆蓋；本機則可把共用金鑰集中在根目錄。
config({ path: path.resolve(__dirname, '../../../../.env') })
config({ path: path.resolve(__dirname, '../../.env') })
