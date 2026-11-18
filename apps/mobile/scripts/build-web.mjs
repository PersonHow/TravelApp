import { spawnSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const required = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
  'EXPO_PUBLIC_OPERATOR_NAME',
  'EXPO_PUBLIC_SUPPORT_EMAIL',
]
const missing = required.filter((name) => !process.env[name]?.trim())
if (missing.length > 0) {
  console.error(`缺少正式 Web 設定：${missing.join(', ')}`)
  process.exit(1)
}

let apiUrl
try {
  apiUrl = new URL(process.env.EXPO_PUBLIC_API_URL)
} catch {
  console.error('EXPO_PUBLIC_API_URL 必須是有效的 HTTPS 網址')
  process.exit(1)
}
if (apiUrl.protocol !== 'https:' || !apiUrl.hostname.includes('.')) {
  console.error('EXPO_PUBLIC_API_URL 必須是正式 HTTPS 網址')
  process.exit(1)
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.EXPO_PUBLIC_SUPPORT_EMAIL)) {
  console.error('EXPO_PUBLIC_SUPPORT_EMAIL 必須是有效的聯絡 Email')
  process.exit(1)
}

const result = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--clear'], {
  stdio: 'inherit',
  env: { ...process.env, EXPO_NO_DOTENV: '1', NODE_ENV: 'production' },
})
if (result.status !== 0) process.exit(result.status ?? 1)

const bundleDir = join(process.cwd(), 'dist', '_expo', 'static', 'js', 'web')
const bundle = readdirSync(bundleDir)
  .filter((name) => name.endsWith('.js'))
  .map((name) => readFileSync(join(bundleDir, name), 'utf8'))
  .join('\n')
for (const name of [
  'DATABASE_URL',
  'JWT_SECRET',
  'GOOGLE_PLACES_API_KEY',
  'GOOGLE_ROUTES_API_KEY',
  'AVIATION_STACK_API_KEY',
  'ANTHROPIC_API_KEY',
]) {
  const value = process.env[name]
  if (value && value.length >= 16 && value.toLowerCase() !== 'mock' && bundle.includes(value)) {
    console.error(`Web bundle 含有 ${name} 的伺服器密鑰，已停止發布`)
    process.exit(1)
  }
}
