import { useCallback, useEffect, useState } from "react";
import { fetchPostsByUser } from "../lib/api/posts";
import { displayName } from "../lib/api/profile";
import { GENRES } from "../data/lines";
import { MAX_RANK, postsToNextRank, userRank } from "../lib/rank";
import PostList from "./PostList";
import RamenMark from "./RamenMark";
import RankBadge from "./RankBadge";

// マイアカウント。自分のランクと、自分が投稿した記録の一覧を出す
export default function MyPage({ session, userGenreCounts, onChanged }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userId = session.user.id;

  const loadPosts = useCallback(async () => {
    try {
      setPosts(await fetchPostsByUser(userId));
      setError("");
    } catch (loadError) {
      console.error(loadError);
      setError("自分の記録を読み込めませんでした。ページを再読み込みしてください。");
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 削除したら自分の一覧と、ランク・件数（App 側）の両方を取り直す
  function handleChanged() {
    loadPosts();
    onChanged();
  }

  const genreCounts = userGenreCounts[userId];
  const { count, rank } = userRank(genreCounts);
  const nextIn = postsToNextRank(count);

  return (
    <>
      <div className="mypage-profile">
        <RankBadge genreCounts={genreCounts} size={40} />
        <div>
          <div className="mypage-name">{displayName(session.user)}</div>
          <div className="mypage-rank">
            ランク {rank} / {MAX_RANK} ・ 投稿 {count} 件
          </div>
          <div className="mypage-next">
            {nextIn === 0 ? "最高ランクです" : `あと ${nextIn} 件投稿でランク ${rank + 1}`}
          </div>
        </div>
      </div>

      {count > 0 && (
        <ul className="genre-counts">
          {GENRES.filter((g) => genreCounts[g]).map((g) => (
            <li key={g} className="genre-count">
              <RamenMark genre={g} />
              {g} {genreCounts[g]}件
            </li>
          ))}
        </ul>
      )}

      <h3 className="form-title">自分の投稿</h3>
      {loading && <p className="empty">読み込み中...</p>}
      {!loading && error && <p className="error">{error}</p>}
      {!loading && !error && (
        <PostList
          posts={posts}
          session={session}
          userGenreCounts={userGenreCounts}
          onChanged={handleChanged}
          showStation
        />
      )}
    </>
  );
}
