import { createContext, useContext } from "react";
import { likeLabel, likeTopping } from "../lib/likes";

// いいねの件数・自分が押したか・押したときの処理は App が持ち、この context で一覧の部品に渡す。
// StationPanel や MyPage を通して何段も props で渡さずに済むようにするため
export const LikesContext = createContext({ counts: {}, mine: new Set(), userId: null, onToggle: () => {} });

// 種類ごとのトッピングの絵。押していないときは灰色にする
const ICONS = {
  二郎系: (
    <>
      <path d="M12 3 Q9 5 9.5 8 Q5 9 5.5 14 Q6 20 12 20.5 Q18 20 18.5 14 Q19 9 14.5 8 Q15 5 12 3Z" fill="#f3e3a4" stroke="#c9b36a" strokeWidth="0.8" />
      <path d="M12 8 V20 M9 9.5 Q8 15 10 19.5 M15 9.5 Q16 15 14 19.5" stroke="#c9b36a" strokeWidth="0.6" fill="none" />
    </>
  ),
  家系: (
    <>
      <rect x="6" y="3" width="12" height="18" rx="1" fill="#1f3a24" stroke="#0f2414" strokeWidth="0.6" />
      <path d="M8 7 H16 M8 11 H16 M8 15 H16" stroke="#2f5a38" strokeWidth="0.6" />
    </>
  ),
  醤油: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="#fff" stroke="#e05587" strokeWidth="1.2" />
      <path d="M12 12 m-3.5 0 a3.5 3.5 0 1 1 3.5 3.5 a5.5 5.5 0 1 1 -5.5 -5.5" fill="none" stroke="#e05587" strokeWidth="1.1" />
    </>
  ),
  味噌: (
    <g fill="#f6cf2b" stroke="#d9a90e" strokeWidth="0.5">
      <circle cx="8" cy="8" r="3" />
      <circle cx="15" cy="7" r="3" />
      <circle cx="11.5" cy="13" r="3" />
      <circle cx="17" cy="14" r="3" />
      <circle cx="7" cy="16" r="3" />
    </g>
  ),
  塩: (
    <>
      <circle cx="12" cy="12" r="9" fill="#fff59d" stroke="#f2c94c" strokeWidth="1.4" />
      <path d="M12 3.5 V20.5 M3.5 12 H20.5 M6 6 L18 18 M18 6 L6 18" stroke="#f2c94c" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="1.5" fill="#f2c94c" />
    </>
  ),
  つけ麺: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="7" fill="#fff" stroke="#e2d2a8" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="4" fill="#f29a1d" />
    </>
  ),
  その他: (
    <>
      <circle cx="12" cy="12" r="8" fill="#f4a300" stroke="#fff3c4" strokeWidth="1.5" />
      <ellipse cx="9.5" cy="9.5" rx="2" ry="1.2" fill="#ffd166" />
    </>
  ),
};

// 投稿に「トッピングを乗せる」いいねボタン。乗せるトッピングは投稿のラーメンの種類で変わる。
// 自分の投稿と、ログインしていないときは押せず、件数だけを出す
export default function LikeButton({ post }) {
  const { counts, mine, userId, onToggle } = useContext(LikesContext);
  const count = counts[post.id] ?? 0;
  const liked = mine.has(post.id);
  const own = userId === post.user_id;
  const canPress = Boolean(userId) && !own;
  const topping = likeTopping(post.genre);

  const className = ["like-button", liked && "is-liked", !canPress && "is-disabled"].filter(Boolean).join(" ");
  const label = canPress ? likeLabel(post.genre, liked) : topping;
  const hint = !userId ? "ログインすると押せます" : own ? "自分の投稿には押せません" : liked ? `${topping}を取り消す` : `${topping}を乗せる`;

  return (
    <button
      type="button"
      className={className}
      onClick={() => canPress && onToggle(post.id, !liked)}
      disabled={!canPress}
      aria-pressed={liked}
      title={hint}
      aria-label={`${hint}（${count}）`}
    >
      <svg className="like-icon" viewBox="0 0 24 24" aria-hidden="true">
        {ICONS[post.genre] ?? ICONS.その他}
      </svg>
      {label}
      {count > 0 && <span className="like-count">{count}</span>}
    </button>
  );
}
