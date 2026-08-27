import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { LINES, LINE_ORDER } from "./data/lines";
import LineMap from "./components/LineMap";
import StationPanel from "./components/StationPanel";
import Reel from "./components/Reel";

const MODES = [
  { id: "map", label: "路線図" },
  { id: "reel", label: "リール" },
];

export default function App() {
  const [mode, setMode] = useState("map");
  const [lineId, setLineId] = useState("yamanote");
  const [stationId, setStationId] = useState("shinjuku");
  const [session, setSession] = useState(null);
  const [counts, setCounts] = useState({});
  const [posts, setPosts] = useState([]);

  // --- ログイン状態 ---------------------------------------------------
  useEffect(() => {
    // 初回はすでにログイン済みかを取りに行く（リロードしてもログインが続くように）
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // 以降のログイン／ログアウトはこっちで拾う
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // --- 駅ごとの件数 ---------------------------------------------------
  // 駅ごとに問い合わせると13回通信が飛ぶので、station_id だけ全部取って
  // 手元で数える方式にした。件数が数万件を超えたら SQL 側で group by に変える
  const loadCounts = useCallback(async () => {
    const { data, error } = await supabase.from("posts").select("station_id");
    if (error) {
      console.error(error);
      return;
    }
    const next = {};
    for (const row of data) {
      next[row.station_id] = (next[row.station_id] ?? 0) + 1;
    }
    setCounts(next);
  }, []);

  // --- 選択中の駅の投稿 -----------------------------------------------
  const loadPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("station_id", stationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }
    setPosts(data ?? []);
  }, [stationId]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 投稿・削除の後は件数と一覧の両方を取り直す
  const refresh = useCallback(() => {
    loadCounts();
    loadPosts();
  }, [loadCounts, loadPosts]);

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      // ログイン後に戻ってくる先。Vercel と localhost で変わるので固定値にしない
      options: { redirectTo: window.location.origin },
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const line = LINES[lineId];

  return (
    <div className="page">
      <header className="header">
        <h1 className="title">ラーメン路線図マップ</h1>
        <p className="lead">駅を選ぶと、その駅周辺のラーメン記録を見られます。</p>

        <nav className="tabs">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={mode === m.id ? "tab is-active" : "tab"}
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </nav>

        <nav className="tabs">
          {LINE_ORDER.map((id) => (
            <button
              key={id}
              className={lineId === id ? "tab is-active" : "tab"}
              onClick={() => setLineId(id)}
            >
              {LINES[id].name}
            </button>
          ))}
        </nav>

        <div className="auth">
          {session ? (
            <>
              <span className="auth-name">{session.user.user_metadata?.name ?? "ログイン中"}</span>
              <button className="button" onClick={signOut}>
                ログアウト
              </button>
            </>
          ) : (
            <button className="button" onClick={signIn}>
              Googleでログイン
            </button>
          )}
        </div>
      </header>

      {mode === "map" && (
        <>
          <section className="card">
            <h2 className="card-title">路線図</h2>
            <LineMap line={line} counts={counts} selectedId={stationId} onSelect={setStationId} />
          </section>

          <StationPanel
            stationId={stationId}
            posts={posts}
            session={session}
            onChanged={refresh}
          />
        </>
      )}

      {mode === "reel" && (
        <section className="card">
          <h2 className="card-title">リール</h2>
          <Reel />
        </section>
      )}
    </div>
  );
}
