import { supabase } from "../supabase";
import { displayName } from "./profile";
import { genresMatching, stationIdsMatching } from "../../data/lines";
import { genreCountsByUser } from "../rank";

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

// Supabase は1回の問い合わせで最大1000行しか返さず、超えた分はエラーにならずに切り捨てられる
export const PAGE_SIZE = 1000;

/**
 * fetchPage(from, to) を繰り返し呼び、全部の行を集めて返す。
 * 返ってきた行が PAGE_SIZE より少なければ、それが最後のページ。
 */
export async function fetchAllPages(fetchPage, pageSize = PAGE_SIZE) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

/** posts の指定した列を全件取得する。ページの境目で行が重複・欠落しないよう、id 順に固定して分けて取る */
async function selectAllPosts(columns) {
  return fetchAllPages(async (from, to) => {
    const { data, error } = await supabase.from("posts").select(columns).order("id").range(from, to);
    if (error) throw error;
    return data ?? [];
  });
}

/**
 * 駅ごとの投稿件数を取得する。
 * 駅ごとに問い合わせると駅の数だけ通信が発生するため、station_id だけをまとめて取得して手元で数える。
 * 1000行ずつ分けて取るので件数が増えても数はずれないが、数万件を超えたら SQL 側の group by に切り替える。
 */
export async function fetchStationCounts() {
  return countByStation(await selectAllPosts("station_id"));
}

/**
 * レベルとラーメンマークを出すため、全員分の「ユーザーID → 種類ごとの件数」を取得する。
 * 駅ごとの件数と同じく、必要な列だけを全件取得して手元で数える。
 */
export async function fetchUserGenreCounts() {
  return genreCountsByUser(await selectAllPosts("user_id, genre"));
}

/** 指定したユーザーの投稿を新しい順に取得する（マイアカウント用） */
export async function fetchPostsByUser(userId) {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
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

/** 複数の検索結果をまとめ、同じ投稿を1つにして新しい順に limit 件返す */
export function mergeNewest(lists, limit) {
  const byId = new Map();
  for (const post of lists.flat()) byId.set(post.id, post);
  return [...byId.values()]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
    .slice(0, limit);
}

async function newestPosts(limit, narrow = (request) => request) {
  const { data, error } = await narrow(supabase.from("posts").select("*"))
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

/**
 * 路線に関係なく、新しい投稿を最大 limit 件取得する。
 * query を渡すと、店名・駅名・ラーメンの種類のどれかに当てはまる投稿だけに絞る（店名は大文字・小文字を区別しない）。
 * 駅名は DB に入っておらず lines.js にしかないので、先に駅 id に直してから探す。種類も lines.js の一覧から当てはまるものを選ぶ。
 * 店名・駅・種類で探す問い合わせを別々に投げ、結果をまとめる。
 */
export async function fetchLatestPosts(limit = 50, query = "") {
  if (!query.trim()) return newestPosts(limit);

  const stationIds = stationIdsMatching(query);
  const genres = genresMatching(query);
  const [byShop, byStation, byGenre] = await Promise.all([
    newestPosts(limit, (request) => request.ilike("shop_name", shopNamePattern(query))),
    stationIds.length > 0 ? newestPosts(limit, (request) => request.in("station_id", stationIds)) : [],
    genres.length > 0 ? newestPosts(limit, (request) => request.in("genre", genres)) : [],
  ]);
  return mergeNewest([byShop, byStation, byGenre], limit);
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
