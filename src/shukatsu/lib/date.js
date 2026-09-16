// 日付まわりの計算をここに集約する。
//
// ここで一番気をつけているのは「日付がずれないこと」。
// new Date("2026-09-16") のように文字列を直接渡すと、JavaScriptはこれを
// UTC（世界標準時）の0時と解釈する。日本時間（UTC+9）で表示すると
// 9月16日 9:00 になり、見た目上は合っているように見えるが、
// 環境やタイムゾーン次第で前日にずれる事故が起きる。
// そこで日付文字列は必ず自分で分解し、new Date(年, 月, 日) の形で
// 「ローカル時間の0時」として作る。

/** 曜日ラベル。この時間割は月曜始まりにしている（就活の予定は平日が中心なので） */
export const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

/**
 * "2026-09-16" → Date（ローカル時間の0時）
 */
export function parseDateKey(key) {
  const [y, m, d] = String(key).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Date → "2026-09-16"
 * padStart(2, "0") は「1桁なら先頭に0を足す」処理。9 → "09" にして桁を揃える。
 */
export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** n日後（マイナスならn日前）のDateを返す。元のDateは書き換えない */
export function addDays(date, n) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + n);
  return next;
}

/**
 * その日が含まれる週の月曜日を返す。
 * getDay() は 日=0, 月=1, ... 土=6 を返すので、月曜を0にするために
 * (day + 6) % 7 で読み替えている（日曜=6扱い）。
 */
export function startOfWeek(date) {
  const day = date.getDay();
  const offset = (day + 6) % 7;
  return addDays(date, -offset);
}

/** その週の月曜〜日曜の日付キー7個 */
export function weekDateKeys(weekStart) {
  return Array.from({ length: 7 }, (_, i) => toDateKey(addDays(weekStart, i)));
}

/**
 * "13:00" → 780（0時からの分数）。空文字や不正値は null。
 * 時刻を「分」という数値1個にしておくと、比較も差分も足し算だけで済む。
 */
export function toMinutes(time) {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(time).trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** 780 → "13:00" */
export function toTimeLabel(minutes) {
  if (minutes == null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * 日付キー同士の差（日数）。toKey - fromKey。
 * 「締切まであと何日か」の計算に使う。
 * ミリ秒の割り算だと夏時間（サマータイム）で1時間ずれた分だけ
 * 切り捨てが狂う国があるので、いったん正午に寄せてから割っている。
 */
export function diffDays(fromKey, toKey) {
  const a = parseDateKey(fromKey);
  const b = parseDateKey(toKey);
  a.setHours(12, 0, 0, 0);
  b.setHours(12, 0, 0, 0);
  return Math.round((b - a) / 86400000);
}

/** "2026-09-16" → "9/16" */
export function formatMD(key) {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** "2026-09-16" → "9/16(水)" */
export function formatMDW(key) {
  const d = parseDateKey(key);
  return `${formatMD(key)}(${WEEKDAY_LABELS[(d.getDay() + 6) % 7]})`;
}

/** 締切までの残り日数を日本語にする。過去なら「◯日超過」 */
export function countdownLabel(days) {
  if (days < 0) return `${-days}日超過`;
  if (days === 0) return "今日まで";
  if (days === 1) return "明日まで";
  return `あと${days}日`;
}
