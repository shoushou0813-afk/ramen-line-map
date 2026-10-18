import { useEffect, useState } from "react";
import { fetchLatestPosts } from "../lib/api/posts";
import { stationName } from "../data/lines";
import { DEFAULT_SORT, sortPosts } from "../lib/sortPosts";
import SortSelect from "./SortSelect";
import Stars from "./Stars";

// 入力が止まってから検索するまでの待ち時間（ミリ秒）。1文字打つたびに通信しないようにする
const SEARCH_DELAY = 300;

// 路線に関係なく、新しい投稿50件を流し見するタブ。店名・駅名・ラーメンの種類で検索でき、並び順も選べる
export default function Reel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortId, setSortId] = useState(DEFAULT_SORT);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true; // 読み込み中にタブが切り替わったり検索語が変わったりしたとき、古い結果で画面を上書きしないための目印

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const latest = await fetchLatestPosts(50, query);
        if (alive) {
          setPosts(latest);
          setError("");
        }
      } catch (loadError) {
        console.error(loadError);
        if (alive) setError("記録を読み込めませんでした。ページを再読み込みしてください。");
      }
      if (alive) setLoading(false);
    }, query ? SEARCH_DELAY : 0);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const searching = query.trim() !== "";

  return (
    <>
      <input
        className="input reel-search"
        type="search"
        placeholder="店名・駅名・種類で検索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="店名・駅名・種類で検索"
      />
      <SortSelect value={sortId} onChange={setSortId} />

      {loading && <p className="empty">読み込み中...</p>}
      {!loading && error && <p className="error">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="empty">{searching ? `「${query.trim()}」に当てはまる記録はありません。` : "まだ記録がありません。"}</p>
      )}

      {!loading && !error && posts.length > 0 && (
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
      )}
    </>
  );
}
