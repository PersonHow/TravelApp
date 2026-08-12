import type { Request, Response } from 'express'
import { packingItemService } from '../services/packingItemService'
import { AppError } from '../utils/AppError'

// 行李清單控制器（列表已含在 GET /api/trips/:id 的 packingItems）
export const packingItemController = {
  // POST /api/trips/:id/packing
  async create(req: Request, res: Response) {
    const { name } = req.body ?? {}
    if (!name) throw AppError.badRequest('name 為必填')
    const item = await packingItemService.create(req.params.id, { name }, req.userId!)
    res.status(201).json({ success: true, data: item })
  },

  // PUT /api/trips/:id/packing/:itemId
  async update(req: Request, res: Response) {
    const { name, checked } = req.body ?? {}
    if (checked !== undefined && typeof checked !== 'boolean') {
      throw AppError.badRequest('checked 必須是布林值')
    }
    const item = await packingItemService.update(
      req.params.id,
      req.params.itemId,
      { name, checked },
      req.userId!,
    )
    res.json({ success: true, data: item })
  },

  // DELETE /api/trips/:id/packing/:itemId
  async remove(req: Request, res: Response) {
    await packingItemService.remove(req.params.id, req.params.itemId, req.userId!)
    res.json({ success: true, data: { id: req.params.itemId } })
  },
}
