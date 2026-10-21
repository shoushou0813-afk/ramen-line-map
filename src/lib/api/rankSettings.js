import { supabase } from "../supabase";

// ランクの公開設定まわりの Supabase 呼び出しはこのファイルにまとめる。
// ほかの人のランクを出すかどうかを決めるのに使うので、user_metadata（本人しか読めない）ではなくテーブルに保存している。

/** ランクを非公開にしている人の user_id を Set で返す */
export async function fetchHiddenRankUserIds() {
  const { data, error } = await supabase.from("rank_settings").select("user_id").eq("hidden", true);
  if (error) throw error;
  return new Set(data.map((row) => row.user_id));
}

/** 自分のランクを非公開にするかどうかを保存する。行がなければ作り、あれば上書きする */
export async function updateRankHidden(userId, hidden) {
  const { error } = await supabase.from("rank_settings").upsert({ user_id: userId, hidden });
  if (error) throw error;
}
