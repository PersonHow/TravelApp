import fs from 'node:fs'
import path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { AppError } from '../utils/AppError'

// AI 呼叫統一封裝（Anthropic Messages API）
// 慣例與 Places / AviationStack 相同：金鑰未設定回 503，不讓服務 crash
// 開發期把 ANTHROPIC_API_KEY 設成 "mock" 可跳過真實呼叫，直接回傳呼叫端提供的替身資料

// 預設 Haiku（成本低，生成一趟短句約台幣 1 元內），可用 ANTHROPIC_MODEL 覆寫
const DEFAULT_MODEL = 'claude-haiku-4-5'

// 讀取 prompts/ 下的 markdown 當 system prompt（一份檔案＝一位專家，改指示不用動程式碼）
export function loadPrompt(name: string): string {
  return fs.readFileSync(path.join(__dirname, '../prompts', `${name}.md`), 'utf-8')
}

export const aiService = {
  // 以 JSON Schema 強制模型輸出結構化 JSON，回傳解析後的物件
  async generateJson<T>(params: {
    system: string
    user: string
    schema: Record<string, unknown>
    // ANTHROPIC_API_KEY=mock 時直接回傳的替身資料（開發期無金鑰也能跑通流程）
    mock: T
    maxTokens?: number
  }): Promise<T> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new AppError(503, 'INTEGRATION_NOT_CONFIGURED', 'Anthropic API 金鑰尚未設定')
    }
    if (apiKey === 'mock') return params.mock

    const client = new Anthropic({ apiKey })
    try {
      const response = await client.messages.create({
        // 用 || 而非 ??：docker-compose 未設定時會傳進空字串，也要退回預設模型
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: params.maxTokens ?? 8192,
        system: params.system,
        messages: [{ role: 'user', content: params.user }],
        output_config: { format: { type: 'json_schema', schema: params.schema } },
      })
      const text = response.content.find((block) => block.type === 'text')?.text
      if (!text) throw new AppError(502, 'UPSTREAM_ERROR', 'AI 回應為空')
      return JSON.parse(text) as T
    } catch (e) {
      if (e instanceof AppError) throw e
      // 限流／超載／金鑰無效等統一轉 502，原始錯誤只記 log 不外洩給前端
      console.error('[aiService] Anthropic API 呼叫失敗:', e)
      throw new AppError(502, 'UPSTREAM_ERROR', 'AI 服務回應異常，請稍後再試')
    }
  },
}
