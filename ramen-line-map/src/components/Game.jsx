import { useCallback, useEffect, useState } from "react";
import { ALL_STATIONS } from "../data/lines";

// 「投稿が多いのはどっち？」の2択クイズ。
// 路線図で使っている counts をそのまま流用しているので追加の通信はいらない。

// 件数が同じだと問題として成立しないので、差がある組み合わせを探す。
// 全駅0件のような状態だと見つからないので、その時は null を返して諦める
function pickPair(counts) {
  for (let i = 0; i < 40; i++) {
    const a = ALL_STATIONS[Math.floor(Math.random() * ALL_STATIONS.length)];
    const b = ALL_STATIONS[Math.floor(Math.random() * ALL_STATIONS.length)];
    if (a.id === b.id) continue;
    if ((counts[a.id] ?? 0) === (counts[b.id] ?? 0)) continue;
    return [a, b];
  }
  return null;
}

export default function Game({ counts }) {
  const [pair, setPair] = useState(null);
  const [answered, setAnswered] = useState(null); // 選んだ駅の id
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const next = useCallback(() => {
    setPair(pickPair(counts));
    setAnswered(null);
  }, [counts]);

  useEffect(() => {
    next();
  }, [next]);

  if (!pair) {
    return (
      <p className="empty">
        投稿がまだ少ないのでゲームを作れませんでした。何店舗か記録してから戻ってきてください。
      </p>
    );
  }

  const [a, b] = pair;
  const winnerId = (counts[a.id] ?? 0) > (counts[b.id] ?? 0) ? a.id : b.id;

  function choose(id) {
    if (answered) return; // 連打対策
    setAnswered(id);
    setScore((s) => ({ correct: s.correct + (id === winnerId ? 1 : 0), total: s.total + 1 }));
  }

  return (
    <div className="game">
      <p className="game-question">ラーメンの記録が多いのはどっち？</p>

      <div className="game-choices">
        {[a, b].map((st) => (
          <button
            key={st.id}
            className={
              answered
                ? st.id === winnerId
                  ? "game-choice is-correct"
                  : "game-choice is-wrong"
                : "game-choice"
            }
            onClick={() => choose(st.id)}
          >
            <span className="game-choice-name">{st.name}</span>
            {answered && <span className="game-choice-count">{counts[st.id] ?? 0}件</span>}
          </button>
        ))}
      </div>

      {answered && (
        <>
          <p className="game-result">{answered === winnerId ? "正解" : "はずれ"}</p>
          <button className="button primary" onClick={next}>
            次の問題
          </button>
        </>
      )}

      <p className="game-score">
        {score.correct} / {score.total} 問正解
      </p>
    </div>
  );
}
