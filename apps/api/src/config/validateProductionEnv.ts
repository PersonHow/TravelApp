export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== 'production') return

  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET === 'change_me_in_local') {
    throw new Error('正式環境的 JWT_SECRET 必須是至少 32 字元的獨立密鑰')
  }
  if (!env.DATABASE_URL) throw new Error('正式環境缺少 DATABASE_URL')

  const origins = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
  if (origins.length === 0 || origins.some((origin) => !/^https:\/\/[^/]+$/.test(origin))) {
    throw new Error('正式環境的 CORS_ORIGINS 必須只包含 HTTPS Web origins')
  }

  for (const name of [
    'AVIATION_STACK_API_KEY',
    'GOOGLE_PLACES_API_KEY',
    'GOOGLE_ROUTES_API_KEY',
    'ANTHROPIC_API_KEY',
  ]) {
    if (env[name]?.toLowerCase() === 'mock') {
      throw new Error(`正式環境不可使用 ${name}=mock`)
    }
  }
}
