import { supabase } from "../lib/supabase";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function PostList({ posts, session, onChanged }) {
  async function handleDelete(id) {
    // RLS で本人以外は消せないようにしてあるので、ここでは確認だけ取る
    if (!window.confirm("この記録を削除しますか？")) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      console.error(error);
      return;
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
          {p.memo && <p className="post-memo">{p.memo}</p>}
          <div className="post-foot">
            <span>
              {p.user_name} ・ {formatDate(p.created_at)}
            </span>
            {session?.user?.id === p.user_id && (
              <button className="link-button" onClick={() => handleDelete(p.id)}>
                削除
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
