// いいね（トッピングを乗せる）の数え方と、種類ごとのトッピングの名前。

// 種類ごとの「乗せるトッピング」。いいねボタンの名前とアイコンに使う
export const LIKE_TOPPINGS = {
  家系: "海苔",
  二郎系: "ニンニク",
  醤油: "なると",
  味噌: "コーン",
  塩: "レモン",
  つけ麺: "味玉",
  その他: "卵黄",
};

/** 種類に合わせたトッピングの名前。知らない種類は「トッピング」 */
export function likeTopping(genre) {
  return LIKE_TOPPINGS[genre] ?? "トッピング";
}

/**
 * まだ押していないときのボタンの文言。二郎系だけ、お店の決まり文句「ニンニク入れますか？」にする。
 * 押した後と、押せない人（未ログイン・自分の投稿）にはトッピング名だけを出す
 */
export function likeLabel(genre, liked) {
  if (genre === "二郎系" && !liked) return "ニンニク入れますか？";
  return likeTopping(genre);
}

/** { post_id, user_id } の配列から、投稿ごとの件数と、自分が押した投稿の id の Set を作る */
export function summarizeLikes(rows, myUserId) {
  const counts = {};
  const mine = new Set();
  for (const row of rows) {
    counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
    if (row.user_id === myUserId) mine.add(row.post_id);
  }
  return { counts, mine };
}

/** 押す・取り消すをしたあとの行の配列を返す（通信の結果を待たずに画面へ反映するため）。元の配列は変えない */
export function toggleLikeRows(rows, postId, userId, liked) {
  if (liked) return [...rows, { post_id: postId, user_id: userId }];
  return rows.filter((row) => !(row.post_id === postId && row.user_id === userId));
}
