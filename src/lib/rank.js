import { GENRES } from "../data/lines";

// 投稿数から決まるランクと、名前の横に出すラーメンマークの種類を計算する。
// ランクは投稿0件で 5 から始まり、1件投稿するごとに 1 上がる。20 で頭打ち。

export const MIN_RANK = 5;
export const MAX_RANK = 20;

/** 投稿数からランクを出す */
export function rankFromCount(count) {
  return Math.min(MAX_RANK, MIN_RANK + count);
}

/** 次のランクまであと何件投稿すればいいか。最高ランクなら 0 */
export function postsToNextRank(count) {
  return rankFromCount(count) >= MAX_RANK ? 0 : 1;
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

/** ユーザー1人分のランク情報。投稿がまだない人もランク5・マークなしとして扱う */
export function userRank(genreCounts = {}) {
  const count = Object.values(genreCounts).reduce((sum, n) => sum + n, 0);
  return { count, rank: rankFromCount(count), genre: topGenre(genreCounts), genreCounts };
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
