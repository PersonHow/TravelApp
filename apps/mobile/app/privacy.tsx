import { PublicPage, PublicSection } from '@/components/common/PublicPage'

export default function PrivacyScreen() {
  return (
    <PublicPage title="隱私權政策">
      <PublicSection title="我們處理的資料">
        建立帳號時會處理姓名、Email
        及密碼雜湊。使用服務時會儲存你輸入的家庭成員、旅程、活動、航班、住宿、行李與記帳資料，以及維護服務安全所需的請求紀錄。
      </PublicSection>
      <PublicSection title="資料用途與共用範圍">
        資料用於登入、家庭成員協作、行程管理及你主動使用的搜尋或 AI
        功能。加入同一家庭的成員可查看和編輯共用旅程；請勿在共用欄位放入不希望家庭成員看到的敏感資料。
      </PublicSection>
      <PublicSection title="第三方服務">
        當你使用地圖、景點、路線、航班搜尋或 AI 功能時，相關查詢可能傳送至 Google、AviationStack 或
        Anthropic。LINE 登入與通知功能啟用後，會依你使用的功能與 LINE
        交換必要資料。請參閱各服務自己的隱私權政策。
      </PublicSection>
      <PublicSection title="保存與刪除">
        資料保存於服務使用期間；你可以依資料刪除說明提出查詢、更正或刪除要求。共用家庭資料可能涉及其他成員，處理刪除要求時會先確認資料歸屬及影響範圍。
      </PublicSection>
      <PublicSection title="政策變更">
        如資料處理方式有重大變更，我們會更新此頁並標示更新日期。最後更新：2026-10-14。
      </PublicSection>
    </PublicPage>
  )
}
