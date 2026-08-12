import type { Request, Response } from 'express'
import { aiPlanService } from '../services/aiPlanService'
import { AppError } from '../utils/AppError'

// AI 規劃行程控制器（兩段式：生成草稿 → 確認套用）
export const aiPlanController = {
  // POST /api/trips/:id/ai-plan
  async generate(req: Request, res: Response) {
    const { pace, interests, note } = req.body ?? {}
    const draft = await aiPlanService.generate(req.params.id, req.userId!, {
      pace,
      interests,
      note,
    })
    res.json({ success: true, data: draft })
  },

  // POST /api/trips/:id/ai-plan/apply
  async apply(req: Request, res: Response) {
    const { days } = req.body ?? {}
    if (!Array.isArray(days) || days.length === 0) {
      throw AppError.badRequest('days 為必填且不可為空')
    }
    const tripDays = await aiPlanService.apply(req.params.id, req.userId!, days)
    res.status(201).json({ success: true, data: tripDays })
  },
}
