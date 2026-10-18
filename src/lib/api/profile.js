import { supabase } from "../supabase";

// 表示名まわりの Supabase 呼び出しはこのファイルにまとめる。
// 表示名は Supabase の user_metadata に display_name として保存する（テーブルを増やさずに済むため）。
// Google ログインのたびに上書きされる name とは別のキーにしているので、ログインし直しても消えない。

export const MAX_DISPLAY_NAME_LENGTH = 20;

/** 画面と投稿に使う名前。自分で決めた名前があればそれを、なければ Google の名前を使う */
export function displayName(user) {
  const meta = user?.user_metadata ?? {};
  return meta.display_name || meta.name || "名無し";
}

/** 入力された名前に問題があればエラーメッセージを返す。問題がなければ空文字 */
export function validateDisplayName(name) {
  const trimmed = name.trim();
  if (!trimmed) return "名前を入力してください";
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) return `名前は${MAX_DISPLAY_NAME_LENGTH}文字以内にしてください`;
  return "";
}

/**
 * 表示名を保存する。
 * 保存に成功すると onAuthStateChange に USER_UPDATED が届き、App の session も新しい名前に入れ替わる。
 */
export async function updateDisplayName(name) {
  const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } });
  if (error) throw error;
}
