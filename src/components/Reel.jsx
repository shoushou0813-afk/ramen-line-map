import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { stationName } from "../data/lines";
import Stars from "./Stars";

// 路線に関係なく、新しい順に全投稿を流し見するタブ
export default function Reel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true; // 読み込み中にタブが切り替わった時に setState しないための目印

    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!alive) return;
      if (error) console.error(error);
      setPosts(data ?? []);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p className="empty">読み込み中...</p>;
  if (posts.length === 0) return <p className="empty">まだ記録がありません。</p>;

  return (
    <div className="reel">
      {posts.map((p) => (
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
  );
}
