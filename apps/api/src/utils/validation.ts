import { z } from 'zod'
import { AppError } from './AppError'

// HTTP 輸入是執行期資料，不能只依賴 TypeScript 型別。
// 所有 controller 都透過這個入口解析，讓 400 回應格式一致。
export function parseInput<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  value: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(value)
  if (result.success) return result.data

  const issue = result.error.issues[0]
  const field = issue.path.join('.')
  throw AppError.badRequest(field ? `${field}: ${issue.message}` : issue.message)
}

export const trimmedString = (label: string, max = 200) =>
  z
    .string({ required_error: `${label} 為必填`, invalid_type_error: `${label} 必須是文字` })
    .trim()
    .min(1, `${label} 不可為空`)
    .max(max, `${label} 最多 ${max} 個字`)

export const optionalText = (label: string, max = 2000) =>
  z
    .string({ invalid_type_error: `${label} 必須是文字` })
    .trim()
    .max(max, `${label} 最多 ${max} 個字`)
    .optional()

export const nullableText = (label: string, max = 2000) => optionalText(label, max).nullable()

export const dateValue = (label: string) =>
  z
    .string({ required_error: `${label} 為必填`, invalid_type_error: `${label} 必須是日期文字` })
    .trim()
    .min(1, `${label} 不可為空`)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), `${label} 日期格式錯誤`)
    .transform((value) => new Date(value))

export const optionalDateValue = (label: string) => dateValue(label).optional()

export const nonNegativeInt = (label: string) =>
  z
    .number({ invalid_type_error: `${label} 必須是數字` })
    .int(`${label} 必須是整數`)
    .nonnegative(`${label} 不可小於 0`)

export const coordinatePair = {
  lat: z.number().min(-90, 'lat 不可小於 -90').max(90, 'lat 不可大於 90').optional().nullable(),
  lng: z.number().min(-180, 'lng 不可小於 -180').max(180, 'lng 不可大於 180').optional().nullable(),
}

export const nonEmptyUpdate = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .strict('包含不支援的欄位')
    .refine((value) => Object.keys(value).length > 0, '至少要提供一個更新欄位')
