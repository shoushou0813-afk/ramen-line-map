import { useState } from "react";
import { deletePost } from "../lib/api/posts";
import { postDate } from "../lib/date";
import { stationName } from "../data/lines";
import { DEFAULT_SORT, sortPosts } from "../lib/sortPosts";
import SortSelect from "./SortSelect";
import RankBadge from "./RankBadge";
import Stars from "./Stars";

// showStation を付けると駅名も出す（駅をまたいで並べるマイアカウント用）
export default function PostList({ posts, session, userGenreCounts, onChanged, showStation = false }) {
  const [deleteError, setDeleteError] = useState("");
  const [sortId, setSortId] = useState(DEFAULT_SORT);

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
      <SortSelect value={sortId} onChange={setSortId} />
      <ul className="post-list">
      {sortPosts(posts, sortId).map((p) => (
        <li key={p.id} className="post">
          {showStation && <div className="reel-station">{stationName(p.station_id)}</div>}
          <div className="post-head">
            <span className="post-shop">{p.shop_name}</span>
            <span className="tag">{p.genre}</span>
          </div>
          <Stars value={p.rating ?? 0} />
          {p.memo && <p className="post-memo">{p.memo}</p>}
          {p.image_url && <img className="post-image" src={p.image_url} alt={p.shop_name} loading="lazy" />}
          <div className="post-foot">
            <span className="post-author">
              {p.user_name}
              <RankBadge genreCounts={userGenreCounts[p.user_id]} /> ・ {postDate(p)}
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
