import { userRank } from "../lib/rank";
import RamenMark from "./RamenMark";

// 投稿者名の横に出す「ラーメンマーク + レベル + 称号」。genreCounts はその人の種類ごとの投稿件数。
// レベルを非公開にしている人は genreCounts が null で渡ってくるので、何も出さない。まだ投稿していない人にも出さない。
// showTitle を false にすると称号を省く（ヘッダーなど狭い場所用）
export default function RankBadge({ genreCounts, size, showTitle = true }) {
  if (genreCounts === null) return null;
  const { level, genre, title } = userRank(genreCounts);
  if (level === 0) return null;

  const label = `Lv.${level} ${title}`;
  return (
    <span className="rank-badge" title={label} aria-label={label}>
      <RamenMark genre={genre} size={size} />
      <span className="rank-number">Lv.{level}</span>
      {showTitle && <span className="rank-title">{title}</span>}
    </span>
  );
}
