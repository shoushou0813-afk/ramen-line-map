import { supabase } from "../supabase";
import { fetchAllPages } from "./posts";

// いいね（トッピングを乗せる）まわりの Supabase 呼び出しはこのファイルにまとめる。

/** 全部のいいねを { post_id, user_id } の配列で取得する。投稿と同じく1000行ずつ分けて取る */
export async function fetchAllLikes() {
  return fetchAllPages(async (from, to) => {
    const { data, error } = await supabase
      .from("post_likes")
      .select("post_id, user_id")
      .order("post_id")
      .order("user_id")
      .range(from, to);
    if (error) throw error;
    return data ?? [];
  });
}

/** いいねを押す。本人以外の名前で押せないことは RLS で保証している */
export async function likePost(postId, userId) {
  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (error) throw error;
}

/** いいねを取り消す */
export async function unlikePost(postId, userId) {
  const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}
