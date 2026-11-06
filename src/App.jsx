import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { fetchPostsByStation, fetchStationCounts, fetchUserGenreCounts } from "./lib/api/posts";
import { fetchHiddenRankUserIds } from "./lib/api/rankSettings";
import { fetchAllLikes, likePost, unlikePost } from "./lib/api/likes";
import { summarizeLikes, toggleLikeRows } from "./lib/likes";
import { hideRanks } from "./lib/rank";
import { LINES, LINE_ORDER, linesOfStation } from "./data/lines";
import { favoriteStationIds, toggleFavorite, canAddFavorite, saveFavoriteStations } from "./lib/api/favorites";
import LineMap from "./components/LineMap";
import StationPanel from "./components/StationPanel";
import Reel from "./components/Reel";
import NameEditor from "./components/NameEditor";
import BackToTop from "./components/BackToTop";
import MyPage from "./components/MyPage";
import RankBadge from "./components/RankBadge";
import { LikesContext } from "./components/LikeButton";
import FavoriteStations from "./components/FavoriteStations";

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
  const [likeRows, setLikeRows] = useState([]); // 全部のいいね（{ post_id, user_id }）
  const [countsError, setCountsError] = useState("");
  const [postsError, setPostsError] = useState("");
  // 表示名を変えたら増やす。リールとマイアカウントの key に使い、作り直して投稿を読み直させる
  const [renameCount, setRenameCount] = useState(0);
  // 駅を選んだら、路線図が画面の一番上に来るまでスクロールするために使う
  const mapRef = useRef(null);
  const [favoriteSaving, setFavoriteSaving] = useState(false);
  const [favoriteError, setFavoriteError] = useState("");
  // 開いたときに一度だけ、1番目のお気に入り駅を選んでおくための印
  const openedFavoriteRef = useRef(false);

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

  // --- いいね（トッピング） -------------------------------------------
  // 読めなくても投稿は見られるので、エラーは画面に出さず0件として扱う
  const loadLikes = useCallback(async () => {
    try {
      setLikeRows(await fetchAllLikes());
    } catch (error) {
      console.error(error);
    }
  }, []);

  // 押したらすぐ画面に反映し、保存に失敗したら読み直して元に戻す
  const userId = session?.user?.id ?? null;
  const toggleLike = useCallback(
    async (postId, liked) => {
      if (!userId) return;
      setLikeRows((rows) => toggleLikeRows(rows, postId, userId, liked));
      try {
        await (liked ? likePost(postId, userId) : unlikePost(postId, userId));
      } catch (error) {
        console.error(error);
        loadLikes();
      }
    },
    [userId, loadLikes]
  );

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
    loadLikes();
  }, [loadLikes]);

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

  // お気に入りは session の user_metadata から読む。保存すると session ごと入れ替わるので、別に state は持たない
  const favoriteIds = favoriteStationIds(session?.user);

  // 開いたとき、お気に入りがあれば1番目の駅とその路線を最初から出しておく
  useEffect(() => {
    if (openedFavoriteRef.current || !session) return;
    openedFavoriteRef.current = true;
    const first = favoriteIds[0];
    if (!first) return;
    setLineId(linesOfStation(first)[0]);
    setStationId(first);
  }, [session, favoriteIds]);

  // 駅を押したら、路線図の上端が画面の一番上に来るまで下げる。
  // 路線図は全部見えたまま押せて、空いた下の部分にその駅の記録が出る
  function selectStation(id) {
    setStationId(id);
    const map = mapRef.current;
    if (!map) return;
    window.scrollTo({ top: window.scrollY + map.getBoundingClientRect().top - 8, behavior: "smooth" });
  }

  // お気に入り駅を押したら、今の路線にその駅があればそのまま、なければその駅がある路線に切り替える
  function selectFavorite(id) {
    const lines = linesOfStation(id);
    if (!lines.includes(lineId)) setLineId(lines[0]);
    selectStation(id);
  }

  async function handleToggleFavorite() {
    setFavoriteSaving(true);
    setFavoriteError("");
    try {
      await saveFavoriteStations(toggleFavorite(favoriteIds, stationId));
    } catch (error) {
      console.error(error);
      setFavoriteError("お気に入りを保存できませんでした。もう一度試してください。");
    }
    setFavoriteSaving(false);
  }

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
  const likes = { ...summarizeLikes(likeRows, userId), userId, onToggle: toggleLike };

  return (
    <LikesContext.Provider value={likes}>
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
          {session && (
            <FavoriteStations
              favoriteIds={favoriteIds}
              counts={counts}
              selectedId={stationId}
              onSelect={selectFavorite}
            />
          )}

          <section className="card">
            <h2 className="card-title">路線図</h2>
            <div ref={mapRef}>
              <LineMap line={line} counts={counts} selectedId={stationId} onSelect={selectStation} />
            </div>
          </section>

          <StationPanel
            stationId={stationId}
            posts={posts}
            session={session}
            userGenreCounts={visibleGenreCounts}
            onChanged={refresh}
            favorite={
              session && {
                on: favoriteIds.includes(stationId),
                canAdd: canAddFavorite(favoriteIds),
                saving: favoriteSaving,
                error: favoriteError,
                onToggle: handleToggleFavorite,
              }
            }
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
    </LikesContext.Provider>
  );
}
