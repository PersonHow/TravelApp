import type { Request, Response } from 'express'
import { z } from 'zod'
import { packingItemService } from '../services/packingItemService'
import { nonEmptyUpdate, parseInput, trimmedString } from '../utils/validation'

const createPackingItemSchema = z
  .object({ name: trimmedString('name', 200) })
  .strict('包含不支援的欄位')
const updatePackingItemSchema = nonEmptyUpdate({
  name: trimmedString('name', 200).optional(),
  checked: z.boolean({ invalid_type_error: 'checked 必須是布林值' }).optional(),
})

// 行李清單控制器（列表已含在 GET /api/trips/:id 的 packingItems）
export const packingItemController = {
  // POST /api/trips/:id/packing
  async create(req: Request, res: Response) {
    const { name } = parseInput(createPackingItemSchema, req.body)
    const item = await packingItemService.create(req.params.id, { name }, req.userId!)
    res.status(201).json({ success: true, data: item })
  },

  // PUT /api/trips/:id/packing/:itemId
  async update(req: Request, res: Response) {
    const input = parseInput(updatePackingItemSchema, req.body)
    const item = await packingItemService.update(
      req.params.id,
      req.params.itemId,
      input,
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
