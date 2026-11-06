// 時間割の「予定ブロックをどこに何個並べるか」を計算する。
// 画面（JSX）側から計算を切り離してあるので、ここだけテストで確かめられる。

import { toMinutes } from "./date.js";

/** 種別ごとの既定の所要時間（分）。終了時刻が未入力のときに使う */
const DEFAULT_DURATION = {
  es: 30, // 締切は「点」なので短く置く
  webtest: 60,
  briefing: 90,
  interview: 60,
  og: 60,
  other: 60,
};

/**
 * 予定1件から、時間割上の開始・終了（0時からの分数）を求める。
 * - 開始時刻が空なら null を返す（= 時間未定。終日エリアに置く）
 * - 終了時刻が空、または開始以前なら、種別ごとの既定時間を足して埋める
 */
export function resolveRange(event) {
  const start = toMinutes(event.start);
  if (start == null) return null;

  const rawEnd = toMinutes(event.end);
  const fallback = DEFAULT_DURATION[event.type] ?? 60;
  const end = rawEnd != null && rawEnd > start ? rawEnd : start + fallback;

  // 24時を超えないように頭打ちにする（深夜のES締切 23:59 などで溢れないように）
  return { startMin: start, endMin: Math.min(end, 24 * 60) };
}

/**
 * 同じ日の予定が時間的に重なったとき、横に何分割して何番目に置くかを決める。
 *
 * 用語:
 *   lane（レーン）… 横方向の置き場所。0が一番左。
 *   lanes         … その予定が属するかたまりの分割数。幅 = 100% / lanes になる。
 *
 * やり方:
 *   1. 開始時刻順に並べる
 *   2. 直前までの最大終了時刻より後に始まる予定が来たら「重なりのかたまり」が切れたとみなす
 *   3. かたまりの中では、空いている一番左のレーンに入れる
 *
 * @param {{id: string, startMin: number, endMin: number}[]} items
 * @returns 同じ要素に lane / lanes を足した配列（開始時刻順）
 */
export function assignLanes(items) {
  const sorted = [...items].sort(
    (a, b) => a.startMin - b.startMin || a.endMin - b.endMin
  );

  const result = [];
  let cluster = []; // 現在の「重なりのかたまり」
  let laneEnds = []; // laneEnds[i] = レーンiに今入っている予定の終了時刻
  let clusterEnd = -Infinity;

  // かたまりが確定したら、その中の全員に同じ lanes（分割数）を配る
  const flush = () => {
    const lanes = laneEnds.length;
    for (const item of cluster) result.push({ ...item, lanes });
    cluster = [];
    laneEnds = [];
    clusterEnd = -Infinity;
  };

  for (const item of sorted) {
    // 直前のかたまりの誰とも重ならない = 新しいかたまりの始まり
    if (item.startMin >= clusterEnd) flush();

    // 終了済みのレーンのうち一番左を再利用する
    let lane = laneEnds.findIndex((end) => end <= item.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMin);
    } else {
      laneEnds[lane] = item.endMin;
    }

    cluster.push({ ...item, lane });
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flush();

  return result;
}

/**
 * 1日分の予定を「時間割に置くもの」と「終日（時間未定）エリアに置くもの」に分ける。
 * 置くものには lane / lanes と、上からの位置・高さを % で持たせる。
 *
 * @param {object[]} events その日の予定
 * @param {number} startHour 時間割の左端の時刻（例: 8）
 * @param {number} endHour   時間割の右端の時刻（例: 22）
 */
export function layoutDay(events, startHour, endHour) {
  const spanMin = (endHour - startHour) * 60;
  const timed = [];
  const allDay = [];

  for (const event of events) {
    const range = resolveRange(event);
    if (!range) {
      allDay.push(event);
      continue;
    }
    // 表示範囲からはみ出す予定は、見えなくならないように端で切り詰める
    const startMin = Math.max(range.startMin, startHour * 60);
    const endMin = Math.min(range.endMin, endHour * 60);
    if (endMin <= startMin) {
      allDay.push(event); // 範囲外（早朝・深夜）は終日エリアに逃がす
      continue;
    }
    timed.push({ event, id: event.id, startMin, endMin });
  }

  const placed = assignLanes(timed).map((item) => ({
    ...item,
    topPct: ((item.startMin - startHour * 60) / spanMin) * 100,
    heightPct: ((item.endMin - item.startMin) / spanMin) * 100,
    widthPct: 100 / item.lanes,
    leftPct: (100 / item.lanes) * item.lane,
  }));

  return { timed: placed, allDay };
}
