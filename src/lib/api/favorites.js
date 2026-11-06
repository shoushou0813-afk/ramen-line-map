import { supabase } from "../supabase";
import { linesOfStation } from "../../data/lines";

// お気に入り駅まわりの Supabase 呼び出しはこのファイルにまとめる。
// 表示名と同じく user_metadata に favorite_stations（駅 id の配列）として保存する。
// テーブルを増やさずに済み、スマホとPCのどちらでログインしても同じお気に入りが出る。

// 最初の画面に並べるので、多すぎると路線図が下に押し出される
export const MAX_FAVORITES = 10;

/** 保存されているお気に入り駅の id。路線図から消した駅など、今はどの路線にもない駅は外す */
export function favoriteStationIds(user) {
  const list = user?.user_metadata?.favorite_stations;
  if (!Array.isArray(list)) return [];
  return list.filter((id) => linesOfStation(id).length > 0);
}

/** お気に入りに入っていれば外し、入っていなければ最後に足した配列を返す（元の配列は変えない） */
export function toggleFavorite(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** これ以上お気に入りを足せるか。入っている駅を外すのはいつでもできる */
export function canAddFavorite(list) {
  return list.length < MAX_FAVORITES;
}

/**
 * お気に入り駅を保存する。
 * 保存に成功すると onAuthStateChange に USER_UPDATED が届き、App の session も新しい内容に入れ替わる。
 */
export async function saveFavoriteStations(ids) {
  const { error } = await supabase.auth.updateUser({ data: { favorite_stations: ids } });
  if (error) throw error;
}
