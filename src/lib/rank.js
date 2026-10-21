import { GENRES } from "../data/lines";

// 投稿数から決まるレベルと称号、名前の横に出すラーメンマークの種類を計算する。
// レベルは1件目の投稿で 1 になり、1件投稿するごとに 1 上がる。20 で頭打ち。投稿0件の人はレベルなし（0）。

export const MAX_LEVEL = 20;

/** 投稿数からレベルを出す。投稿0件なら 0 */
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

/** ユーザー1人分のレベル情報。投稿がまだない人はレベル0・マークなし・称号なしになる */
export function userRank(genreCounts = {}) {
  const count = Object.values(genreCounts).reduce((sum, n) => sum + n, 0);
  const level = levelFromCount(count);
  const genre = topGenre(genreCounts);
  return { count, level, genre, title: titleFor(level, genre), genreCounts };
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
