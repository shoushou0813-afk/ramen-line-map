import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { fetchPostsByStation, fetchStationCounts, fetchUserGenreCounts } from "./lib/api/posts";
import { fetchHiddenRankUserIds } from "./lib/api/rankSettings";
import { hideRanks } from "./lib/rank";
import { LINES, LINE_ORDER } from "./data/lines";
import LineMap from "./components/LineMap";
import StationPanel from "./components/StationPanel";
import Reel from "./components/Reel";
import NameEditor from "./components/NameEditor";
import BackToTop from "./components/BackToTop";
import MyPage from "./components/MyPage";
import RankBadge from "./components/RankBadge";

const MODES = [
  { id: "map", label: "路線図" },
  { id: "reel", label: "リール" },
  { id: "mypage", label: "マイアカウント" },
];

export default function App() {
  const [mode, setMode] = useState("map");
  const [lineId, setLineId] = useState("yamanote");
  const [stationId, setStationId] = useState("shinjuku");
  const [session, setSession] = useState(null);
  const [counts, setCounts] = useState({});
  const [posts, setPosts] = useState([]);
  const [userGenreCounts, setUserGenreCounts] = useState({});
  const [hiddenRankUserIds, setHiddenRankUserIds] = useState(() => new Set());
  const [countsError, setCountsError] = useState("");
  const [postsError, setPostsError] = useState("");
  // 表示名を変えたら増やす。リールとマイアカウントの key に使い、作り直して投稿を読み直させる
  const [renameCount, setRenameCount] = useState(0);

  // --- ログイン状態 ---------------------------------------------------
  useEffect(() => {
    // 初回は、すでにログイン済みかを確認する（リロードしてもログイン状態を保つため）
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // 以降のログイン・ログアウトはここで受け取る
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // --- 駅ごとの件数 ---------------------------------------------------
  const loadCounts = useCallback(async () => {
    try {
      setCounts(await fetchStationCounts());
      setCountsError("");
    } catch (error) {
      console.error(error);
      setCountsError("記録の件数を読み込めませんでした。ページを再読み込みしてください。");
    }
  }, []);

  // --- レベルとラーメンマーク用の、ユーザーごとの種類別件数 -------------
  // 読めなくても投稿は見られるので、エラーは画面に出さずマークなしのままにする
  const loadUserGenreCounts = useCallback(async () => {
    try {
      setUserGenreCounts(await fetchUserGenreCounts());
    } catch (error) {
      console.error(error);
    }
  }, []);

  // --- レベルを非公開にしている人 -----------------------------------
  // 読めなくても困らないので、エラーは画面に出さず全員公開として扱う
  const loadHiddenRankUserIds = useCallback(async () => {
    try {
      setHiddenRankUserIds(await fetchHiddenRankUserIds());
    } catch (error) {
      console.error(error);
    }
  }, []);

  // --- 選択中の駅の投稿 -----------------------------------------------
  const loadPosts = useCallback(async () => {
    try {
      setPosts(await fetchPostsByStation(stationId));
      setPostsError("");
    } catch (error) {
      console.error(error);
      setPostsError("この駅の記録を読み込めませんでした。ページを再読み込みしてください。");
    }
  }, [stationId]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    loadUserGenreCounts();
  }, [loadUserGenreCounts]);

  useEffect(() => {
    loadHiddenRankUserIds();
  }, [loadHiddenRankUserIds]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // 投稿・削除の後は件数・レベル・一覧をすべて取り直す
  const refresh = useCallback(() => {
    loadCounts();
    loadUserGenreCounts();
    loadPosts();
  }, [loadCounts, loadUserGenreCounts, loadPosts]);

  // 表示名を変えた後は、過去の投稿の名前も変わっているので一覧を取り直す
  const handleRenamed = useCallback(() => {
    loadPosts();
    setRenameCount((n) => n + 1);
  }, [loadPosts]);

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
  // 投稿一覧など、ほかの人も見る場所ではこちらを使う（非公開の人のレベルは出さない）
  const visibleGenreCounts = hideRanks(userGenreCounts, hiddenRankUserIds);

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
            <NameEditor
              user={session.user}
              badge={<RankBadge genreCounts={userGenreCounts[session.user.id]} showTitle={false} />}
              onSaved={handleRenamed}
            >
              <button className="tab" onClick={signOut}>
                ログアウト
              </button>
            </NameEditor>
          ) : (
            <button className="tab" onClick={signIn}>
              Googleでログイン
            </button>
          )}
        </div>
      </header>

      {countsError && <p className="error">{countsError}</p>}
      {postsError && <p className="error">{postsError}</p>}

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
            userGenreCounts={visibleGenreCounts}
            onChanged={refresh}
          />
        </>
      )}

      {mode === "reel" && (
        <section className="card">
          <h2 className="card-title">リール</h2>
          <Reel key={renameCount} userGenreCounts={visibleGenreCounts} />
        </section>
      )}

      {mode === "mypage" && (
        <section className="card">
          <h2 className="card-title">マイアカウント</h2>
          {session ? (
            <MyPage
              key={renameCount}
              session={session}
              userGenreCounts={userGenreCounts}
              visibleGenreCounts={visibleGenreCounts}
              rankHidden={hiddenRankUserIds.has(session.user.id)}
              onChanged={refresh}
              onRankHiddenChanged={loadHiddenRankUserIds}
            />
          ) : (
            <p className="empty">ログインすると、自分のレベル・称号と投稿の一覧を見られます。</p>
          )}
        </section>
      )}

      <BackToTop />
    </div>
  );
}
