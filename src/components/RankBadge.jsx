import { userRank } from "../lib/rank";
import RamenMark from "./RamenMark";

// 投稿者名の横に出す「ラーメンマーク + レベル + 称号」。genreCounts はその人の種類ごとの投稿件数。
// レベルを非公開にしている人は genreCounts が null で渡ってくるので、何も出さない。
// まだ投稿していない人は Lv.0 で、マークは空の丼、称号はなし。
// showTitle を false にすると称号を省く（ヘッダーなど狭い場所用）
export default function RankBadge({ genreCounts, size, showTitle = true }) {
  if (genreCounts === null) return null;
  const { level, genre, stage, title } = userRank(genreCounts);

  const label = title ? `Lv.${level} ${title}` : `Lv.${level}`;
  return (
    <span className="rank-badge" title={label} aria-label={label}>
      <RamenMark genre={genre} size={size} stage={stage} />
      <span className="rank-number">Lv.{level}</span>
      {showTitle && title && <span className="rank-title">{title}</span>}
    </span>
  );
}
