// 常用機場對照表（IATA 代碼 → 中文名稱＋國家/地區）
// 航班卡顯示用；查不到的代碼就只顯示 IATA 代碼本身
const AIRPORTS: Record<string, { name: string; country: string }> = {
  // 台灣
  TPE: { name: '桃園國際機場', country: '台灣' },
  TSA: { name: '台北松山機場', country: '台灣' },
  KHH: { name: '高雄國際機場', country: '台灣' },
  RMQ: { name: '台中國際機場', country: '台灣' },
  // 日本
  NRT: { name: '成田國際機場', country: '日本' },
  HND: { name: '東京羽田機場', country: '日本' },
  KIX: { name: '關西國際機場', country: '日本' },
  ITM: { name: '大阪伊丹機場', country: '日本' },
  NGO: { name: '中部國際機場', country: '日本' },
  FUK: { name: '福岡機場', country: '日本' },
  CTS: { name: '新千歲機場', country: '日本' },
  OKA: { name: '那霸機場', country: '日本' },
  SDJ: { name: '仙台機場', country: '日本' },
  HIJ: { name: '廣島機場', country: '日本' },
  KOJ: { name: '鹿兒島機場', country: '日本' },
  KMJ: { name: '熊本機場', country: '日本' },
  // 韓國
  ICN: { name: '仁川國際機場', country: '韓國' },
  GMP: { name: '金浦國際機場', country: '韓國' },
  PUS: { name: '金海國際機場', country: '韓國' },
  // 港澳
  HKG: { name: '香港國際機場', country: '香港' },
  MFM: { name: '澳門國際機場', country: '澳門' },
  // 東南亞／中國
  BKK: { name: '蘇凡納布機場', country: '泰國' },
  SIN: { name: '樟宜機場', country: '新加坡' },
  PVG: { name: '上海浦東機場', country: '中國' },
  PEK: { name: '北京首都機場', country: '中國' },
}

// "TPE" → "桃園國際機場（台灣）"；查不到回 null
export function airportLabel(code: string): string | null {
  const a = AIRPORTS[code.toUpperCase()]
  return a ? `${a.name}（${a.country}）` : null
}
