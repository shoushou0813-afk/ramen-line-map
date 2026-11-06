import { stationName } from "../data/lines";

// 最初の画面（路線図タブ）の一番上に出す、自分のお気に入り駅の一覧。
// 押すとその駅を選び、路線図もその駅がある路線に切り替える
export default function FavoriteStations({ favoriteIds, counts, selectedId, onSelect }) {
  return (
    <section className="card">
      <h2 className="card-title">お気に入り駅</h2>
      {favoriteIds.length === 0 ? (
        <p className="empty">駅を選んで「☆ お気に入りに追加」を押すと、ここに出ます。</p>
      ) : (
        <div className="favorite-list">
          {favoriteIds.map((id) => (
            <button
              key={id}
              className={id === selectedId ? "favorite is-selected" : "favorite"}
              onClick={() => onSelect(id)}
            >
              <span className="favorite-name">{stationName(id)}</span>
              <span className="favorite-count">{counts[id] ?? 0}件</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
