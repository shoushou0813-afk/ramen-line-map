import { useState } from "react";
import { supabase } from "../lib/supabase";
import { removeImage } from "../lib/storage";
import PostCard from "./PostCard";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function PostList({ posts, session, loading, onChanged }) {
  const [error, setError] = useState("");

  async function handleDelete(post) {
    // RLS で本人以外は消せないようにしてあるので、ここでは確認だけ取る
    if (!window.confirm("この記録を削除しますか？")) return;

    setError("");
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", post.id);
    if (deleteError) {
      console.error(deleteError);
      setError("削除に失敗しました。時間をおいて試してください。");
      return;
    }

    // 画像が残っても投稿の削除自体は成功しているので、ここでは失敗を握りつぶす
    if (post.image_url) await removeImage(post.image_url);

    onChanged();
  }

  if (loading) return <p className="empty">読み込み中...</p>;

  if (posts.length === 0) {
    return <p className="empty">まだ記録がありません。最初の一杯を登録しましょう。</p>;
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <ul className="post-list">
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            head={
              <div className="post-head">
                <span className="post-shop">{p.shop_name}</span>
                <span className="tag">{p.genre}</span>
              </div>
            }
            foot={
              <div className="post-foot">
                <span>
                  {p.user_name} ・ {formatDate(p.created_at)}
                </span>
                {session?.user?.id === p.user_id && (
                  <button className="link-button" onClick={() => handleDelete(p)}>
                    削除
                  </button>
                )}
              </div>
            }
          />
        ))}
      </ul>
    </>
  );
}
