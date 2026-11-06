// 予定の保存先。サーバーを立てず、ブラウザの localStorage に置いている。
//
// localStorage … ブラウザにキーと文字列を保存する仕組み。タブを閉じても消えない。
// 保存できるのは文字列だけなので、JSON.stringify で配列を文字列にしてから入れ、
// 読むときに JSON.parse で戻す。
//
// キーに /v1 を付けているのは、後でデータの形を変えたときに
// 古いデータを読み込んで壊れるのを避けるため（新しい形は /v2 にすればよい）。

const KEY = "shukatsu-timetable/v1";

/**
 * 保存済みの予定を読む。
 * シークレットウィンドウや設定で localStorage が使えない環境では
 * 読み書き自体が例外を投げるので、try/catch で握りつぶして空配列を返す
 * （保存はできないが、アプリは動く状態を保つ）。
 */
export function loadEvents() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValidEvent) : [];
  } catch (e) {
    console.error("予定の読み込みに失敗しました", e);
    return [];
  }
}

export function saveEvents(events) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events));
  } catch (e) {
    console.error("予定の保存に失敗しました", e);
  }
}

/** 壊れたデータが混ざっていても画面が落ちないように、最低限の形だけ確かめる */
function isValidEvent(e) {
  return (
    e &&
    typeof e === "object" &&
    typeof e.id === "string" &&
    typeof e.company === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.date ?? "")
  );
}

/**
 * 予定のID。crypto.randomUUID() は重複しないIDを作るブラウザ標準の関数だが、
 * httpsでない環境だと使えないことがあるので、使えなければ時刻＋乱数で代用する。
 */
export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
