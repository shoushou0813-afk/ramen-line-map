// 月表示（カレンダー）のための計算。
// 週の時間割は「今週どこが埋まっているか」は分かるが、
// 「今月どのあたりに締切が固まっているか」が見えない。それを補う。

import { addDays, startOfWeek, toDateKey } from "./date.js";

/** その月の1日 */
export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** その月の最終日 */
export function endOfMonth(date) {
  // 「翌月の0日」は当月の末日になる。月ごとの日数を持たなくて済む
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * nか月後（マイナスならnか月前）。
 * 必ず1日で組み立てる。31日から1か月進めると、短い月では繰り上がって
 * 翌々月になってしまうため。
 */
export function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

/** "2026年9月" */
export function formatYearMonth(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

/**
 * 月のカレンダーに並べる日付を、月曜始まりの週ごとにまとめて返す。
 * 週の形を崩さないよう、前後の月の日も枠を埋めるぶんだけ入る
 * （その月の日かどうかは inMonth で見分ける）。
 *
 * @returns {{key: string, day: number, inMonth: boolean}[][]} 週の配列
 */
export function monthGrid(date) {
  const first = startOfMonth(date);
  const last = endOfMonth(date);
  const month = first.getMonth();

  const weeks = [];
  let cursor = startOfWeek(first);

  // 月末を含む週まで並べる。最大6週（31日が日曜始まりの月）
  while (weeks.length < 6) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(cursor, i);
        return { key: toDateKey(d), day: d.getDate(), inMonth: d.getMonth() === month };
      })
    );
    cursor = addDays(cursor, 7);
    if (cursor > last) break;
  }

  return weeks;
}
