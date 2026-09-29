// 記帳新增／編輯彈窗（記帳 tab 使用）
import { useEffect, useState } from 'react'
import { ChipSelect, Field, FormSheet } from '@/components/common/FormSheet'
import { DateField } from '@/components/common/DateField'
import { ApiError } from '@/services/api'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import { parseDateTime, toDateInput } from '@/utils/format'
import type { Expense, ExpenseCategory, FamilyMemberWithUser, TripDetail } from '@/types/api'

// 分類選項（表單 ChipSelect 與列表顯示共用）
export const EXPENSE_CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: '餐飲' },
  { value: 'transport', label: '交通' },
  { value: 'ticket', label: '門票' },
  { value: 'shopping', label: '購物' },
  { value: 'lodging', label: '住宿' },
  { value: 'other', label: '其他' },
]

export function expenseCategoryLabel(category: ExpenseCategory): string {
  return EXPENSE_CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? '其他'
}

interface ExpenseFormModalProps {
  visible: boolean
  onClose: () => void
  trip: TripDetail
  // 編輯模式傳帳目；新增模式傳 null
  expense: Expense | null
  // 付款人選項（行程所屬家庭的成員，由頁面載入傳進來）
  members: FamilyMemberWithUser[]
}

export function ExpenseFormModal({
  visible,
  onClose,
  trip,
  expense,
  members,
}: ExpenseFormModalProps) {
  const reloadCurrent = useTripStore((s) => s.reloadCurrent)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [date, setDate] = useState('')
  const [payerId, setPayerId] = useState('') // '' = 不指定
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setError(null)
    setTitle(expense?.title ?? '')
    setAmount(expense ? String(expense.amount) : '')
    setCategory(expense?.category ?? 'food')
    // 新增模式預設今天（記帳通常當天記）
    setDate(toDateInput(expense?.date ?? new Date().toISOString()))
    setPayerId(expense?.payerId ?? '')
    setNote(expense?.note ?? '')
  }, [visible, expense])

  // 付款人選項：不指定 + 家庭成員
  const payerOptions = [
    { value: '', label: '不指定' },
    ...members.map((m) => ({ value: m.userId, label: m.user.name })),
  ]

  async function handleSubmit() {
    setError(null)
    if (!title.trim()) {
      setError('請輸入項目名稱')
      return
    }
    const amountNum = Number(amount)
    if (amount.trim() === '' || !Number.isInteger(amountNum) || amountNum < 0) {
      setError('金額請輸入非負整數')
      return
    }
    const dateIso = parseDateTime(date)
    if (!dateIso) {
      setError('日期格式請用 YYYY-MM-DD')
      return
    }

    setSubmitting(true)
    try {
      if (expense) {
        await tripService.updateExpense(trip.id, expense.id, {
          title: title.trim(),
          amount: amountNum,
          category,
          date: dateIso,
          payerId: payerId || null,
          note: note.trim() || null,
        })
      } else {
        await tripService.createExpense(trip.id, {
          title: title.trim(),
          amount: amountNum,
          category,
          date: dateIso,
          payerId: payerId || undefined,
          note: note.trim() || undefined,
        })
      }
      await reloadCurrent()
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '儲存失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!expense) return
    setSubmitting(true)
    setError(null)
    try {
      await tripService.removeExpense(trip.id, expense.id)
      await reloadCurrent()
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '刪除失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <FormSheet
      visible={visible}
      title={expense ? '編輯帳目' : '新增帳目'}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitting={submitting}
      error={error}
      onDelete={expense ? handleDelete : undefined}
    >
      <Field
        label="項目名稱 *"
        value={title}
        onChangeText={setTitle}
        placeholder="例如：一蘭拉麵晚餐"
      />
      <Field
        label={`金額 *${trip.symbol ? `（${trip.symbol}）` : ''}`}
        value={amount}
        onChangeText={setAmount}
        placeholder="例如：1290"
        keyboardType="number-pad"
      />
      <ChipSelect
        label="分類"
        options={EXPENSE_CATEGORY_OPTIONS}
        value={category}
        onChange={setCategory}
      />
      <DateField label="日期 *" mode="date" value={date} onChange={setDate} />
      <ChipSelect label="付款人" options={payerOptions} value={payerId} onChange={setPayerId} />
      <Field label="備註" value={note} onChangeText={setNote} placeholder="想記的細節" multiline />
    </FormSheet>
  )
}
