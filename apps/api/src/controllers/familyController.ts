import type { Request, Response } from 'express'
import { familyService } from '../services/familyService'
import { AppError } from '../utils/AppError'

// 家庭控制器（皆需登入，userId 由 requireAuth 提供）
export const familyController = {
  // POST /api/families
  async create(req: Request, res: Response) {
    const { name } = req.body ?? {}
    if (!name) throw AppError.badRequest('name 為必填')
    const family = await familyService.create({ name, ownerId: req.userId! })
    res.status(201).json({ success: true, data: family })
  },

  // GET /api/families
  async list(req: Request, res: Response) {
    const families = await familyService.findAllForUser(req.userId!)
    res.json({ success: true, data: families })
  },

  // POST /api/families/:id/members
  async addMember(req: Request, res: Response) {
    const { userId } = req.body ?? {}
    if (!userId) throw AppError.badRequest('userId 為必填')
    const member = await familyService.addMember({
      familyId: req.params.id,
      userId,
      requesterId: req.userId!,
    })
    res.status(201).json({ success: true, data: member })
  },
}
