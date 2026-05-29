import 'dotenv/config'
import { createApp } from './app'

// 後端進入點：啟動 HTTP 伺服器
const PORT = Number(process.env.PORT) || 3000
const app = createApp()

// 注意：listen 在 0.0.0.0，手機才能透過 Mac 的區網 IP 連到本機後端
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API 伺服器已啟動：http://localhost:${PORT}`)
  console.log(`   區網連線（手機測試用）：http://<你的Mac區網IP>:${PORT}`)
})
