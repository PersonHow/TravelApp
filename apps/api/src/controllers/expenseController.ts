import type { Request, Response } from 'express'
import { z } from 'zod'
import { expenseService } from '../services/expenseService'
import {
  dateValue,
  nonEmptyUpdate,
  nonNegativeInt,
  nullableText,
  optionalText,
  parseInput,
  trimmedString,
} from '../utils/validation'

// 記帳控制器（列表已含在 GET /api/trips/:id 的 expenses）

const category = z.enum(['food', 'transport', 'ticket', 'shopping', 'lodging', 'other'])
const createExpenseSchema = z
  .object({
    title: trimmedString('title'),
    amount: nonNegativeInt('amount'),
    category,
    date: dateValue('date'),
    payerId: trimmedString('payerId', 100).optional(),
    note: optionalText('note'),
  })
  .strict('包含不支援的欄位')
const updateExpenseSchema = nonEmptyUpdate({
  title: trimmedString('title').optional(),
  amount: nonNegativeInt('amount').optional(),
  category: category.optional(),
  date: dateValue('date').optional(),
  payerId: trimmedString('payerId', 100).optional().nullable(),
  note: nullableText('note'),
})

export const expenseController = {
  // POST /api/trips/:id/expenses
  async create(req: Request, res: Response) {
    const input = parseInput(createExpenseSchema, req.body)
    const expense = await expenseService.create(req.params.id, input, req.userId!)
    res.status(201).json({ success: true, data: expense })
  },

  // PUT /api/trips/:id/expenses/:expenseId
  async update(req: Request, res: Response) {
    const input = parseInput(updateExpenseSchema, req.body)
    const expense = await expenseService.update(
      req.params.id,
      req.params.expenseId,
      input,
      req.userId!,
    )
    res.json({ success: true, data: expense })
  },

  // DELETE /api/trips/:id/expenses/:expenseId
  async remove(req: Request, res: Response) {
    await expenseService.remove(req.params.id, req.params.expenseId, req.userId!)
    res.json({ success: true, data: { id: req.params.expenseId } })
  },
}
