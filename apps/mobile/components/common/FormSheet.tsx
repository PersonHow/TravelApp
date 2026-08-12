// 共用表單彈窗：標題列 + 可捲動表單區 + 底部「取消/儲存」（編輯模式多一個刪除）
// 刪除採兩段式確認（按一下變「確認刪除？」），因為 RN 的 Alert 在 Web 上不會跳
import { useState, type ReactNode } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'
import { X } from 'lucide-react-native'

interface FormSheetProps {
  visible: boolean
  title: string
  onClose: () => void
  onSubmit: () => void
  submitting?: boolean
  error?: string | null
  // 有傳才顯示刪除鈕（編輯模式）
  onDelete?: () => void
  // 送出鈕文字（預設「儲存」；AI 規劃等多步驟流程可換字）
  submitLabel?: string
  children: ReactNode
}

export function FormSheet({
  visible,
  title,
  onClose,
  onSubmit,
  submitting,
  error,
  onDelete,
  submitLabel = '儲存',
  children,
}: FormSheetProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function close() {
    setConfirmingDelete(false)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center bg-black/45 px-4"
      >
        <View className="w-full max-w-[440px] max-h-[86%] bg-surface dark:bg-dark-surface rounded-[20px] overflow-hidden">
          {/* 標題列 */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-line dark:border-dark-line">
            <Text className="text-ink dark:text-dark-ink text-[17px] font-extrabold">{title}</Text>
            <Pressable onPress={close} className="p-1 active:opacity-60" hitSlop={8}>
              <X size={18} color="#8c89a8" />
            </Pressable>
          </View>

          {/* 表單區 */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}

            {error && (
              <View className="bg-accent-2/15 px-3 py-2 rounded-[10px]">
                <Text className="text-accent-2 text-[13px]">{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* 底部按鈕 */}
          <View className="flex-row items-center gap-2.5 px-5 py-4 border-t border-line dark:border-dark-line">
            {onDelete && (
              <Pressable
                onPress={() => (confirmingDelete ? onDelete() : setConfirmingDelete(true))}
                disabled={submitting}
                className={`px-3.5 py-2.5 rounded-[11px] active:opacity-70 disabled:opacity-40 ${
                  confirmingDelete ? 'bg-accent-2' : 'bg-accent-2/15'
                }`}
              >
                <Text
                  className={`text-[13px] font-bold ${confirmingDelete ? 'text-white' : 'text-accent-2'}`}
                >
                  {confirmingDelete ? '確認刪除？' : '刪除'}
                </Text>
              </Pressable>
            )}
            <View className="flex-1" />
            <Pressable
              onPress={close}
              disabled={submitting}
              className="px-4 py-2.5 rounded-[11px] border border-line dark:border-dark-line active:opacity-70"
            >
              <Text className="text-muted dark:text-dark-muted text-[13px] font-bold">取消</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              className="px-5 py-2.5 rounded-[11px] bg-accent dark:bg-dark-accent active:opacity-80 disabled:opacity-40"
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-[13px] font-bold">{submitLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// 表單欄位：標籤 + 輸入框（樣式與登入頁的輸入框一致）
interface FieldProps extends TextInputProps {
  label: string
}

export function Field({ label, ...inputProps }: FieldProps) {
  return (
    <View>
      <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#8c89a8"
        className="bg-surface-2 dark:bg-dark-surface-2 border border-line dark:border-dark-line rounded-[11px] px-3.5 py-3 text-ink dark:text-dark-ink text-[15px]"
        {...inputProps}
      />
    </View>
  )
}

// chips 單選（活動類別、選擇第幾天等）
interface ChipOption<T extends string> {
  value: T
  label: string
}

export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: ChipOption<T>[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <View>
      <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">
        {label}
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {options.map((opt) => {
          const isActive = value === opt.value
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              className={`px-3.5 py-1.5 rounded-full active:opacity-70 ${
                isActive
                  ? 'bg-ink dark:bg-dark-ink'
                  : 'bg-surface dark:bg-dark-surface border border-line dark:border-dark-line'
              }`}
            >
              <Text
                className={`text-[12.5px] font-bold ${
                  isActive ? 'text-white dark:text-ink' : 'text-ink dark:text-dark-ink'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
