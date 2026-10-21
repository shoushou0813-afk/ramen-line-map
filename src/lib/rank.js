import { GENRES } from "../data/lines";

// 投稿数から決まるレベルと称号、名前の横に出すラーメンマークの種類を計算する。
// レベルは投稿0件の 0 から始まり、1件投稿するごとに 1 上がる。20 で頭打ち。Lv.0 の人には称号がない。

export const MAX_LEVEL = 20;

/** 投稿数からレベルを出す */
export function levelFromCount(count) {
  return Math.min(MAX_LEVEL, count);
}

/** 次のレベルまであと何件投稿すればいいか。最高レベルなら 0 */
export function postsToNextLevel(count) {
  return levelFromCount(count) >= MAX_LEVEL ? 0 : 1;
}

// 称号の前半。レベルが min 以上なら使う（上から順に見る）
const TITLE_STAGES = [
  { min: 20, label: "カリスマ" },
  { min: 15, label: "達人" },
  { min: 10, label: "熟練" },
  { min: 5, label: "一人前" },
  { min: 1, label: "見習い" },
];

// 称号の後半。一番多く投稿している種類で決まる
const GENRE_FANS = {
  家系: "家系ラバー",
  二郎系: "ジロリアン",
  醤油: "醤油党",
  味噌: "味噌党",
  塩: "塩党",
  つけ麺: "つけ麺党",
  その他: "麺好き",
};

// マークの盛りの段階。その種類の投稿数が 5・10・15・20 件に届くたびに 1 段階上がる（0〜4）
const TOPPING_STAGE_MINS = [20, 15, 10, 5];

// 段階ごとの名前。0 段階目は名前なし
const TOPPING_LABELS = {
  家系: ["", "海苔マシ", "ほうれん草マシ", "ライス付き", "海苔タワー"],
  二郎系: ["", "野菜マシ", "背脂マシ", "豚マシ", "全マシマシ"],
  醤油: ["", "なると", "メンマ", "チャーシュー", "特製"],
  味噌: ["", "コーン", "コーンバター", "もやしマシ", "北海道スペシャル"],
  塩: ["", "レモン", "白髪ねぎ", "鶏チャーシュー", "黄金スープ"],
  つけ麺: ["", "麺大盛り", "魚粉", "味玉", "特盛"],
  その他: ["", "ねぎ多め", "ラー油", "お酢", "全部のせ"],
};

/** その種類の投稿数から、マークの盛りの段階（0〜4）を出す */
export function toppingStage(genreCount) {
  const index = TOPPING_STAGE_MINS.findIndex((min) => genreCount >= min);
  return index === -1 ? 0 : TOPPING_STAGE_MINS.length - index;
}

/** 盛りの段階の名前（例：野菜マシ）。段階0や知らない種類なら空文字 */
export function toppingLabel(genre, genreCount) {
  return TOPPING_LABELS[genre]?.[toppingStage(genreCount)] ?? "";
}

/** レベルと種類から称号を作る（例：見習いジロリアン）。レベル0なら null */
export function titleFor(level, genre) {
  const stage = TITLE_STAGES.find((s) => level >= s.min);
  if (!stage) return null;
  return stage.label + (GENRE_FANS[genre] ?? "ラーメン好き");
}

/**
 * 一番多く投稿しているラーメンの種類を返す。投稿がなければ null。
 * 件数が同じ種類が複数あるときは、GENRES の並びで先にある方にする（毎回同じマークになるように）。
 */
export function topGenre(genreCounts) {
  let best = null;
  for (const genre of [...GENRES, ...Object.keys(genreCounts)]) {
    const count = genreCounts[genre] ?? 0;
    if (count > 0 && (best === null || count > genreCounts[best])) best = genre;
  }
  return best;
}

/** ユーザー1人分のレベル情報。投稿がまだない人は Lv.0・空の丼・称号なしになる */
export function userRank(genreCounts = {}) {
  const count = Object.values(genreCounts).reduce((sum, n) => sum + n, 0);
  const level = levelFromCount(count);
  const genre = topGenre(genreCounts);
  const stage = genre ? toppingStage(genreCounts[genre]) : 0;
  return { count, level, genre, stage, title: titleFor(level, genre), genreCounts };
}

/** { user_id, genre } の配列から「ユーザーID → 種類ごとの件数」の対応表を作る */
export function genreCountsByUser(rows) {
  const byUser = {};
  for (const row of rows) {
    const counts = (byUser[row.user_id] ??= {});
    counts[row.genre] = (counts[row.genre] ?? 0) + 1;
  }
  return byUser;
}

/**
 * ほかの人に見せる用の「ユーザーID → 種類ごとの件数」を作る。
 * レベルを非公開にしている人は null にして、RankBadge が何も出さないようにする。
 */
export function hideRanks(genreCountsByUser, hiddenUserIds) {
  const visible = { ...genreCountsByUser };
  for (const userId of hiddenUserIds) visible[userId] = null;
  return visible;
}
