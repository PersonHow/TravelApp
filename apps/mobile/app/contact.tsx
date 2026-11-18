import { Linking, Text } from 'react-native'
import { PublicPage, PublicSection } from '@/components/common/PublicPage'

export default function ContactScreen() {
  const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL
  return (
    <PublicPage title="聯絡我們">
      <PublicSection title="服務與隱私問題">
        如需帳號協助、資料查詢、更正、刪除或回報服務問題，請透過以下 Email 聯絡。
      </PublicSection>
      {email && (
        <Text
          accessibilityRole="link"
          onPress={() => Linking.openURL(`mailto:${email}`)}
          className="text-accent text-[16px] font-bold underline"
        >
          {email}
        </Text>
      )}
    </PublicPage>
  )
}
