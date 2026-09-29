import type { Request, Response } from 'express'
import { z } from 'zod'
import { familyService } from '../services/familyService'
import { parseInput, trimmedString } from '../utils/validation'

const createFamilySchema = z.object({ name: trimmedString('name', 100) }).strict('包含不支援的欄位')
const addMemberSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('email 格式錯誤')
      .max(320)
      .transform((value) => value.toLowerCase()),
  })
  .strict('包含不支援的欄位')

// 家庭控制器（皆需登入，userId 由 requireAuth 提供）
export const familyController = {
  // POST /api/families
  async create(req: Request, res: Response) {
    const { name } = parseInput(createFamilySchema, req.body)
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
    const { email } = parseInput(addMemberSchema, req.body)
    const member = await familyService.addMemberByEmail({
      familyId: req.params.id,
      email,
      requesterId: req.userId!,
    })
    res.status(201).json({ success: true, data: member })
  },
}
