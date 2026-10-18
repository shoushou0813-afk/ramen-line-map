// 日付の表示と入力欄まわりの小さな関数

/** Date を <input type="date"> の値の形（YYYY-MM-DD）にする。端末の時刻（日本なら日本時間）で日付を決める */
export function toDateInputValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 投稿に表示する日付（YYYY/M/D）。
 * 食べた日（visited_on）があればそれを、日付欄ができる前の投稿は投稿した日時を使う。
 * visited_on は "2026-10-18" の形の文字列。new Date() に渡すと UTC として読まれて日付がずれることがあるので、文字列のまま分解する。
 */
export function postDate(post) {
  if (post.visited_on) {
    const [y, m, d] = post.visited_on.split("-").map(Number);
    return `${y}/${m}/${d}`;
  }
  const d = new Date(post.created_at);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 日付欄の値に問題があればエラーメッセージを返す。問題がなければ空文字 */
export function validateVisitedOn(value, today = toDateInputValue(new Date())) {
  if (!value) return "日付を選択してください";
  // YYYY-MM-DD の文字列はそのまま大小比較すれば日付の前後と一致する
  if (value > today) return "未来の日付は選べません";
  return "";
}
