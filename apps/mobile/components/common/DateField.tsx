// 日期／時間欄位：網頁版用瀏覽器原生選擇器（input type=date / datetime-local / time）
// 原生 App 尚未導入 datetimepicker 套件，先退回手動輸入（格式提示在 label）
import { Platform, Text, View } from 'react-native'
import { useThemeStore } from '@/store/useThemeStore'
import { Field } from './FormSheet'

type Mode = 'date' | 'datetime' | 'time'

const INPUT_TYPE: Record<Mode, string> = {
  date: 'date',
  datetime: 'datetime-local',
  time: 'time',
}

const FORMAT_HINT: Record<Mode, string> = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm',
  time: 'HH:mm',
}

interface DateFieldProps {
  label: string
  // date: "YYYY-MM-DD"；datetime: "YYYY-MM-DD HH:mm"；time: "HH:mm"（與各表單既有 state 格式一致）
  value: string
  onChange: (v: string) => void
  mode: Mode
  placeholder?: string
}

export function DateField({ label, value, onChange, mode, placeholder }: DateFieldProps) {
  const dark = useThemeStore((s) => s.dark)

  if (Platform.OS !== 'web') {
    return (
      <Field
        label={`${label}（${FORMAT_HINT[mode]}）`}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? FORMAT_HINT[mode]}
        autoCapitalize="none"
      />
    )
  }

  // datetime-local 的值以 T 分隔；表單 state 統一用空格
  const inputValue = mode === 'datetime' ? value.replace(' ', 'T') : value
  return (
    <View>
      <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider mb-1.5">
        {label}
      </Text>
      <input
        type={INPUT_TYPE[mode]}
        value={inputValue}
        onChange={(e) =>
          onChange(mode === 'datetime' ? e.target.value.replace('T', ' ') : e.target.value)
        }
        style={{
          backgroundColor: dark ? '#2b2750' : '#f1f1fb', // surface-2 / dark-surface-2
          border: `1px solid ${dark ? '#332e58' : '#ececf6'}`, // line / dark-line
          borderRadius: 11,
          padding: '12px 14px',
          fontSize: 15,
          color: dark ? '#efeefb' : '#322f54', // ink / dark-ink
          colorScheme: dark ? 'dark' : 'light', // 原生 picker 圖示跟著深淺色
          fontFamily: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </View>
  )
}
