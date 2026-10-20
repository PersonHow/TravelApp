import { PublicPage, PublicSection } from '@/components/common/PublicPage'

export default function TermsScreen() {
  return (
    <PublicPage title="服務條款">
      <PublicSection title="服務內容">
        Travel App 提供家庭旅程規劃、共享與相關查詢工具。你需提供正確帳號資訊，並妥善保管登入憑證。
      </PublicSection>
      <PublicSection title="共用資料">
        旅程屬於家庭共享空間。請在新增成員與填入訂房、航班或費用資料前，確認有權分享相關資訊。管理者可調整共用旅程及成員。
      </PublicSection>
      <PublicSection title="外部資訊">
        地圖、航班、路線與 AI
        建議可能不即時或不完整。出發前請以航空公司、住宿、交通營運者與官方公告確認重要資訊。
      </PublicSection>
      <PublicSection title="服務變更與聯絡">
        我們可能為安全與維護需要更新服務。若要詢問帳號、內容或服務問題，請使用聯絡頁所列的
        Email。最後更新：2026-10-14。
      </PublicSection>
    </PublicPage>
  )
}
