import { supabase } from "../lib/supabase";
import Stars from "./Stars";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

// 画像の公開URLから storage 上のパスを取り出す（バケット名の後ろがパス）
function storagePathFromUrl(url) {
  return url.split("/post-images/")[1] ?? null;
}

export default function PostList({ posts, session, onChanged }) {
  async function handleDelete(post) {
    // RLS で本人以外は消せないようにしてあるので、ここでは確認だけ取る
    if (!window.confirm("この記録を削除しますか？")) return;

    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      console.error(error);
      return;
    }

    if (post.image_url) {
      const path = storagePathFromUrl(post.image_url);
      if (path) await supabase.storage.from("post-images").remove([path]);
    }

    onChanged();
  }

  if (posts.length === 0) {
    return <p className="empty">まだ記録がありません。最初の一杯を登録しましょう。</p>;
  }

  return (
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
  );
}
