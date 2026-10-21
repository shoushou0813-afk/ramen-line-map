import { userRank } from "../lib/rank";
import RamenMark from "./RamenMark";

// 投稿者名の横に出す「ラーメンマーク + ランク」。genreCounts はその人の種類ごとの投稿件数
export default function RankBadge({ genreCounts, size }) {
  const { rank, genre } = userRank(genreCounts);
  const label = genre ? `ランク${rank}（${genre}を一番多く投稿）` : `ランク${rank}`;
  return (
    <span className="rank-badge" title={label} aria-label={label}>
      <RamenMark genre={genre} size={size} />
      <span className="rank-number">{rank}</span>
    </span>
  );
}
