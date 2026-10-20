import { PublicPage, PublicSection } from '@/components/common/PublicPage'

export default function DataDeletionScreen() {
  const email = process.env.EXPO_PUBLIC_SUPPORT_EMAIL
  return (
    <PublicPage title="帳號與資料刪除">
      <PublicSection title="提出要求">
        請使用註冊帳號的 Email，寄信至 {email || '待提供的支援 Email'}，主旨寫「Travel App
        帳號與資料刪除」。若無法使用原 Email，請在信中說明，我們會先核對帳號歸屬。
      </PublicSection>
      <PublicSection title="處理範圍">
        我們會協助刪除帳號資料，並確認你的旅程、家庭與記帳資料是否由其他家庭成員共同使用。共用資料的處理方式會在核對後向你說明；依法或為處理爭議必須保留的資料會另行告知。
      </PublicSection>
    </PublicPage>
  )
}
