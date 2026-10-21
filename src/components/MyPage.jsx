import { useCallback, useEffect, useState } from "react";
import { fetchPostsByUser } from "../lib/api/posts";
import { updateRankHidden } from "../lib/api/rankSettings";
import { displayName } from "../lib/api/profile";
import { GENRES } from "../data/lines";
import { MAX_LEVEL, postsToNextLevel, userRank } from "../lib/rank";
import PostList from "./PostList";
import RamenMark from "./RamenMark";
import RankBadge from "./RankBadge";

// マイアカウント。自分のレベルと称号、自分が投稿した記録の一覧を出す。
// userGenreCounts は全員分そのまま、visibleGenreCounts は非公開の人を隠した「ほかの人から見える」版
export default function MyPage({
  session,
  userGenreCounts,
  visibleGenreCounts,
  rankHidden,
  onChanged,
  onRankHiddenChanged,
}) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingRankHidden, setSavingRankHidden] = useState(false);
  const [rankHiddenError, setRankHiddenError] = useState("");

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

  // 削除したら自分の一覧と、レベル・件数（App 側）の両方を取り直す
  function handleChanged() {
    loadPosts();
    onChanged();
  }

  async function handleRankHiddenChange(e) {
    setSavingRankHidden(true);
    try {
      await updateRankHidden(userId, e.target.checked);
      setRankHiddenError("");
      await onRankHiddenChanged();
    } catch (saveError) {
      console.error(saveError);
      setRankHiddenError("設定を保存できませんでした。もう一度試してください。");
    }
    setSavingRankHidden(false);
  }

  const genreCounts = userGenreCounts[userId];
  const { count, level, title } = userRank(genreCounts);
  const nextIn = postsToNextLevel(count);

  return (
    <>
      <div className="mypage-profile">
        <RankBadge genreCounts={genreCounts} size={40} showTitle={false} />
        <div>
          <div className="mypage-name">{displayName(session.user)}</div>
          <div className="mypage-title">{title ?? "ラーメンを投稿しよう！"}</div>
          <div className="mypage-rank">
            Lv.{level} / {MAX_LEVEL} ・ 投稿 {count} 件
          </div>
          <div className="mypage-next">
            {nextIn === 0 ? "最高レベルです" : `あと ${nextIn} 件投稿で Lv.${level + 1}`}
          </div>
        </div>
      </div>

      <label className="rank-hidden-toggle">
        <input
          type="checkbox"
          checked={rankHidden}
          onChange={handleRankHiddenChange}
          disabled={savingRankHidden}
        />
        レベルを非公開にする（ほかの人には名前の横のマーク・レベル・称号が表示されません）
      </label>
      {rankHiddenError && <p className="error">{rankHiddenError}</p>}

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
          userGenreCounts={visibleGenreCounts}
          onChanged={handleChanged}
          showStation
        />
      )}
    </>
  );
}
