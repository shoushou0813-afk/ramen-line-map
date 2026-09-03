import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { stationName } from "../data/lines";
import PostCard from "./PostCard";

// 路線に関係なく、新しい順に全投稿を流し見するタブ
export default function Reel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true; // 読み込み中にタブが切り替わった時に setState しないための目印

    (async () => {
      const { data, error: loadError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!alive) return;
      if (loadError) {
        console.error(loadError);
        setError("読み込みに失敗しました。時間をおいて再読み込みしてください。");
      }
      setPosts(data ?? []);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="empty">読み込み中...</p>;
  if (error) return <p className="error">{error}</p>;
  if (posts.length === 0) return <p className="empty">まだ記録がありません。</p>;

  return (
    <div className="reel">
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          as="article"
          className="reel-card"
          head={
            <>
              <div className="reel-station">{stationName(p.station_id)}</div>
              <div className="reel-shop">{p.shop_name}</div>
              <span className="tag">{p.genre}</span>
            </>
          }
          foot={
            <div className="post-foot">
              <span>{p.user_name}</span>
            </div>
          }
        />
      ))}
    </div>
  );
}
