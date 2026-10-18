import { useState } from "react";
import { deletePost } from "../lib/api/posts";
import Stars from "./Stars";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function PostList({ posts, session, onChanged }) {
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete(post) {
    // 本人以外が削除できないことは RLS で保証しているので、ここでは確認だけ取る
    if (!window.confirm("この記録を削除しますか？")) return;

    try {
      await deletePost(post);
      setDeleteError("");
      onChanged();
    } catch (error) {
      console.error(error);
      setDeleteError("削除に失敗しました。もう一度試してください。");
    }
  }

  if (posts.length === 0) {
    return <p className="empty">まだ記録がありません。最初の一杯を登録しましょう。</p>;
  }

  return (
    <>
      {deleteError && <p className="error">{deleteError}</p>}
      <ul className="post-list">
      {posts.map((p) => (
        <li key={p.id} className="post">
          <div className="post-head">
            <span className="post-shop">{p.shop_name}</span>
            <span className="tag">{p.genre}</span>
          </div>
          <Stars value={p.rating ?? 0} />
          {p.memo && <p className="post-memo">{p.memo}</p>}
          {p.image_url && <img className="post-image" src={p.image_url} alt={p.shop_name} loading="lazy" />}
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
        </li>
      ))}
      </ul>
    </>
  );
}
