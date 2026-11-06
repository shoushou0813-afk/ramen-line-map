import PostForm from "./PostForm";
import PostList from "./PostList";
import { stationName } from "../data/lines";
import { MAX_FAVORITES } from "../lib/api/favorites";

// favorite は、ログインしているときだけ渡される { on, canAdd, saving, error, onToggle }
export default function StationPanel({ stationId, posts, session, userGenreCounts, onChanged, favorite }) {
  return (
    <section className="card">
      <h2 className="card-title">{stationName(stationId)}駅周辺</h2>
      {favorite && (
        <div className="favorite-toggle">
          <button
            className={favorite.on ? "tab is-active" : "tab"}
            onClick={favorite.onToggle}
            disabled={favorite.saving || (!favorite.on && !favorite.canAdd)}
            aria-pressed={favorite.on}
          >
            {favorite.on ? "★ お気に入りから外す" : "☆ お気に入りに追加"}
          </button>
          {!favorite.on && !favorite.canAdd && (
            <p className="notice">お気に入りは{MAX_FAVORITES}駅までです。ほかの駅を外してから追加してください。</p>
          )}
          {favorite.error && <p className="error">{favorite.error}</p>}
        </div>
      )}
      <PostForm session={session} stationId={stationId} onPosted={onChanged} />
      <PostList posts={posts} session={session} userGenreCounts={userGenreCounts} onChanged={onChanged} />
    </section>
  );
}
