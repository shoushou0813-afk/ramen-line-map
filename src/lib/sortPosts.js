import { toDateInputValue } from "./date";

// 投稿一覧の並び替え。取得はいつもどおり投稿が新しい順で行い、表示の直前に手元で並べ替える。

export const SORT_OPTIONS = [
  { id: "date", label: "日付順（食べた日が新しい順）" },
  { id: "rating", label: "評価順（評価が高い順）" },
];

export const DEFAULT_SORT = "date";

/** 並び替えに使う「食べた日」。日付欄ができる前の投稿は、投稿した日で代わりにする */
function visitedKey(post) {
  return post.visited_on ?? toDateInputValue(new Date(post.created_at));
}

/** 投稿した日時が新しい順に比べる（同じ順位のときの並びをそろえるために使う） */
function byPostedDesc(a, b) {
  return b.created_at.localeCompare(a.created_at);
}

const COMPARERS = {
  // YYYY-MM-DD の文字列は、そのまま大小比較すれば日付の前後と一致する
  date: (a, b) => visitedKey(b).localeCompare(visitedKey(a)) || byPostedDesc(a, b),
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || byPostedDesc(a, b),
};

/** 元の配列は変えずに、並べ替えた新しい配列を返す */
export function sortPosts(posts, sortId) {
  const compare = COMPARERS[sortId] ?? COMPARERS[DEFAULT_SORT];
  return [...posts].sort(compare);
}
