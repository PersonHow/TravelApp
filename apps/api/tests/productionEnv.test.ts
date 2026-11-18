import { describe, expect, it } from 'vitest'
import { validateProductionEnv } from '../src/config/validateProductionEnv'

const valid = {
  NODE_ENV: 'production',
  JWT_SECRET: 'a'.repeat(32),
  DATABASE_URL: 'postgresql://example',
  CORS_ORIGINS: 'https://travel.example.com',
}

describe('production environment', () => {
  it('接受具備正式來源與獨立密鑰的設定', () => {
    expect(() => validateProductionEnv(valid)).not.toThrow()
  })

  it('拒絕開發用密鑰、HTTP 來源與 mock 金鑰', () => {
    expect(() => validateProductionEnv({ ...valid, JWT_SECRET: 'change_me_in_local' })).toThrow()
    expect(() =>
      validateProductionEnv({ ...valid, CORS_ORIGINS: 'http://localhost:8081' }),
    ).toThrow()
    expect(() => validateProductionEnv({ ...valid, ANTHROPIC_API_KEY: 'mock' })).toThrow()
  })
})
