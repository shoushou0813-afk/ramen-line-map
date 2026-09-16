// 予定の種別。色は時間割の見分けやすさ優先で、締切系を赤系に寄せている。
// color = 文字と枠の色 / bg = ブロックの背景色

export const EVENT_TYPES = [
  { id: "briefing", label: "説明会", short: "説", color: "#1d4ed8", bg: "#e5edff" },
  { id: "es", label: "ES締切", short: "ES", color: "#b91c1c", bg: "#ffe4e4" },
  { id: "webtest", label: "Webテスト", short: "テ", color: "#6d28d9", bg: "#efe6ff" },
  { id: "interview", label: "面接", short: "面", color: "#c2410c", bg: "#ffeada" },
  { id: "og", label: "OB/OG訪問", short: "OB", color: "#0f766e", bg: "#dcf5f1" },
  { id: "other", label: "その他", short: "他", color: "#404040", bg: "#eeeeee" },
];

/** id から種別を引けるようにした辞書。{ briefing: {...}, es: {...} } の形 */
export const TYPE_MAP = Object.fromEntries(EVENT_TYPES.map((t) => [t.id, t]));

/** 締切として扱う種別（提出しそびれると終わるもの）。未提出アラートの対象 */
export const DEADLINE_TYPES = ["es", "webtest"];

export function typeOf(id) {
  return TYPE_MAP[id] ?? TYPE_MAP.other;
}
