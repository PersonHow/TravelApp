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

  // POST /api/families/:id/members（用 email 邀請）
  async addMember(req: Request, res: Response) {
    const { email } = req.body ?? {}
    if (!email) throw AppError.badRequest('email 為必填')
    const member = await familyService.addMemberByEmail({
      familyId: req.params.id,
      email: String(email).trim(),
      requesterId: req.userId!,
    })
    res.status(201).json({ success: true, data: member })
  },
}
