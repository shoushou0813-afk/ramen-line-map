import { useEffect, useState } from "react";
import { fetchLatestPosts } from "../lib/api/posts";
import { stationName } from "../data/lines";
import { sortPosts } from "../lib/sortPosts";
import SortSelect from "./SortSelect";
import Stars from "./Stars";

// 路線に関係なく、新しい投稿50件を流し見するタブ。並び順は選べる
export default function Reel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortId, setSortId] = useState("posted");

  useEffect(() => {
    let alive = true; // 読み込み中にタブが切り替わったとき、画面から消えた部品の状態を更新しないための目印

    (async () => {
      try {
        const latest = await fetchLatestPosts(50);
        if (alive) setPosts(latest);
      } catch (loadError) {
        console.error(loadError);
        if (alive) setError("記録を読み込めませんでした。ページを再読み込みしてください。");
      }
      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="empty">読み込み中...</p>;
  if (error) return <p className="error">{error}</p>;
  if (posts.length === 0) return <p className="empty">まだ記録がありません。</p>;

  return (
    <>
      <SortSelect value={sortId} onChange={setSortId} />
      <div className="reel">
      {sortPosts(posts, sortId).map((p) => (
        <article key={p.id} className="reel-card">
          <div className="reel-station">{stationName(p.station_id)}</div>
          <div className="reel-shop">{p.shop_name}</div>
          <span className="tag">{p.genre}</span>
          <Stars value={p.rating ?? 0} />
          {p.memo && <p className="post-memo">{p.memo}</p>}
          {p.image_url && <img className="post-image" src={p.image_url} alt={p.shop_name} loading="lazy" />}
          <div className="post-foot">
            <span>{p.user_name}</span>
          </div>
        </article>
      ))}
    </div>
    </>
  );
}
