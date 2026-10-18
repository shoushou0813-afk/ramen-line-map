import { supabase } from "../supabase";
import { displayName } from "./profile";

// 投稿まわりの Supabase 呼び出しはこのファイルにまとめる。
// 画面の部品からは supabase.from() を直接呼ばず、ここの関数だけを使う。

const IMAGE_BUCKET = "post-images";

/** station_id の配列から「駅ID → 件数」の対応表を作る */
export function countByStation(rows) {
  const counts = {};
  for (const row of rows) {
    counts[row.station_id] = (counts[row.station_id] ?? 0) + 1;
  }
  return counts;
}

/** 画像の公開URLから、ストレージ上のパス（バケット名より後ろ）を取り出す */
export function storagePathFromUrl(url) {
  return url.split(`/${IMAGE_BUCKET}/`)[1] ?? null;
}

/**
 * 駅ごとの投稿件数を取得する。
 * 駅ごとに問い合わせると駅の数だけ通信が発生するため、station_id だけをまとめて取得して手元で数える。
 * 件数が数万件を超えたら、SQL 側の group by に切り替える。
 */
export async function fetchStationCounts() {
  const { data, error } = await supabase.from("posts").select("station_id");
  if (error) throw error;
  return countByStation(data);
}

/** 指定した駅の投稿を新しい順に取得する */
export async function fetchPostsByStation(stationId) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("station_id", stationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * 店名の部分一致検索に使う ilike のパターンを作る。
 * % と _ は ilike では「何でもよい文字」の意味になるので、入力にそのまま含まれていたら \ で打ち消す。
 */
export function shopNamePattern(query) {
  const escaped = query.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}

/**
 * 路線に関係なく、新しい投稿を最大 limit 件取得する。
 * shopQuery を渡すと、店名にその文字を含む投稿だけに絞る（大文字・小文字は区別しない）。
 */
export async function fetchLatestPosts(limit = 50, shopQuery = "") {
  let request = supabase.from("posts").select("*");
  if (shopQuery.trim()) request = request.ilike("shop_name", shopNamePattern(shopQuery));

  const { data, error } = await request.order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

/** 画像をアップロードし、公開URLを返す。ファイル名の衝突を避けるため UUID を使う */
export async function uploadPostImage(file, userId) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file);
  if (error) throw error;

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * 投稿を保存する。
 * user_id は RLS のポリシーで本人確認に使うため、必ずログイン中のユーザーの id を入れる。
 * user_name は表示のたびに認証情報を取りに行かずに済むよう、投稿時点の表示名を保存している（意図的な非正規化）。
 */
export async function createPost({ session, stationId, shopName, genre, memo, rating, visitedOn, imageUrl }) {
  const { error } = await supabase.from("posts").insert({
    station_id: stationId,
    shop_name: shopName,
    genre,
    memo,
    rating,
    visited_on: visitedOn,
    image_url: imageUrl,
    user_id: session.user.id,
    user_name: displayName(session.user),
  });
  if (error) throw error;
}

/**
 * 投稿を削除し、画像があればストレージからも消す。
 * 本人以外が削除できないことは RLS で保証している。
 */
export async function deletePost(post) {
  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) throw error;

  if (!post.image_url) return;
  const path = storagePathFromUrl(post.image_url);
  if (path) await supabase.storage.from(IMAGE_BUCKET).remove([path]);
}
