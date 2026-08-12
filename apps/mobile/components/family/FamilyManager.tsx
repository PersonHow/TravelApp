// 家庭管理：我的家庭列表 + 成員 + email 邀請（「我的」頁使用）
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { UserPlus, Users } from 'lucide-react-native'
import { ApiError } from '@/services/api'
import { familyService } from '@/services/familyService'
import type { FamilyWithMembers } from '@/types/api'

const ROLE_LABEL: Record<string, string> = {
  OWNER: '建立者',
  ADMIN: '管理員',
  MEMBER: '成員',
}

export function FamilyManager() {
  const [families, setFamilies] = useState<FamilyWithMembers[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setFamilies(await familyService.list())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '無法載入家庭列表')
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (error) {
    return <Text className="text-accent-2 text-[13px] px-1">{error}</Text>
  }
  if (!families) {
    return <ActivityIndicator color="#6c7bd6" style={{ marginTop: 12 }} />
  }
  if (families.length === 0) {
    return (
      <Text className="text-muted dark:text-dark-muted text-[13px] px-1">
        還沒有家庭。到旅程總覽建立第一筆旅程時會一併建立。
      </Text>
    )
  }

  return (
    <View style={{ gap: 12 }}>
      {families.map((f) => (
        <FamilyCard key={f.id} family={f} onChanged={load} />
      ))}
    </View>
  )
}

function FamilyCard({ family, onChanged }: { family: FamilyWithMembers; onChanged: () => void }) {
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  async function handleInvite() {
    const target = email.trim()
    if (!target) return
    setInviting(true)
    setMessage(null)
    try {
      const member = await familyService.addMember(family.id, target)
      setMessage({ ok: true, text: `已把 ${member.user.name} 加入家庭` })
      setEmail('')
      onChanged()
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : '邀請失敗，請稍後再試' })
    } finally {
      setInviting(false)
    }
  }

  return (
    <View className="bg-surface dark:bg-dark-surface border border-line dark:border-dark-line rounded-[16px] overflow-hidden">
      {/* 家庭名稱 */}
      <View className="flex-row items-center gap-2 px-4 pt-3.5 pb-2">
        <Users size={15} color="#6c7bd6" />
        <Text className="text-ink dark:text-dark-ink text-[15px] font-extrabold flex-1">
          {family.name}
        </Text>
        <Text className="text-muted dark:text-dark-muted text-[11px]">
          {family.members.length} 位成員
        </Text>
      </View>

      {/* 成員列表 */}
      {family.members.map((m) => (
        <View
          key={m.id}
          className="flex-row items-center gap-2.5 px-4 py-2.5 border-t border-line dark:border-dark-line"
        >
          <View className="flex-1">
            <Text className="text-ink dark:text-dark-ink text-[13.5px] font-semibold">
              {m.user.name}
            </Text>
            <Text className="text-muted dark:text-dark-muted text-[11px]">{m.user.email}</Text>
          </View>
          <View className="bg-accent-soft rounded-full px-2 py-0.5">
            <Text className="text-accent text-[10px] font-extrabold">
              {ROLE_LABEL[m.role] ?? m.role}
            </Text>
          </View>
        </View>
      ))}

      {/* email 邀請 */}
      <View className="flex-row items-center gap-2 px-4 py-2.5 border-t border-line dark:border-dark-line">
        <TextInput
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleInvite}
          placeholder="輸入 email 邀請成員"
          placeholderTextColor="#8c89a8"
          autoCapitalize="none"
          keyboardType="email-address"
          className="flex-1 text-ink dark:text-dark-ink text-[13.5px] py-1.5"
        />
        {inviting ? (
          <ActivityIndicator size="small" color="#6c7bd6" />
        ) : (
          <Pressable
            onPress={handleInvite}
            className="flex-row items-center gap-1 bg-accent dark:bg-dark-accent rounded-full px-3 py-1.5 active:opacity-80"
          >
            <UserPlus size={12} color="#fff" />
            <Text className="text-white text-xs font-bold">邀請</Text>
          </Pressable>
        )}
      </View>
      {message && (
        <Text
          className={`text-[12px] px-4 pb-3 ${message.ok ? 'text-[#2bb673]' : 'text-accent-2'}`}
        >
          {message.text}
        </Text>
      )}
    </View>
  )
}
