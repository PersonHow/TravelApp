// 記帳 tab：目前行程的支出列表（依日期分組）＋總計與付款人統計，可新增/編輯/刪除
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { Plus, Wallet } from 'lucide-react-native'
import { useTripStore } from '@/store/useTripStore'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { familyService } from '@/services/familyService'
import { ExpenseFormModal, expenseCategoryLabel } from '@/components/trip/ExpenseFormModal'
import { formatDate, toDateInput } from '@/utils/format'
import { formatPrice, toTWD } from '@/utils/activityCategory'
import type { Expense, FamilyMemberWithUser } from '@/types/api'

export default function ExpensesScreen() {
  const isDesktop = useIsDesktop()
  // currentTrip 由 trip/[id]/_layout 保證載入完成
  const currentTrip = useTripStore((s) => s.currentTrip)
  // 彈窗狀態：'create' 或要編輯的那筆；null = 關閉
  const [modal, setModal] = useState<'create' | Expense | null>(null)
  // 付款人選項：行程所屬家庭的成員
  const [members, setMembers] = useState<FamilyMemberWithUser[]>([])

  const familyId = currentTrip?.familyId
  useEffect(() => {
    if (!familyId) return
    familyService
      .list()
      .then((families) => setMembers(families.find((f) => f.id === familyId)?.members ?? []))
      .catch(() => setMembers([])) // 載不到成員只是少了付款人選項，不擋記帳
  }, [familyId])

  if (!currentTrip) return null
  const { symbol, fx } = currentTrip
  const expenses = currentTrip.expenses

  // 總計與付款人統計
  const total = expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalTwd = toTWD(total, fx)
  const byPayer = new Map<string, { name: string; amount: number }>()
  for (const e of expenses) {
    const key = e.payer?.id ?? ''
    const name = e.payer?.name ?? '未指定'
    byPayer.set(key, { name, amount: (byPayer.get(key)?.amount ?? 0) + e.amount })
  }

  // 依日期分組（後端已按 date 升冪排序）
  const groups: { date: string; items: Expense[] }[] = []
  for (const e of expenses) {
    const day = toDateInput(e.date)
    const last = groups[groups.length - 1]
    if (last && last.date === day) last.items.push(e)
    else groups.push({ date: day, items: [e] })
  }

  return (
    <View className="flex-1 bg-bg dark:bg-dark-bg">
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 40 : 16,
          paddingTop: isDesktop ? 34 : 10,
          paddingBottom: 40,
          maxWidth: 760,
          width: '100%',
          alignSelf: isDesktop ? 'flex-start' : 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-ink dark:text-dark-ink text-[26px] font-black tracking-tight">
              記帳
            </Text>
            <Text className="text-muted dark:text-dark-muted text-[13px] mt-1">
              {currentTrip.title} · 點任一筆編輯
            </Text>
          </View>
          <Pressable
            onPress={() => setModal('create')}
            className="flex-row items-center gap-1 bg-accent dark:bg-dark-accent rounded-full px-3 py-1.5 active:opacity-80"
          >
            <Plus size={13} color="#fff" />
            <Text className="text-white text-xs font-bold">新增</Text>
          </Pressable>
        </View>

        {/* 總計卡：總支出 + 換算台幣 + 各付款人小計 */}
        <View className="mt-5 p-4 rounded-[14px] bg-surface dark:bg-dark-surface border border-line dark:border-dark-line">
          <View className="flex-row items-center gap-1.5">
            <Wallet size={14} color="#6c7bd6" />
            <Text className="text-muted dark:text-dark-muted text-xs font-bold tracking-wider">
              總支出
            </Text>
          </View>
          <View className="flex-row items-end gap-2 mt-1.5">
            <Text className="text-ink dark:text-dark-ink text-[28px] font-black">
              {total === 0 ? `${symbol ?? ''}0` : formatPrice(total, symbol)}
            </Text>
            {totalTwd && (
              <Text className="text-muted dark:text-dark-muted text-[13px] mb-1.5">
                ≈ {totalTwd}
              </Text>
            )}
          </View>
          {byPayer.size > 0 && (
            <View className="flex-row flex-wrap gap-1.5 mt-2.5">
              {[...byPayer.values()].map((p) => (
                <View
                  key={p.name}
                  className="px-2.5 py-1 rounded-full bg-surface-2 dark:bg-dark-surface-2"
                >
                  <Text className="text-muted dark:text-dark-muted text-[11.5px] font-bold">
                    {p.name} {formatPrice(p.amount, symbol) || `${symbol ?? ''}0`}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 支出列表（依日期分組） */}
        {expenses.length === 0 ? (
          <View className="items-center py-10 mt-6 border-[1.5px] border-dashed border-line dark:border-dark-line rounded-[14px]">
            <Text className="text-muted dark:text-dark-muted text-[13px]">
              還沒有帳目，按右上「新增」開始記
            </Text>
          </View>
        ) : (
          groups.map((g) => (
            <View key={g.date} className="mt-6">
              <Text className="text-muted dark:text-dark-muted text-[12px] font-bold tracking-wider mb-2">
                {formatDate(g.date)}
              </Text>
              <View className="rounded-[14px] overflow-hidden border border-line dark:border-dark-line">
                {g.items.map((e, i) => (
                  <Pressable
                    key={e.id}
                    onPress={() => setModal(e)}
                    className={`flex-row items-center px-4 py-3 bg-surface dark:bg-dark-surface active:opacity-70 ${
                      i > 0 ? 'border-t border-line dark:border-dark-line' : ''
                    }`}
                  >
                    <View className="flex-1 pr-3">
                      <Text
                        className="text-ink dark:text-dark-ink text-[14.5px] font-bold"
                        numberOfLines={1}
                      >
                        {e.title}
                      </Text>
                      <Text className="text-muted dark:text-dark-muted text-[11.5px] mt-0.5">
                        {expenseCategoryLabel(e.category)}
                        {e.payer ? ` · ${e.payer.name}` : ''}
                        {e.note ? ` · ${e.note}` : ''}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-ink dark:text-dark-ink text-[15px] font-extrabold">
                        {e.amount === 0 ? `${symbol ?? ''}0` : formatPrice(e.amount, symbol)}
                      </Text>
                      {toTWD(e.amount, fx) && (
                        <Text className="text-muted dark:text-dark-muted text-[10.5px] mt-0.5">
                          ≈ {toTWD(e.amount, fx)}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ExpenseFormModal
        visible={modal !== null}
        onClose={() => setModal(null)}
        trip={currentTrip}
        expense={modal === 'create' ? null : modal}
        members={members}
      />
    </View>
  )
}
