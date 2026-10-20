import type { ReactNode } from 'react'
import { Link } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'

const OPERATOR_NAME = process.env.EXPO_PUBLIC_OPERATOR_NAME
const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL

export function PublicPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ScrollView className="flex-1 bg-bg dark:bg-dark-bg" contentContainerStyle={{ padding: 24 }}>
      <View className="w-full max-w-[760px] self-center gap-5 pb-16">
        <Link href="/" className="text-accent text-[14px] font-bold">
          ← 返回旅程
        </Link>
        <Text className="text-ink dark:text-dark-ink text-[28px] font-black">{title}</Text>
        {(!OPERATOR_NAME || !SUPPORT_EMAIL) && (
          <Text className="text-accent-2 text-[13px]">
            這是上線前草稿。正式發布前須填入營運者名稱與聯絡 Email。
          </Text>
        )}
        {children}
        <View className="border-t border-line dark:border-dark-line pt-5 gap-2">
          <Text className="text-muted dark:text-dark-muted text-[13px]">
            營運者：{OPERATOR_NAME || '待提供'}　聯絡 Email：{SUPPORT_EMAIL || '待提供'}
          </Text>
          <View className="flex-row flex-wrap gap-4">
            <Link href="/privacy" className="text-accent text-[13px]">
              隱私權政策
            </Link>
            <Link href="/terms" className="text-accent text-[13px]">
              服務條款
            </Link>
            <Link href="/data-deletion" className="text-accent text-[13px]">
              資料刪除
            </Link>
            <Link href="/contact" className="text-accent text-[13px]">
              聯絡我們
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export function PublicSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-ink dark:text-dark-ink text-[18px] font-extrabold">{title}</Text>
      <Text className="text-muted dark:text-dark-muted text-[15px] leading-6">{children}</Text>
    </View>
  )
}
