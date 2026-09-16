// 「締切が近い予定」「出し忘れている予定」を選び出す計算。
// 画面側に書くとテストしづらいので分けている。

import { diffDays, toMinutes } from "./date.js";
import { DEADLINE_TYPES } from "../data/eventTypes.js";

/**
 * 日付 → 時刻の順に並べる比較関数。
 * sort() に渡す関数は「aが先なら負の数、bが先なら正の数」を返す約束になっている。
 * 時刻が未入力のものは、その日の先頭ではなく末尾に置く（-1 ではなく大きい数を入れる）。
 */
export function compareEvents(a, b) {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const am = toMinutes(a.start) ?? 24 * 60 + 1;
  const bm = toMinutes(b.start) ?? 24 * 60 + 1;
  return am - bm;
}

/**
 * 未完了の予定を「期限切れ」と「これから」に振り分ける。
 *
 * @param {object[]} events すべての予定
 * @param {string} todayKey 今日（"YYYY-MM-DD"）
 * @param {number} withinDays 何日先までを「これから」に含めるか
 */
export function selectUpcoming(events, todayKey, withinDays = 14) {
  const overdue = [];
  const soon = [];

  for (const e of events) {
    if (e.done) continue;
    const days = diffDays(todayKey, e.date);
    if (days < 0) {
      // 過ぎた予定を全部出すとうるさいので、出し忘れが致命的な締切系だけ残す
      if (DEADLINE_TYPES.includes(e.type)) overdue.push({ event: e, days });
    } else if (days <= withinDays) {
      soon.push({ event: e, days });
    }
  }

  overdue.sort((a, b) => compareEvents(a.event, b.event));
  soon.sort((a, b) => compareEvents(a.event, b.event));
  return { overdue, soon };
}

/**
 * 予定を日付ごとにまとめる。
 * 戻り値は [{ date: "2026-09-16", events: [...] }, ...] の形。
 * 画面側で「日付見出し＋その日の予定」を素直に書けるようにするため。
 */
export function groupByDate(events) {
  const sorted = [...events].sort(compareEvents);
  const groups = [];
  for (const e of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === e.date) last.events.push(e);
    else groups.push({ date: e.date, events: [e] });
  }
  return groups;
}
