import type { Request, Response } from 'express'
import { phraseService } from '../services/phraseService'

// 旅遊短句控制器（獨立端點，不塞進 trip detail）
export const phraseController = {
  // GET /api/trips/:id/phrases
  async list(req: Request, res: Response) {
    const phrases = await phraseService.list(req.params.id, req.userId!)
    res.json({ success: true, data: phrases })
  },

  // POST /api/trips/:id/phrases/generate
  async generate(req: Request, res: Response) {
    const phrases = await phraseService.generate(req.params.id, req.userId!)
    res.status(201).json({ success: true, data: phrases })
  },
}
