// 行李清單：勾選／新增／刪除（跟著 Trip，航班詳細頁使用）
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { Check, Plus, X } from 'lucide-react-native'
import { ApiError } from '@/services/api'
import { tripService } from '@/services/tripService'
import { useTripStore } from '@/store/useTripStore'
import type { PackingItem } from '@/types/api'

interface PackingListProps {
  tripId: string
  items: PackingItem[]
}

export function PackingList({ tripId, items }: PackingListProps) {
  const reloadCurrent = useTripStore((s) => s.reloadCurrent)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await reloadCurrent()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '操作失敗，請稍後再試')
    } finally {
      setBusy(false)
    }
  }

  function handleAdd() {
    const name = newName.trim()
    if (!name) return
    run(() => tripService.createPackingItem(tripId, { name }))
    setNewName('')
  }

  const checkedCount = items.filter((i) => i.checked).length

  return (
    <View className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] overflow-hidden">
      {items.length > 0 && (
        <Text className="text-muted dark:text-dark-muted text-[11px] px-4 pt-3">
          已備妥 {checkedCount} / {items.length}
        </Text>
      )}
      {items.map((item, idx) => (
        <View
          key={item.id}
          className={`flex-row items-center gap-3 px-4 py-3 ${
            idx > 0 ? 'border-t border-line dark:border-dark-line' : ''
          }`}
        >
          {/* 勾選框 */}
          <Pressable
            onPress={() =>
              run(() => tripService.updatePackingItem(tripId, item.id, { checked: !item.checked }))
            }
            disabled={busy}
            className={`w-[22px] h-[22px] rounded-[7px] items-center justify-center border ${
              item.checked
                ? 'bg-accent dark:bg-dark-accent border-transparent'
                : 'border-line dark:border-dark-line'
            }`}
            hitSlop={6}
          >
            {item.checked && <Check size={14} color="#fff" strokeWidth={3} />}
          </Pressable>
          <Text
            className={`flex-1 text-[14.5px] ${
              item.checked
                ? 'text-muted dark:text-dark-muted line-through'
                : 'text-ink dark:text-dark-ink font-semibold'
            }`}
          >
            {item.name}
          </Text>
          <Pressable
            onPress={() => run(() => tripService.removePackingItem(tripId, item.id))}
            disabled={busy}
            className="p-1 active:opacity-60"
            hitSlop={6}
          >
            <X size={14} color="#8c89a8" />
          </Pressable>
        </View>
      ))}

      {/* 新增列 */}
      <View
        className={`flex-row items-center gap-2 px-4 py-2.5 ${
          items.length > 0 ? 'border-t border-line dark:border-dark-line' : ''
        }`}
      >
        <TextInput
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
          placeholder="新增行李項目，例如：護照"
          placeholderTextColor="#8c89a8"
          className="flex-1 text-ink dark:text-dark-ink text-[14px] py-1.5"
        />
        {busy ? (
          <ActivityIndicator size="small" color="#6c7bd6" />
        ) : (
          <Pressable
            onPress={handleAdd}
            className="flex-row items-center gap-1 bg-accent dark:bg-dark-accent rounded-full px-3 py-1.5 active:opacity-80"
          >
            <Plus size={13} color="#fff" />
            <Text className="text-white text-xs font-bold">加入</Text>
          </Pressable>
        )}
      </View>

      {error && <Text className="text-accent-2 text-[12px] px-4 pb-3">{error}</Text>}
    </View>
  )
}
